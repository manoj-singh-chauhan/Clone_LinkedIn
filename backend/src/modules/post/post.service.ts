import { Post } from "./post.model";
// import cloudinary from "../../config/cloudinary.config";
import PostLike from "./post.postLike";
import PostRepost from "./post.postRepost";
import { PostComment } from "./post.postComment";
import User from "../auth/user.model";
import Profile from "../profile/profile.model";
import { withTransaction } from "../../utils/transaction";
import { Op } from "sequelize";
import CommentLike from "./post.commentLike";

type AllowedMediaType = "image" | "video" | "document";

//Post Service
export const PostService = {
  createPost: async (validatedBody: any, userId: number) => {
    const media: { url: string; type: AllowedMediaType }[] = [];

    if (validatedBody.media && Array.isArray(validatedBody.media)) {
      for (const url of validatedBody.media) {
        let type: AllowedMediaType = "document";
        if (url.match(/\.(jpeg|jpg|png|gif)$/)) type = "image";
        else if (url.match(/\.(mp4|mov|avi)$/)) type = "video";
        media.push({ url, type });
      }
    }

    if (
      !validatedBody.content &&
      media.length === 0 &&
      !validatedBody.originalPostId
    ) {
      const error = new Error(
        "Post must contain content, files, or be a repost."
      );
      (error as any).statusCode = 400;
      throw error;
    }

    const postData = { ...validatedBody, userId, media };
    const newPost = await Post.create(postData as any);
    return newPost.toJSON();
  },
};

// FETCH POSTS
export const getPostsService = async (userId: number, page = 1, limit = 5) => {
  const offset = (page - 1) * limit;

  try {
    const posts = await Post.findAll({
      where: { isRepost: false },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "email"],
          include: [{ model: Profile, as: "profile", attributes: ["name"] }],
        },
        { model: Post, as: "originalPost" },
        { model: Post, as: "reposts" },
      ],
    });

    const likedPosts = await PostLike.findAll({ where: { userId } });
    const repostedPosts = await PostRepost.findAll({ where: { userId } });

    const likedPostIds = new Set(likedPosts.map((like) => like.postId));
    const repostedPostIds = new Set(repostedPosts.map((r) => r.postId));

    const enrichedPosts = posts.map((post: any) => ({
      ...post.toJSON(),
      likedByCurrentUser: likedPostIds.has(post.id),
      repostedByCurrentUser: repostedPostIds.has(post.id),
    }));

    return enrichedPosts;
  } catch (error) {
    throw new Error("Failed to fetch posts");
  }
};

// LIKE SERVICE
export const PostLikeService = {
  toggleLike: async (postId: number, userId: number) => {
    return withTransaction(async (t) => {
      const post = await Post.findByPk(postId, { transaction: t });
      if (!post) throw new Error("Post not found");

      const existingLike = await PostLike.findOne({
        where: { postId, userId },
        transaction: t,
      });

      if (existingLike) {
        await existingLike.destroy({ transaction: t });
        post.likeCount = Math.max(0, post.likeCount - 1);
      } else {
        await PostLike.create({ postId, userId }, { transaction: t });
        post.likeCount += 1;
      }

      await post.save({ transaction: t });

      return { liked: !existingLike, likeCount: post.likeCount };
    });
  },
};

// COMMENT SERVICE
export const PostCommentService = {
  addComment: async (postId: number, userId: number, content: string) => {
    return withTransaction(async (t) => {
      const post = await Post.findByPk(postId, { transaction: t });
      if (!post) throw new Error("Post not found");

      const comment = await PostComment.create(
        { postId, userId, content, parentId: null },
        { transaction: t }
      );

      post.commentCount += 1;
      await post.save({ transaction: t });

      return {
        commentId: comment.id,
        postId,
        userId,
        content: comment.content,
        createdAt: comment.createdAt,
      };
    });
  },

  addReply: async (
    parentCommentId: number,
    userId: number,
    content: string
  ) => {
    return withTransaction(async (t) => {
      const parentComment = await PostComment.findByPk(parentCommentId, {
        transaction: t,
      });
      if (!parentComment) {
        const error = new Error("Parent comment not found");
        (error as any).statusCode = 404;
        throw error;
      }

      parentComment.replyCount += 1;
      await parentComment.save({ transaction: t });

      const reply = await PostComment.create(
        {
          postId: parentComment.postId,
          userId,
          content,
          parentId: parentCommentId,
        },
        { transaction: t }
      );

      const post = await Post.findByPk(parentComment.postId, {
        transaction: t,
      });
      if (post) {
        post.commentCount += 1;
        await post.save({ transaction: t });
      }

      return {
        commentId: reply.id,
        postId: reply.postId,
        userId,
        content: reply.content,
        parentId: reply.parentId,
        createdAt: reply.createdAt,
      };
    });
  },
};

//REPOST
export const PostRepostService = {
  repostPost: async (
    postId: number,
    userId: number,
    repostComment?: string
  ) => {
    return withTransaction(async (t) => {
      try {
        const originalPost = await Post.findByPk(postId, { transaction: t });
        if (!originalPost) throw new Error("Post not found");

        const trimmedComment = repostComment?.trim() || null;

        if (!trimmedComment) {
          const existingPlainRepost = await Post.findOne({
            where: {
              userId,
              originalPostId: postId,
              isRepost: true,
              repostComment: null,
            },
            transaction: t,
          });
          if (existingPlainRepost)
            throw new Error("You already reposted this post");

          const existingThoughtRepost = await Post.findOne({
            where: {
              userId,
              originalPostId: postId,
              isRepost: true,
              repostComment: { [Op.ne]: null },
            },
            transaction: t,
          });
          if (existingThoughtRepost)
            throw new Error("You already reposted this post with a thought");

          const newRepost = await Post.create(
            {
              userId,
              content: originalPost.content,
              media: originalPost.media,
              hashtags: originalPost.hashtags || "",
              isRepost: true,
              originalPostId: originalPost.id,
              repostComment: null,
              postType: originalPost.postType,
              lastActivityAt: new Date(),
            },
            { transaction: t }
          );

          await PostRepost.create(
            { postId: originalPost.id, userId, content: null },
            { transaction: t }
          );

          originalPost.repostCount += 1;
          originalPost.lastActivityAt = new Date();
          await originalPost.save({ transaction: t });

          return {
            type: "simple",
            reposted: true,
            repostCount: originalPost.repostCount,
            repostId: newRepost.id,
            originalPostId: originalPost.id,
          };
        }

        const newRepostWithComment = await Post.create(
          {
            userId,
            content: originalPost.content,
            media: originalPost.media,
            hashtags: originalPost.hashtags || "",
            isRepost: true,
            originalPostId: originalPost.id,
            repostComment: trimmedComment,
            postType: originalPost.postType,
            lastActivityAt: new Date(),
          },
          { transaction: t }
        );

        await PostRepost.create(
          { postId: originalPost.id, userId, content: trimmedComment },
          { transaction: t }
        );

        originalPost.repostCount += 1;
        originalPost.lastActivityAt = new Date();
        await originalPost.save({ transaction: t });

        return {
          type: "with_thought",
          reposted: true,
          repostCount: originalPost.repostCount,
          repostId: newRepostWithComment.id,
          originalPostId: originalPost.id,
          repostComment: newRepostWithComment.repostComment,
        };
      } catch (err) {
        // console.error("Error", err);
        throw err;
      }
    });
  },
};

// Get Likes service
interface LikeWithUser {
  likeId: number;
  user: { id: number; email: string; name?: string | null };
  createdAt: Date;
}

export const getPostLikesService = async (
  postId: number
): Promise<LikeWithUser[]> => {
  const post = await Post.findByPk(postId);
  if (!post)
    throw Object.assign(new Error("Post not found"), { statusCode: 404 });

  const likes = await PostLike.findAll({
    where: { postId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
        include: [{ model: Profile, as: "profile", attributes: ["name"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return likes.map((like: any) => ({
    likeId: like.id,
    user: {
      id: like.user?.id ?? null,
      email: like.user?.email ?? null,
      name: like.user?.profile?.name ?? null,
    },
    createdAt: like.createdAt,
  }));
};

// Get comment service
interface CommentWithUser {
  commentId: number;
  content: string;
  likeCount: number;
  replyCount: number;
  likedByCurrentUser: boolean;
  user: { id: number | null; email: string | null; name?: string | null };
  createdAt: Date;
}

export interface PaginatedCommentsResponse {
  comments: CommentWithUser[];
  totalCount: number;
}

export const getPostCommentsService = async (
  postId: number,
  userId: number,
  page: number,
  limit: number 
): Promise<PaginatedCommentsResponse> => {
  const post = await Post.findByPk(postId);
  if (!post)
    throw Object.assign(new Error("Post not found"), { statusCode: 404 });

  const offset = (page - 1) * limit;

  const userLikes = await CommentLike.findAll({
    where: { userId },
    include: [
      {
        model: PostComment,
        as: "comment",
        where: { postId: postId },
        attributes: [],
      },
    ],
  });
  const likedCommentIds = new Set(userLikes.map((like) => like.commentId));

  const { rows, count } = await PostComment.findAndCountAll({
    where: {
      postId,
      parentId: null,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
        include: [{ model: Profile, as: "profile", attributes: ["name"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
  });

  const comments = rows.map((comment: any) => ({
    commentId: comment.id,
    content: comment.content,
    likeCount: comment.likeCount,
    replyCount: comment.replyCount,
    likedByCurrentUser: likedCommentIds.has(comment.id),
    user: {
      id: comment.user?.id ?? null,
      email: comment.user?.email ?? null,
      name: comment.user?.profile?.name ?? null,
    },
    createdAt: comment.createdAt,
  }));

  return { comments, totalCount: count };
};

//Get perticular comment reply
export const getCommentRepliesService = async (
  parentCommentId: number,
  userId: number
): Promise<CommentWithUser[]> => {
  const userLikes = await CommentLike.findAll({
    where: { userId },
    include: [
      {
        model: PostComment,
        as: "comment",
        where: { parentId: parentCommentId },
        attributes: [],
      },
    ],
  });
  const likedCommentIds = new Set(userLikes.map((like) => like.commentId));

  const replies = await PostComment.findAll({
    where: {
      parentId: parentCommentId,
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
        include: [{ model: Profile, as: "profile", attributes: ["name"] }],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  return replies.map((reply: any) => ({
    commentId: reply.id,
    content: reply.content,
    likeCount: reply.likeCount,
    replyCount: reply.replyCount,
    likedByCurrentUser: likedCommentIds.has(reply.id),
    user: {
      id: reply.user?.id ?? null,
      email: reply.user?.email ?? null,
      name: reply.user?.profile?.name ?? null,
    },
    createdAt: reply.createdAt,
  }));
};

//Get all repost of perticular repost
export interface PostWithAuthor extends Post {
  author?: {
    id: number;
    email: string;
    profile?: { name: string | null };
  };
}
export const getPostRepostsService = async (postId: number) => {
  const reposts = await Post.findAll({
    where: { originalPostId: postId, isRepost: true },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "email"],
        include: [{ model: Profile, as: "profile", attributes: ["name"] }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return (reposts as PostWithAuthor[]).map((r) => ({
    repostId: r.id,
    repostComment: r.repostComment ?? null,
    createdAt: r.createdAt,
    user: {
      id: r.author?.id ?? null,
      email: r.author?.email ?? null,
      name: r.author?.profile?.name ?? null,
    },
  }));
};

//Edit post
export const updatePostService = async (
  postId: number,
  userId: number,
  content: string
) => {
  return withTransaction(async (t) => {
    const post = await Post.findByPk(postId, { transaction: t });

    if (!post) {
      const error = new Error("Post not found");
      (error as any).statusCode = 404;
      throw error;
    }

    if (post.userId !== userId) {
      const error = new Error("You are not authorized to edit this post");
      (error as any).statusCode = 403;
      throw error;
    }

    post.content = content;
    post.isEdited = true;
    await post.save({ transaction: t });

    return post.toJSON();
  });
};

//Delete Repost
export const deletePostService = async (postId: number, userId: number) => {
  return withTransaction(async (t) => {
    const post = await Post.findByPk(postId, { transaction: t });

    if (!post) {
      const error = new Error("Post not found");
      (error as any).statusCode = 404;
      throw error;
    }

    if (post.userId !== userId) {
      const error = new Error("You are not authorized to delete this post");
      (error as any).statusCode = 403;
      throw error;
    }

    await post.destroy({ transaction: t });

    return { message: "Post deleted successfully" };
  });
};

//Like on comment
export const CommentLikeService = {
  toggleLike: async (commentId: number, userId: number) => {
    return withTransaction(async (t) => {
      const comment = await PostComment.findByPk(commentId, { transaction: t });
      if (!comment) {
        const error = new Error("Comment not found");
        (error as any).statusCode = 404;
        throw error;
      }

      const existingLike = await CommentLike.findOne({
        where: { commentId, userId },
        transaction: t,
      });

      if (existingLike) {
        await existingLike.destroy({ transaction: t });
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        await comment.save({ transaction: t });
        return { liked: false, likeCount: comment.likeCount };
      } else {
        await CommentLike.create({ commentId, userId }, { transaction: t });
        comment.likeCount += 1;
        await comment.save({ transaction: t });
        return { liked: true, likeCount: comment.likeCount };
      }
    });
  },
};

//delete comment of apna
export const deleteCommentService = async (
  commentId: number,
  userId: number
) => {
  return withTransaction(async (t) => {
    const comment = await PostComment.findByPk(commentId, { transaction: t });
    if (!comment) {
      const error = new Error("Comment not found");
      (error as any).statusCode = 404;
      throw error;
    }

    if (comment.userId !== userId) {
      const error = new Error("You are not authorized to delete this comment");
      (error as any).statusCode = 403;
      throw error;
    }

    const deleteCount = 1 + comment.replyCount;

    const post = await Post.findByPk(comment.postId, { transaction: t });

    await comment.destroy({ transaction: t });

    if (post) {
      post.commentCount = Math.max(0, post.commentCount - deleteCount);
      await post.save({ transaction: t });
    }

    return { message: "Comment deleted successfully" };
  });
};
