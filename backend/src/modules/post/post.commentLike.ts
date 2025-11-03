import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";
import { PostComment } from "./post.postComment";

export class CommentLike extends Model {
  public id!: number;
  public commentId!: number;
  public userId!: number;
}

CommentLike.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PostComment, 
        key: "id",
      },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    tableName: "comment_likes",
    timestamps: false,
    indexes: [{ unique: true, fields: ["commentId", "userId"] }], 
  }
);


CommentLike.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(CommentLike, { foreignKey: "userId", as: "commentLikes" });

CommentLike.belongsTo(PostComment, { foreignKey: "commentId", as: "comment" });
PostComment.hasMany(CommentLike, { foreignKey: "commentId", as: "likes" });

export default CommentLike;