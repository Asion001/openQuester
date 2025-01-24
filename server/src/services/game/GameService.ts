import Redis from "ioredis";
import { type Request } from "express";

import { RedisConfig } from "config/RedisConfig";
import { IGameCreateData } from "types/game/IGameCreate";
import { IGameListItem } from "types/game/IGameListItem";
import { ClientError } from "error/ClientError";
import { ClientResponse } from "enums/ClientResponse";
import { HttpStatus } from "enums/HttpStatus";
import {
  GAME_ID_CHARACTERS,
  GAME_ID_CHARACTERS_LENGTH,
  GAME_NAMESPACE,
} from "constants/game";
import { UserRepository } from "database/repositories/UserRepository";
import { ApiContext } from "services/context/ApiContext";
import { PackageRepository } from "database/repositories/PackageRepository";
import { Database } from "database/Database";
import { SocketIOEvents } from "enums/SocketIOEvents";
import { EGameEvent, IGameEvent } from "types/game/IGameEvent";
import { IGame } from "types/game/IGame";

export class GameService {
  private _redisClient: Redis;
  private _packageRepository!: PackageRepository;

  constructor() {
    this._redisClient = RedisConfig.getClient();
  }

  public async get(gameId: string): Promise<IGameListItem | undefined> {
    const key = `${GAME_NAMESPACE}:${gameId}`;
    const value = await this._redisClient.get(key);

    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new ClientError(
        ClientResponse.BAD_GAME_DATA,
        HttpStatus.BAD_REQUEST,
        { id: gameId }
      );
    }
  }

  public async list() {
    const keys = await this._redisClient.keys(`${GAME_NAMESPACE}:*`);
    return Promise.all(
      keys.map(async (key) => {
        return this.get(key.split(":")[1]);
      })
    );
  }

  public async create(ctx: ApiContext, req: Request) {
    const data: IGameCreateData = req.body;

    const createdByUser = await UserRepository.getUserByHeader(
      ctx.db,
      req.headers.authorization,
      { select: ["id", "name"], relations: [] }
    );

    const packageRepo = this._getPackageRepository(ctx.db);

    const packageData = await packageRepo.get(data.packageId);

    if (!packageData) {
      throw new ClientError(ClientResponse.PACKAGE_NOT_FOUND);
    }

    const packageAuthor = await UserRepository.getRepository(ctx.db).get(
      packageData.author.id,
      { select: ["id", "name"], relations: [] }
    );

    if (!packageAuthor) {
      throw new ClientError(ClientResponse.PACKAGE_AUTHOR_NOT_FOUND);
    }

    const gameId = this._generateGameId();
    const key = `${GAME_NAMESPACE}:${gameId}`;

    const gameData: IGame = {
      id: gameId,
      createdBy: createdByUser.id,
      title: data.title,
      createdAt: new Date(),
      currentRound: 0,
      players: 0,
      maxPlayers: data.maxPlayers,
      startedAt: undefined,
      package: {
        id: data.packageId,
        title: packageData.title,
        ageRestriction: data.ageRestriction,
        createdAt: packageData.created_at,
        rounds: packageData.content.rounds.length,
        author: packageAuthor.id,
      },
    };

    await this._redisClient.set(key, JSON.stringify(gameData));

    const gameDataOutput: IGameListItem = {
      ...gameData,
      createdBy: { id: createdByUser.id, name: createdByUser.name },
      package: {
        ...gameData.package,
        author: { id: packageAuthor.id, name: packageAuthor.name },
      },
    };

    this._emitSocketGameCreated(ctx, gameDataOutput);

    return gameDataOutput;
  }

  private _getPackageRepository(db: Database) {
    if (!this._packageRepository) {
      this._packageRepository = PackageRepository.getRepository(db);
    }
    return this._packageRepository;
  }

  private _generateGameId() {
    let result = "";
    for (let i = 0; i < GAME_ID_CHARACTERS_LENGTH; i++) {
      result +=
        GAME_ID_CHARACTERS[
          Math.floor(Math.random() * GAME_ID_CHARACTERS.length)
        ];
    }
    return result;
  }

  private _emitSocketGameCreated(ctx: ApiContext, gameData: IGameListItem) {
    ctx.io.emit(SocketIOEvents.GAMES, {
      event: EGameEvent.CREATED,
      data: gameData,
    } as IGameEvent);
  }
}
