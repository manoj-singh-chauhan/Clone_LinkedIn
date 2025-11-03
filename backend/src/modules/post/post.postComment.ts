import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db";
import Post from "./post.model";
import User from "../auth/user.model";
import { CommentLike } from "./post.commentLike";

export class PostComment extends Model {
  public id!: number;
  public postId!: number;
  public userId!: number;
  public content!: string;
  public likeCount!: number;
  public parentId!: number | null;
  public replyCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PostComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Post,
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "post_comments",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    replyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "post_comments",
    indexes: [
      { fields: ["postId"] },
      { fields: ["userId"] },
      { fields: ["parentId"] }],
    timestamps: true,
  }
);


PostComment.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(PostComment, { foreignKey: "userId", as: "comments" });


PostComment.hasMany(PostComment, {
  foreignKey: "parentId",
  as: "replies",
  onDelete: "CASCADE",
});
PostComment.belongsTo(PostComment, {
  foreignKey: "parentId",
  as: "parentComment",
});



export default PostComment;