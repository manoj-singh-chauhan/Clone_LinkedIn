import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";
import Skill from "./skill.model";

export class UserSkill extends Model {
  public userId!: number;
  public skillId!: number;
}

UserSkill.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      references: { model: User, key: "id" },
      primaryKey: true,
      onDelete: "CASCADE",
    },
    skillId: {
      type: DataTypes.INTEGER,
      references: { model: Skill, key: "id" },
      primaryKey: true,
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "user_skills",
    timestamps: false,
  }
);

User.belongsToMany(Skill, {
  through: UserSkill,
  foreignKey: "userId",
  as: "skills",
});

Skill.belongsToMany(User, {
  through: UserSkill,
  foreignKey: "skillId",
});

export default UserSkill;
