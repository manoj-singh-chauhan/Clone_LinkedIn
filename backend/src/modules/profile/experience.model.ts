import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";

interface ExperienceAttributes {
  id: number;
  userId: number;
  title: string;
  companyName: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  description: string | null;
}

interface ExperienceCreationAttributes
  extends Optional<
    ExperienceAttributes,
    "id" | "location" | "endDate" | "isCurrent" | "description"
  > {}

export class Experience
  extends Model<ExperienceAttributes, ExperienceCreationAttributes>
  implements ExperienceAttributes
{
  public id!: number;
  public userId!: number;
  public title!: string;
  public companyName!: string;
  public location!: string | null;
  public startDate!: Date;
  public endDate!: Date | null;
  public isCurrent!: boolean;
  public description!: string | null;
}

Experience.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY, 
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "experiences",
    timestamps: false,
  }
);

// Associations
User.hasMany(Experience, { foreignKey: "userId", as: "experiences" });
Experience.belongsTo(User, { foreignKey: "userId" });

export default Experience;