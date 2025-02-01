import { type Request, type Response, Router } from "express";

import { type ApiContext } from "services/context/ApiContext";
import { type GameService } from "services/game/GameService";
import { HttpStatus } from "enums/HttpStatus";
import { validateWithSchema } from "middleware/schemaMiddleware";
import { CreateGameSchema } from "managers/game/CreateGameSchema";
import { IGame } from "types/game/IGame";
import { PaginationSchema } from "schemes/pagination/PaginationSchema";
import { EPaginationOrder } from "types/pagination/IPaginationOpts";
import { asyncHandler } from "middleware/asyncHandlerMiddleware";
import { RequestDataValidator } from "schemes/RequestDataValidator";
import { IGameCreateData } from "types/game/IGameCreate";
import { createGameScheme, gameIdScheme } from "schemes/game/gameSchemes";

export class GameRestApiController {
  private readonly _gameService: GameService;

  constructor(private readonly ctx: ApiContext) {
    const app = this.ctx.app;
    const router = Router();

    this._gameService = this.ctx.serverServices.game;

    app.use("/v1/games", router);

    router.get(`/`, asyncHandler(this.listGames));
    router.post(
      `/`,
      validateWithSchema(this.ctx.db, CreateGameSchema),
      this.createGame
    );
    router.get(`/:id`, asyncHandler(this.getGame));
  }

  private getGame = async (req: Request, res: Response) => {
    const validatedData = await new RequestDataValidator<{ gameId: string }>(
      { gameId: req.params.gameId },
      gameIdScheme()
    ).validate();

    const result = await this._gameService.get(this.ctx, validatedData.gameId);

    return res.status(HttpStatus.OK).send(result);
  };

  private listGames = async (req: Request, res: Response) => {
    const paginationOpts = await new PaginationSchema<IGame>({
      data: {
        sortBy: req.query.sortBy as keyof IGame,
        order: req.query.order as EPaginationOrder,
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
      },
      possibleSortByFields: [
        "id",
        "title",
        "createdAt",
        "createdBy",
        "maxPlayers",
        "players",
        "startedAt",
      ],
    }).validate();

    const result = await this._gameService.list(this.ctx, paginationOpts);
    return res.status(HttpStatus.OK).send(result);
  };

  private createGame = async (req: Request, res: Response) => {
    const validatedData = await new RequestDataValidator<IGameCreateData>(
      req.body,
      createGameScheme()
    ).validate();

    const result = await this._gameService.create(
      this.ctx,
      validatedData,
      req.headers
    );
    return res.status(HttpStatus.OK).send(result);
  };
}
