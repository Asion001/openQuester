import * as Minio from "minio";
import http from "http";
import https from "https";

import { IStorage } from "../../interfaces/file/IStorage";
import { IS3Context } from "../../interfaces/file/IS3Context";
import { OQContentStructure } from "../../interfaces/file/structures/OQContentStructure";
import { ContentStructureService } from "../ContentStructureService";
import { SHA256Characters } from "../../constants/sha256";
import { ValueUtils } from "../../utils/ValueUtils";
import { ApiContext } from "../context/ApiContext";
import { StorageServiceFactory } from "./StorageServiceFactory";

export class MinioStorageService implements IStorage {
  private _client: Minio.Client;
  private _context: IS3Context;
  private _contentStructureService: ContentStructureService;
  private _agentOptions: http.AgentOptions;
  private _agent: http.Agent;

  constructor(ctx: ApiContext) {
    const storageFactory = ctx.serverServices.get(StorageServiceFactory);
    this._context = storageFactory.createFileContext("s3");
    this._contentStructureService = ctx.serverServices.get(
      ContentStructureService
    );

    this._agentOptions = {
      keepAlive: true,
      maxSockets: 50,
      keepAliveMsecs: 1000,
      noDelay: true,
    };

    this._agent = this._context.useSSL
      ? new https.Agent(this._agentOptions)
      : new http.Agent(this._agentOptions);

    this._client = new Minio.Client({
      endPoint: this._context.host,
      port: this._context.port,
      useSSL: this._context.useSSL,
      accessKey: this._context.accessKey,
      secretKey: this._context.secretKey,
      partSize: 5 * 1024 * 1024,
      transportAgent: this._agent,
    });
  }

  public async get(
    filename: string,
    expiresIn: number = 60 * 30 // Default: 30 min
  ) {
    // TODO: Implement cache in future
    const filePath = this._parseFilePath(filename);
    return this._client.presignedGetObject(
      this._context.bucket,
      filePath,
      expiresIn
    );
  }

  public async upload(
    filename: string,
    expiresIn: number = 60 * 5 // Default: 5 min
  ) {
    const filePath = this._parseFilePath(filename);
    return this._client.presignedPutObject(
      this._context.bucket,
      filePath,
      expiresIn
    );
  }

  public async delete(filename: string) {
    const filePath = this._parseFilePath(filename);
    return this._client.removeObject(this._context.bucket, filePath);
  }

  public async uploadPackage(
    content: object,
    expiresIn: number = 60 * 5 // Default: 5 min
  ) {
    return this._contentStructureService.getUploadLinksForFiles(
      content as OQContentStructure,
      this,
      expiresIn
    );
  }

  private _parseFilePath(filename: string) {
    filename = ValueUtils.getRawFilename(filename.toLowerCase());
    if (
      filename.length < 2 ||
      !SHA256Characters.includes(filename[0]) ||
      !SHA256Characters.includes(filename[1])
    ) {
      return `other/${filename}`;
    }
    return `${filename[0]}/${filename.substring(0, 2)}/${filename}`;
  }
}
