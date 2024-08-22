import Joi from "joi";
import { IUserData } from "../../interfaces/user/UserData";

export class UserDTO {
  protected userData?: IUserData;
  protected schema: Joi.ObjectSchema<any>;
  protected required?: string[];

  constructor() {
    this.schema = Joi.object({
      id: Joi.number(),
      login: Joi.alternatives().try(
        Joi.string().min(3).max(30),
        Joi.string().email()
      ),
      name: Joi.string().min(3).max(30),
      email: Joi.string().email(),
      password: Joi.string().min(6).max(40),
      birthday: Joi.alternatives().try(Joi.date(), Joi.string()),
      permissions: Joi.array(),
    });
    this.required = [];
  }

  /**
   * Used in `validate()`, so no need to call this method before
   */
  public validateFields() {
    if (!this.userData) {
      throw new Error("No user data provided.");
    }

    if (!this.required) {
      return;
    }

    const r: string[] = [];
    for (const entry of Object.entries(this.userData)) {
      if (this.required.includes(entry[0])) {
        const value = this.userData[entry[0] as keyof IUserData];
        if (value === undefined || value === null) {
          r.push(entry[0]);
        }
      }
    }
    if (r.length > 0) {
      throw new Error(`[${[...r]}] field(s) is required`);
    }
  }

  public validate() {
    if (!this.userData) {
      throw new Error("No user data provided.");
    }

    if (!this.schema) {
      throw new Error("No validation schema.");
    }

    this.validateFields();

    const { value, error } = this.schema.validate(this.userData, {
      allowUnknown: false,
      stripUnknown: true,
    });

    // TODO: Validate avatar field when implemented

    if (error) {
      throw new Error(`Validation error: ${error.message}`);
    }

    return value;
  }
}
