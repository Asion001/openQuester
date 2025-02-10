import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  UPLOAD_FILE_LINK_EXPIRES_IN,
  UPLOAD_PACKAGE_LINKS_EXPIRES_IN,
} from "constants/storage";
import { Database } from "database/Database";
import { File } from "database/models/File";
import { Package } from "database/models/Package";
import { Permission } from "database/models/Permission";
import { User } from "database/models/User";
import { FileRepository } from "database/repositories/FileRepository";
import { FileUsageRepository } from "database/repositories/FileUsageRepository";
import { PackageRepository } from "database/repositories/PackageRepository";
import { UserRepository } from "database/repositories/UserRepository";
import { ClientResponse } from "enums/ClientResponse";
import { FileSource } from "enums/file/FileSource";
import { AgeRestriction } from "enums/game/AgeRestriction";
import { HttpStatus } from "enums/HttpStatus";
import { Permissions } from "enums/Permissions";
import { ClientError } from "error/ClientError";
import { ContentStructureService } from "services/ContentStructureService";
import { ApiContext } from "services/context/ApiContext";
import { DependencyService } from "services/dependency/DependencyService";
import { Session } from "types/auth/session";
import { FileDTO } from "types/dto/file/FileDTO";
import { PackageListItemDTO } from "types/dto/game/items/PackageIListItemDTO";
import { S3Context } from "types/file/S3Context";
import { StorageServiceModel } from "types/file/StorageServiceModel";
import { OQContentStructure } from "types/file/structures/OQContentStructure";
import { PackageModel } from "types/package/PackageModel";
import { PackageUploadResponse } from "types/package/PackageUploadResponse";
import { PaginatedResult } from "types/pagination/PaginatedResult";
import { PaginationOpts } from "types/pagination/PaginationOpts";
import { SelectOptions } from "types/SelectOptions";
import { UsageEntries } from "types/usage/usage";
import { StorageUtils } from "utils/StorageUtils";
import { ValueUtils } from "utils/ValueUtils";

export class MinioStorageService implements StorageServiceModel {
  private _client: S3Client;
  private _s3Context: S3Context;
  private _contentStructureService: ContentStructureService;
  private _db: Database;
  private _fileRepository: FileRepository;
  private _packageRepository: PackageRepository;
  private _fileUsageRepository: FileUsageRepository;
  private _userRepository: UserRepository;

  constructor(private readonly ctx: ApiContext) {
    this._s3Context = this.ctx.serverServices.storage.createFileContext("s3");
    this._contentStructureService = this.ctx.serverServices.content;

    this._db = this.ctx.db;
    this._fileRepository = FileRepository.getRepository(this._db);
    this._packageRepository = PackageRepository.getRepository(this._db);
    this._fileUsageRepository = FileUsageRepository.getRepository(this._db);
    this._userRepository = UserRepository.getRepository(this._db);

    this._client = new S3Client({
      credentials: {
        accessKeyId: this._s3Context.accessKey,
        secretAccessKey: this._s3Context.secretKey,
      },
      forcePathStyle: true,
      endpoint: this._s3Context.host,
      region: this._s3Context.region,
    });
  }

  public async generatePresignedUrl(
    type: "PUT" | "GET",
    bucket: string,
    filenameWithPath: string,
    expiresInSeconds: number,
    filename: string
  ) {
    let command: PutObjectCommand | GetObjectCommand;
    let opts = {};

    switch (type) {
      case "PUT":
        command = new PutObjectCommand({
          Bucket: bucket,
          Key: filenameWithPath,
          ContentMD5: Buffer.from(filename, "hex").toString("base64"),
          IfNoneMatch: "*",
        });

        opts = {
          expiresIn: expiresInSeconds,
          unhoistableHeaders: new Set(["Content-MD5", "If-None-Match"]),
        };
        break;
      case "GET":
        command = new GetObjectCommand({
          Bucket: bucket,
          Key: filenameWithPath,
        });
        opts = {
          expiresIn: expiresInSeconds,
        };
        break;
    }

    return getSignedUrl(this._client, command, opts);
  }

  public async get(filename: string) {
    const filePath = StorageUtils.parseFilePath(filename);

    const baseUrl = this._s3Context.host.endsWith("/")
      ? `${this._s3Context.host}${this._s3Context.bucket}`
      : `${this._s3Context.host}/${this._s3Context.bucket}`;

    return `${baseUrl}/${filePath}`;
  }

  public async upload(
    filename: string,
    expiresIn: number = UPLOAD_FILE_LINK_EXPIRES_IN
  ) {
    return this.performFileUpload(filename, expiresIn);
  }

  public async performBulkFilesUpload(
    filesData: { files: FileDTO[]; user?: User; pack?: Package },
    expiresIn: number
  ): Promise<Record<string, string>> {
    const links: Record<string, string> = {};
    for (const file of filesData.files) {
      const filename = ValueUtils.getRawFilename(file.filename.toLowerCase());

      links[filename] = await this.generatePresignedUrl(
        "PUT",
        this._s3Context.bucket,
        `${file.path}${filename}`,
        expiresIn,
        filename
      );
    }

    const files = (await this._fileRepository.bulkWriteFiles(filesData.files))
      .generatedMaps as File[];

    await this._fileUsageRepository.writeBulkUsage({
      files,
      pack: filesData.pack,
    });

    return links;
  }

  public async performFileUpload(
    filename: string,
    expiresIn: number,
    source?: FileSource,
    user?: User,
    pack?: Package
  ) {
    if (!source) {
      source = FileSource.S3;
    }

    const filenameWithPath = StorageUtils.parseFilePath(filename);

    const link = await this.generatePresignedUrl(
      "PUT",
      this._s3Context.bucket,
      filenameWithPath,
      expiresIn,
      filename
    );

    const file = await this._writeFile(
      filenameWithPath.replace(filename, ""),
      filename,
      source
    );

    if (user || pack) {
      this._writeUsage(file, user, pack);
    }
    return link;
  }

  public async delete(filename: string, session: Session) {
    const usageRecords = await DependencyService.getFileUsage(
      this._db,
      filename
    );

    if (usageRecords.length < 1) {
      return;
    }

    const usage: UsageEntries = {
      users: [],
      packages: [],
    };

    usageRecords.forEach((u) => {
      if (u.user) {
        usage.users.push(u.user);
      }
      if (u.package?.author) {
        usage.packages.push(u.package);
      }
    });

    const usedInPackages = usage.packages.length > 0;
    const usedByUsers = usage.users.length > 0;

    const result = { removed: false };

    if (usedInPackages && !usedByUsers) {
      const packages = usage.packages
        .map((p) => p.content?.metadata?.title)
        .join(", ");
      throw new ClientError(ClientResponse.DELETE_FROM_PACKAGE, 400, {
        packages,
      });
    }

    if (usedByUsers) {
      result.removed = await this._handleAvatarRemove(session, filename, usage);
    }

    if (!result.removed) {
      throw new ClientError(ClientResponse.NO_PERMISSION, HttpStatus.FORBIDDEN);
    }

    const file = await this._fileRepository.getFileByFilename(filename);

    if (!file) {
      return;
    }

    const fileUsage = await this._fileUsageRepository.getUsage(file);

    if (fileUsage.length > 0) {
      // Do not delete file if it's still used somewhere
      return;
    }

    const filePath = StorageUtils.parseFilePath(filename);
    this._fileRepository.removeFile(filename);

    const command = new DeleteObjectCommand({
      Bucket: this._s3Context.bucket,
      Key: filePath,
    });
    this._client.send(command);
  }

  public async getPackage(
    packId: string | number
  ): Promise<PackageListItemDTO> {
    const id = ValueUtils.validateId(packId);
    const pack = await this._packageRepository.get(id);
    if (!pack) {
      throw new ClientError(ClientResponse.PACKAGE_NOT_FOUND);
    }
    // TODO: This will be reworked after moving to better package model
    return {
      id: pack.id,
      ageRestriction: AgeRestriction.NONE,
      createdAt: pack?.created_at,
      rounds: pack.content.rounds.length,
      tags: pack.content.metadata.tags,
      title: pack.title,
      author: {
        id: pack.author.id,
        username: pack.author.username,
      },
    };
  }

  public async listPackages(
    paginationOpts: PaginationOpts<PackageModel>,
    selectOptions?: SelectOptions<PackageModel>
  ): Promise<PaginatedResult<PackageListItemDTO[]>> {
    const paginatedList = await this._packageRepository.list(
      paginationOpts,
      selectOptions
    );

    const packageListItems = paginatedList.data.map(
      (pack): PackageListItemDTO => {
        return {
          id: pack.id,
          ageRestriction: AgeRestriction.NONE,
          createdAt: pack.created_at,
          rounds: pack.content.rounds.length,
          tags: pack.content.metadata.tags,
          title: pack.title,
          author: {
            id: pack.author.id,
            username: pack.author.username,
          },
        };
      }
    );

    return {
      data: packageListItems,
      pageInfo: { ...paginatedList.pageInfo },
    };
  }

  public async uploadPackage(
    content: OQContentStructure,
    session: Session,
    expiresIn: number = UPLOAD_PACKAGE_LINKS_EXPIRES_IN
  ): Promise<PackageUploadResponse> {
    const author = await UserRepository.getUserBySession(this._db, session);

    if (!author || !author.id) {
      throw new ClientError(ClientResponse.PACKAGE_AUTHOR_NOT_FOUND);
    }

    const pack = await this._packageRepository.create(content, author);

    const links = await this._contentStructureService.getUploadLinksForFiles(
      content,
      this,
      pack,
      expiresIn
    );
    return {
      id: pack.id,
      uploadLinks: links,
    };
  }

  private async _handleAvatarRemove(
    session: Session,
    filename: string,
    usage: UsageEntries
  ) {
    const user = await UserRepository.getUserBySession(this._db, session, {
      relations: ["permissions"],
    });

    if (!user) {
      return false;
    }

    const hasPermission = await Permission.checkPermission(
      user,
      Permissions.DELETE_FILE
    );

    for (const u of usage.users) {
      if (u.id !== user.id && !hasPermission) {
        continue;
      }

      if (u.avatar?.filename === filename) {
        await this._deleteUserAvatar(u);
        await this._deleteAvatarUsage(filename, u);
        return true;
      }
    }

    return false;
  }

  private async _deleteUserAvatar(user: User) {
    if (user.avatar) {
      user.avatar = undefined;
      await this._userRepository.update(user);
    }
  }

  private async _deleteAvatarUsage(filename: string, user: User) {
    const file = await this._fileRepository.getFileByFilename(filename);
    if (file) {
      await this._fileUsageRepository.deleteUsage(file, user);
    }
  }

  private async _writeUsage(file: File, user?: User, pack?: Package) {
    return this._fileUsageRepository.writeUsage(file, user, pack);
  }

  private async _writeFile(path: string, filename: string, source: FileSource) {
    return this._fileRepository.writeFile(path, filename, source);
  }
}
