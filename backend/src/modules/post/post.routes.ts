import { Router } from "express";
import {
  createPost,
  fetchPosts,
  likePostHandler,
  commentPostHandler,
  repostPostHandler,
  getPostLikesHandler,
  getPostCommentsHandler,
  getPostRepostsHandler,
  updatePostHandler,
  deletePostHandler,
  commentLikeHandler,
  commentReplyHandler,
  getCommentRepliesHandler,
} from "./post.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import cloudinary from "../../config/cloudinary.config";

const router = Router();

router.post("/", authenticate, createPost);

router.get("/signature", (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: "linked_clone/post" },
    process.env.CLOUDINARY_API_SECRET!
  );

  res.json({
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
    folder: "linked_clone/post",
    timestamp,
    signature,
  });
});

router.get("/", authenticate, fetchPosts);

router.post("/:id/like", authenticate, likePostHandler);
router.post("/:id/comment", authenticate, commentPostHandler);
router.post("/:id/repost", authenticate, repostPostHandler);

router.get("/:id/likes", authenticate, getPostLikesHandler);
router.get("/:id/comments", authenticate, getPostCommentsHandler);
router.get("/:id/reposts", authenticate, getPostRepostsHandler);
router.patch("/:id/postupdate", authenticate, updatePostHandler);
router.delete("/:id/postdelete", authenticate, deletePostHandler);
router.post("/comments/:id/like", authenticate, commentLikeHandler);
router.post("/comments/:id/reply", authenticate, commentReplyHandler);
router.get("/comments/:id/replies", authenticate, getCommentRepliesHandler);

export default router;
