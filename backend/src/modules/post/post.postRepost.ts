import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";
import Post from "./post.model";

export class PostRepost extends Model {
  public id!: number;
  public postId!: number;
  public userId!: number;
  public content!: string | null;
}

PostRepost.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Post, 
        key: "id" 
      },
      onDelete: 'CASCADE',  //chck 4
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { 
        model: User, 
        key: "id" 
      },
    },
    content: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
  },
  {
    sequelize,
    tableName: "post_reposts",
    indexes: [{ 
      unique: true, 
      fields: ["postId", "userId", "content"] }],
  }
);

// Associations
PostRepost.belongsTo(User, { foreignKey: "userId", as: "user" }); // important
User.hasMany(PostRepost, { foreignKey: "userId", as: "reposts" });

PostRepost.belongsTo(Post, { foreignKey: "postId", as: "repostPost" });
Post.hasMany(PostRepost, { foreignKey: "postId", as: "repostsInfo" });

export default PostRepost;
