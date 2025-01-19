import * as Minio from "minio";
import http from "http";
import https from "https";

import { Request } from "express";

import { IStorage } from "../../interfaces/file/IStorage";
import { IS3Context } from "../../interfaces/file/IS3Context";
import { ContentStructureService } from "../ContentStructureService";
import { ApiContext } from "../context/ApiContext";
import { PackageRepository } from "../../database/repositories/PackageRepository";
import { Database } from "../../database/Database";
import { User } from "../../database/models/User";
import { FileRepository } from "../../database/repositories/FileRepository";
import { ServerServices } from "../ServerServices";
import { StorageUtils } from "../../utils/StorageUtils";
import { Logger } from "../../utils/Logger";
import { FileUsageRepository } from "../../database/repositories/FileUsageRepository";
import { File } from "../../database/models/File";
import { Package } from "../../database/models/Package";
import { UserRepository } from "../../database/repositories/UserRepository";
import { ClientError } from "../../error/ClientError";
import { ClientResponse } from "../../enums/ClientResponse";
import { DependencyService } from "../dependency/DependencyService";
import { UsageEntries } from "../../types/usage/usage";
import { Permission } from "../../database/models/Permission";
import { Permissions } from "../../enums/Permissions";

const MINIO_PREFIX = "[MINIO]: ";

export class MinioStorageService implements IStorage {
  private _client: Minio.Client;
  private _s3Context: IS3Context;
  private _contentStructureService: ContentStructureService;
  private _agentOptions: http.AgentOptions;
  private _agent: http.Agent;
  private _db: Database;
  private _fileRepository: FileRepository;
  private _packageRepository: PackageRepository;
  private _fileUsageRepository: FileUsageRepository;
  private _userRepository: UserRepository;

  constructor(ctx: ApiContext) {
    this._s3Context = ServerServices.storage.createFileContext("s3");
    this._contentStructureService = ServerServices.content;

    this._db = ctx.db;
    this._fileRepository = FileRepository.getRepository(this._db);
    this._packageRepository = PackageRepository.getRepository(this._db);
    this._fileUsageRepository = FileUsageRepository.getRepository(this._db);
    this._userRepository = UserRepository.getRepository(this._db);

    this._agentOptions = {
      keepAlive: true,
      maxSockets: 50,
      keepAliveMsecs: 1000,
      noDelay: true,
    };

    this._agent = this._s3Context.useSSL
      ? new https.Agent(this._agentOptions)
      : new http.Agent(this._agentOptions);

    this._client = new Minio.Client({
      endPoint: this._s3Context.host,
      port: this._s3Context.port,
      useSSL: this._s3Context.useSSL,
      accessKey: this._s3Context.accessKey,
      secretKey: this._s3Context.secretKey,
      partSize: 5 * 1024 * 1024,
      transportAgent: this._agent,
    });
  }

  public async get(
    filename: string,
    expiresIn: number = 60 * 30 // Default: 30 min
  ) {
    const filePath = StorageUtils.parseFilePath(filename);
    return this._client.presignedGetObject(
      this._s3Context.bucket,
      filePath,
      expiresIn
    );
  }

  public async upload(
    req: Request,
    expiresIn: number = 30 // Default: 30 sec
  ) {
    return this.performFileUpload(req.body.filename, expiresIn);
  }

  public async performFileUpload(
    filename: string,
    expiresIn: number,
    user?: User,
    pack?: Package
  ) {
    const filenameWithPath = StorageUtils.parseFilePath(filename);
    const link = await this._client.presignedPutObject(
      this._s3Context.bucket,
      filenameWithPath,
      expiresIn
    );

    const file = await this._writeFile(
      filenameWithPath.replace(filename, ""),
      filename
    );

    if (user || pack) {
      this._writeUsage(file, user, pack);
    }
    return link;
  }

  public async delete(req: Request) {
    const filename = req.body.filename;
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
      result.removed = await this._handleAvatarRemove(req, filename, usage);
    }

    if (!result.removed) {
      throw new ClientError(ClientResponse.NO_PERMISSION);
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
    return this._client.removeObject(this._s3Context.bucket, filePath);
  }

  public async uploadPackage(
    req: Request,
    expiresIn: number = 60 * 5 // Default: 5 min
  ) {
    const content = req.body.content;
    const author = await UserRepository.getUserByHeader(
      this._db,
      req.headers?.authorization
    );

    if (!author || !author.id) {
      throw new ClientError(ClientResponse.PACKAGE_AUTHOR_NOT_FOUND);
    }

    let pack: Package | undefined;

    const existingPack = await this._packageRepository.exists(content);
    if (existingPack) {
      pack = existingPack;
      Logger.pink(
        `Package "${content.metadata.id}" uploaded by "ID:${author.id}"`,
        MINIO_PREFIX
      );
    }

    if (!pack) {
      pack = await this._packageRepository.create(content, author);
    }

    const links = await this._contentStructureService.getUploadLinksForFiles(
      content,
      this,
      pack,
      expiresIn
    );
    return links;
  }

  private async _handleAvatarRemove(
    req: Request,
    filename: string,
    usage: UsageEntries
  ) {
    const user = await UserRepository.getUserByHeader(
      this._db,
      req.headers.authorization,
      { relations: ["permissions"] }
    );

    if (!user) {
      return false;
    }

    // If user has permissions then avatar will be deleted for everyone who use it
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

  private async _writeFile(path: string, filename: string) {
    try {
      await this._client.statObject(this._s3Context.bucket, path + filename);
      Logger.pink(`Duplicated file upload: ${path + filename}`, MINIO_PREFIX);
      path = "duplicated/";
    } catch {
      //
    }
    return this._fileRepository.writeFile(path, filename);
  }
}
