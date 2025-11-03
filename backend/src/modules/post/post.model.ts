import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../config/db";
import User from "../auth/user.model";

interface PostAttributes {
  id: number;
  userId: number;
  content: string | null;
  media: { url: string; type: "image" | "video" | "document" }[] | null;
  hashtags: string | null;
  isRepost: boolean;
  originalPostId: number | null;
  repostComment: string | null;
  likeCount: number;
  celebrateCount: number;
  commentCount: number;
  repostCount: number;
  lastActivityAt: Date;
  postType: "public" | "connection-only";
}

export interface PostCreationAttributes extends Optional<PostAttributes,
  "id" | "content" | "media" | "hashtags" | "isRepost" |
  "originalPostId" | "repostComment" | "likeCount" | "celebrateCount" |
  "commentCount" | "repostCount" | "lastActivityAt" | "postType"
> {}

export class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: number;
  public userId!: number;
  public content!: string | null;
  public media!: { url: string; type: "image" | "video" | "document" }[] | null;
  public hashtags!: string | null;
  public isRepost!: boolean;
  public originalPostId!: number | null;
  public repostComment!: string | null;
  public likeCount!: number;
  public celebrateCount!: number;
  public commentCount!: number;
  public repostCount!: number;
  public lastActivityAt!: Date;
  public postType!: "public" | "connection-only";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Post.init(
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { 
        model: User, 
        key: "id" 
      } 
    },
    content: { 
      type: DataTypes.TEXT("long"), 
      allowNull: true 
    },
    media: { 
      type: DataTypes.JSON, 
      allowNull: true 
    },
    hashtags: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    isRepost: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    originalPostId: { 
      type: DataTypes.INTEGER, 
      allowNull: true,          //check 1
      references: {
        model: Post,
        key: "id",
      },
      onDelete: 'CASCADE',
    },
    repostComment: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    likeCount: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0, 
      allowNull: false 
    },
    celebrateCount: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0, 
      allowNull: false 
    },
    commentCount: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0, 
      allowNull: false 
    },
    repostCount: { 
      type: DataTypes.INTEGER,
      defaultValue: 0, 
      allowNull: false 
    },
    lastActivityAt: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
    postType: { 
      type: DataTypes.ENUM("public", "connection-only"), 
      allowNull: false, 
      defaultValue: "public" 
    },
  },
  {
    sequelize,
    tableName: "posts",
    indexes: [
      { fields: ["userId"] },                    // search posts by user
      { fields: ["createdAt"] },                 // latest posts first
      { fields: ["hashtags"] },                  // search by hashtags
      { fields: ["postType"] },                  // search by type
      { fields: ["originalPostId"] },            // find reposts
    ],
  }
);


Post.belongsTo(User, { foreignKey: "userId", as: "author" });
User.hasMany(Post, { foreignKey: "userId", as: "posts" });

Post.belongsTo(Post, { foreignKey: "originalPostId", as: "originalPost" });
Post.hasMany(Post, { foreignKey: "originalPostId", as: "reposts" });

export default Post;