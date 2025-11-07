import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/db";

interface SkillAttributes {
  id: number;
  name: string;
}

interface SkillCreationAttributes extends Optional<SkillAttributes, "id"> {}

export class Skill
  extends Model<SkillAttributes, SkillCreationAttributes>
  implements SkillAttributes
{
  public id!: number;
  public name!: string;
}

Skill.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "skills",
    timestamps: false,
  }
);

export default Skill;