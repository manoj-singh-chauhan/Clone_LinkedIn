import { Response } from "express";
import { createPostSchema } from "./post.validation";
import {
  PostService,
  getPostsService,
  PostRepostService,
  PostLikeService,
  PostCommentService,
  updatePostService,
} from "./post.service";
import "multer";
import { getPostLikesService } from "./post.service";
import { getPostCommentsService } from "./post.service";
import { getPostRepostsService } from "./post.service";
import logger from "../../utils/logger";

//CREATE POST
export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedBody = createPostSchema.parse(req.body);
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const newPost = await PostService.createPost(validatedBody, userId);

    logger.info(newPost);

    return res.status(201).json({ message: "Post created", post: newPost });
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ message: "Validation failed", errors: err.errors });
    }
    return res.status(err.statusCode || 500).json({ message: err.message || "Failed to create post" });
  }
};
// FETCH POSTS
export const fetchPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const posts = await getPostsService(userId, page, limit);

    res.status(200).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: error.message || "Failed to fetch posts" });
  }
};

//LIKE POST
export const likePostHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const postId = Number(req.params.id);
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const result = await PostLikeService.toggleLike(postId, userId);
    // console.log(result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// COMMENT ON POST
export const commentPostHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const postId = Number(req.params.id);
  const userId = req.userId;
  const { content } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!content?.trim())
    return res.status(400).json({ message: "Comment cannot be empty" });

  try {
    const comment = await PostCommentService.addComment(
      postId,
      userId,
      content
    );
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

//REPOST ON POST
export const repostPostHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const postId = Number(req.params.id);
  const userId = req.userId;
  const { repostComment } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const repost = await PostRepostService.repostPost(
      postId,
      userId,
      repostComment
    );

    // return res.status(201).json({
    //   message: "Post shared successfully",
    //   type: repost.type,
    //   repost: {
    //     repostId: repost.repostId,
    //     originalPostId: repost.originalPostId,
    //     content: repost.content,
    //     media: repost.media,
    //     repostComment: repost.repostComment,
    //     repostCount: repost.repostCount,
    //   },
    // });
    return res.status(201).json({ message: "Post shared successfully" });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      message: err.message || "Something went wrong",
    });
  }
};

// Likes
export const getPostLikesHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const postId = Number(req.params.id);
  if (isNaN(postId))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const likes = await getPostLikesService(postId);
    res.status(200).json({ message: "Likes fetched successfully", likes });
  } catch (err: any) {
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to fetch likes" });
  }
};

// Comments
export const getPostCommentsHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const postId = Number(req.params.id);
  if (isNaN(postId))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const comments = await getPostCommentsService(postId);
    res
      .status(200)
      .json({ message: "Comments fetched successfully", comments });
  } catch (err: any) {
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to fetch comments" });
  }
};




export const getPostRepostsHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const postId = Number(req.params.id);
  try {
    const reposts = await getPostRepostsService(postId);
    res.status(200).json({
      message: "Reposts fetched successfully",
      reposts,
    });
  } catch (err: any) {
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to fetch reposts" });
  }
};

export const updatePostHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.userId;
    const { content } = req.body;

    console.log("frontend data ", req.body);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const updatedPost = await updatePostService(postId, userId, content);

    // console.log("final data ",res);

    return res
      .status(200)
      .json({ message: "Post updated successfully", post: updatedPost });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to update post" });
  }
};