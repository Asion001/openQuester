import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";

import { PermissionModel } from "types/permission/PermissionModel";
import { Permissions } from "enums/Permissions";
import { User } from "database/models/User";

@Entity("permission")
export class Permission implements PermissionModel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToMany(() => User, (user) => user.permissions)
  users!: User[];

  public static async checkPermission(user: User, permission: Permissions) {
    const userPermissions = user.permissions.map((v) => v.name);
    if (!userPermissions.includes(permission)) {
      return false;
    }
    return true;
  }
}
