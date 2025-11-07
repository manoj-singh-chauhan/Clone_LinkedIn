import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";

interface Attributes {
  id: number;
  userId: number;
  name: string;
  headline: string | null;
  profilePictureUrl: string | null;
  coverPhotoUrl: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  about: string | null;
  contactInfo: object | null;
}

interface ProfileCreationAttributes
  extends Optional<
    Attributes,
    | "id"
    | "headline"
    | "profilePictureUrl"
    | "coverPhotoUrl"
    | "locationCity"
    | "locationCountry"
    | "about"
    | "contactInfo"
  > {}

class Profile
  extends Model<Attributes, ProfileCreationAttributes>
  implements Attributes
{
  public id!: number;
  public userId!: number;
  public name!: string;
  public headline!: string | null;
  public profilePictureUrl!: string | null;
  public coverPhotoUrl!: string | null;
  public locationCity!: string | null;
  public locationCountry!: string | null;
  public about!: string | null;
  public contactInfo!: object | null;
}

Profile.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      unique: true,
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },

    headline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePictureUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coverPhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    locationCity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    locationCountry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "profiles",
    timestamps: true,
  }
);

User.hasOne(Profile, {
  as: "profile",
  foreignKey: "userId",
  onDelete: "CASCADE",
});
Profile.belongsTo(User, { as: "user", foreignKey: "userId" });

export default Profile;
