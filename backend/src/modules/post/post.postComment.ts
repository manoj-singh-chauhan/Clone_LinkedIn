import { Model, DataTypes } from "sequelize";
import sequelize from "../../config/db";
import Post from "./post.model";
import User from "../auth/user.model";

export class PostComment extends Model {
  public id!: number;
  public postId!: number;
  public userId!: number;
  public content!: string;

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
      onDelete: 'CASCADE',  //chek 3
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "post_comments",
    indexes: [{ fields: ["postId"] }, { fields: ["userId"] }],
    timestamps: true,
  }
);




// PostComment.belongsTo(User, { foreignKey: "userId" });
// PostComment.belongsTo(Post, { foreignKey: "postId" });

PostComment.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(PostComment, { foreignKey: "userId", as: "comments" });

export default PostComment;
