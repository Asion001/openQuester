import { type Request, type Response, Router } from "express";

import { type ApiContext } from "services/context/ApiContext";
import { IStorage } from "types/file/IStorage";
import { verifyContentJSONMiddleware } from "middleware/file/FileMiddleware";
import { HttpStatus } from "enums/HttpStatus";
import { ErrorController } from "error/ErrorController";
import { ServerServices } from "services/ServerServices";
import { PaginationSchema } from "managers/pagination/PaginationSchema";
import { EPaginationOrder } from "types/pagination/IPaginationOpts";
import { IPackage } from "types/package/IPackage";

export class PackageRestApiController {
  private _storageService: IStorage;

  constructor(ctx: ApiContext) {
    const router = Router();
    const app = ctx.app;

    this._storageService = ServerServices.storage.createStorageService(
      ctx,
      "minio"
    );

    app.use("/v1/packages", router);

    router.post("/", verifyContentJSONMiddleware, this.uploadPackage);
    router.get("/", this.listPackages);
    router.get("/:id", this.getPackage);
  }

  private uploadPackage = async (req: Request, res: Response) => {
    try {
      const data = await this._storageService.uploadPackage(req);
      return res.status(HttpStatus.OK).send(data);
    } catch (err: unknown) {
      const { message, code } = await ErrorController.resolveError(
        err,
        req.headers
      );
      return res.status(code).send({ error: message });
    }
  };

  private getPackage = async (req: Request, res: Response) => {
    try {
      const data = await this._storageService.getPackage(
        Number(req.params?.id)
      );
      return res.status(HttpStatus.OK).send(data);
    } catch (err: unknown) {
      const { message, code } = await ErrorController.resolveError(
        err,
        req.headers
      );
      return res.status(code).send({ error: message });
    }
  };

  private listPackages = async (req: Request, res: Response) => {
    try {
      const paginationOpts = await new PaginationSchema<IPackage>({
        data: {
          sortBy: req.query.sortBy as keyof IPackage,
          order: req.query.order as EPaginationOrder,
          limit: Number(req.query.limit),
          offset: Number(req.query.offset),
        },
        possibleSortByFields: ["id", "title", "created_at", "author"],
      }).validate();

      const data = await this._storageService.listPackages(paginationOpts, {
        relations: ["author"],
      });

      return res.status(HttpStatus.OK).send(data);
    } catch (err: unknown) {
      const { message, code } = await ErrorController.resolveError(
        err,
        req.headers
      );
      return res.status(code).send({ error: message });
    }
  };
}
