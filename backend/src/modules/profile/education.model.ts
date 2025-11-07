import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";

interface EducationAttributes {
  id: number;
  userId: number;
  schoolName: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: Date;
  endDate: Date | null;
}

interface EducationCreationAttributes
  extends Optional<EducationAttributes, "id" | "degree" | "fieldOfStudy" | "endDate"> {}

export class Education
  extends Model<EducationAttributes, EducationCreationAttributes>
  implements EducationAttributes
{
  public id!: number;
  public userId!: number;
  public schoolName!: string;
  public degree!: string | null;
  public fieldOfStudy!: string | null;
  public startDate!: Date;
  public endDate!: Date | null;
}

Education.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
      onDelete: "CASCADE",
    },
    schoolName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fieldOfStudy: {
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
  },
  {
    sequelize,
    tableName: "educations",
    timestamps: false,
  }
);

User.hasMany(Education, { foreignKey: "userId", as: "educations" });
Education.belongsTo(User, { foreignKey: "userId" });

export default Education;