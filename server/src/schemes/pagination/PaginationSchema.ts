import Joi from "joi";

import { LIMIT_MAX, LIMIT_MIN, OFFSET_MIN } from "constants/pagination";
import { ClientResponse } from "enums/ClientResponse";
import { HttpStatus } from "enums/HttpStatus";
import { ServerResponse } from "enums/ServerResponse";
import { ClientError } from "error/ClientError";
import { ServerError } from "error/ServerError";
import {
  PaginationOpts,
  PaginationOrder,
} from "types/pagination/PaginationOpts";
import { PaginationSchemaOpts } from "types/pagination/PaginationSchemaOpts";

export class PaginationSchema<T> {
  protected _schema: Joi.ObjectSchema<PaginationOpts<T>>;
  protected _paginationData: PaginationOpts<T>;

  constructor(schemaOpts: PaginationSchemaOpts<T>) {
    this._schema = Joi.object<PaginationOpts<T>>({
      limit: Joi.number().required().min(LIMIT_MIN).max(LIMIT_MAX).required(),
      offset: Joi.number().required().min(OFFSET_MIN).required(),
      order: Joi.valid(...Object.values(PaginationOrder)),
      sortBy: Joi.valid(...schemaOpts.possibleSortByFields),
    });

    const data = schemaOpts.data;
    this._paginationData = {
      limit: data.limit,
      offset: data.offset,
      order: data.order,
      sortBy: data.sortBy,
    };
  }

  public async validate() {
    if (!this._schema) {
      throw new ServerError(ServerResponse.NO_SCHEMA);
    }

    const { value, error } = this._schema.validate(this._paginationData, {
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ClientError(
        ClientResponse.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        {
          error,
        }
      );
    }

    return value;
  }
}
