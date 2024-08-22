import { User } from "../database/models/User";

import { JWTResponse } from "../types/jwt/jwt";
import { Crypto } from "../types/Crypto";

import { IApiContext } from "../interfaces/IApiContext";
import { JWTUtils } from "../utils/JWTUtils";
import { CryptoUtils } from "../utils/CryptoUtils";
import { ILoginUser } from "../interfaces/user/ILoginUser";
import { IRegisterUser } from "../interfaces/user/IRegisterUser";

/**
 * Handles all business logic of user authorization
 */
export class AuthService {
  public static async register(
    ctx: IApiContext,
    data: IRegisterUser,
    crypto: Crypto
  ): Promise<JWTResponse> {
    const user = await User.create(ctx.db, data, crypto);

    const { access_token, refresh_token } = JWTUtils.generateTokens(user.id);
    return {
      access_token,
      refresh_token,
    };
  }

  public static async login(
    ctx: IApiContext,
    data: ILoginUser,
    crypto: Crypto
  ): Promise<JWTResponse> {
    const user = await User.login(ctx.db, data);

    if (!user) {
      throw new Error("User with this name or email does not exists");
    }

    if (!(await CryptoUtils.compare(data.password!, user.password!, crypto))) {
      throw new Error("Wrong password, please try again");
    }

    const { access_token, refresh_token } = JWTUtils.generateTokens(user.id);

    return {
      access_token,
      refresh_token,
    };
  }
}
