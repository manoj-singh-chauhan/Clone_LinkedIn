import api from "./axois";
import axios from "axios";
import { AxiosError } from "axios";
import { APIErrorResponse } from "../types/errors";

export interface CreatePostPayload {
  content?: string | null;
  hashtags?: string | null;
  isRepost?: boolean;
  originalPostId?: number | null;
  repostComment?: string | null;
  postType?: "public" | "connection-only";
  postFormat?: "standard" | "article";
  media?: string[];
}

export interface PostResponse {
  id: number;
  content: string;
}

export const createPost = async (
  data: CreatePostPayload,
  mediaFiles?: File[] | null,
  onProgress?: (progress: number) => void,
  setCancelUpload?: (fn: (() => void) | null) => void
): Promise<PostResponse> => {
  const mediaUrls: string[] = [];

  if (mediaFiles && mediaFiles.length > 0) {
    const totalSize = mediaFiles.reduce((sum, file) => sum + file.size, 0);
    let uploadedBytes = 0;

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];

      const sigRes = await api.get("/posts/signature");
      const { apiKey, cloudName, folder, timestamp, signature } = sigRes.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      // const controller = new AbortController();
      // if (setCancelUpload) {
      //   setCancelUpload(() => controller.abort);
      // }

      const controller = new AbortController();
      if (setCancelUpload) {
        setCancelUpload(() => () => controller.abort());
      }

      try {
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          formData,
          {
            signal: controller.signal,
            onUploadProgress: (event) => {
              if (event.total && onProgress) {
                const totalUploadedNow = uploadedBytes + event.loaded;
                const progress = Math.round(
                  (totalUploadedNow / totalSize) * 100
                );
                onProgress(progress);
              }
            },
          }
        );

        uploadedBytes += file.size;
        mediaUrls.push(res.data.secure_url);
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "canceled") {
          // console.log("Upload canceled by user");
          throw new Error("Upload canceled");
          // return;
        } else {
          console.error("Upload failed:", error);
          throw error;
        }
      }
    }
  }

  if (setCancelUpload) setCancelUpload(null);

  const payload = { ...data, media: mediaUrls };
  const res = await api.post<PostResponse>("/posts", payload);
  return res.data;
};

//get
export interface AuthorProfile {
  name: string;
}

export interface PostAuthor {
  id: number;
  email: string;
  profile: AuthorProfile;
}

export interface Post {
  id: number;
  userId: number;
  content: string | null;
  media: { url: string; type: "image" | "video" | "document" }[] | null;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  createdAt: string;
  author: PostAuthor;
  originalPost?: Post | null;
  likedByCurrentUser?: boolean;
  repostedByCurrentUser?: boolean;
  comments?: Comment[];
}

export interface FetchPostsResponse {
  message: string;
  posts: Post[];
}

export const fetchAllPosts = async (
  page: number = 1,
  limit: number = 5
): Promise<Post[]> => {
  try {
    const res = await api.get<FetchPostsResponse>(
      `/posts?page=${page}&limit=${limit}`
    );
    return res.data.posts;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to fetch posts",
        }
      );
    }
    throw error;
  }
};

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

export const likePost = async (postId: number): Promise<LikeResponse> => {
  try {
    const res = await api.post<LikeResponse>(`/posts/${postId}/like`);
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to like post",
        }
      );
    }
    throw error;
  }
};

export interface Comment {
  userId: number;
  content: string;
  createdAt: string;
}

export interface CommentResponse {
  commentCount: number;
  comment: Comment;
}

export const commentPost = async (
  postId: number,
  content: string
): Promise<CommentResponse> => {
  try {
    const res = await api.post<CommentResponse>(`/posts/${postId}/comment`, {
      content,
    });
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to comment on post",
        }
      );
    }
    throw error;
  }
};

export interface RepostResponse {
  reposted: boolean;
  repostCount: number;
}

export const repostPost = async (
  postId: number,
  repostComment?: string
): Promise<RepostResponse> => {
  try {
    const res = await api.post<RepostResponse>(`/posts/${postId}/repost`, {
      repostComment,
    });
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to repost",
        }
      );
    }
    throw error;
  }
};

export interface PostLikeUser {
  id: number;
  email: string;
  profile: {
    name: string;
  };
}

export const getPostLikes = async (postId: number): Promise<PostLikeUser[]> => {
  try {
    const res = await api.get<{ likes: PostLikeUser[] }>(
      `/posts/${postId}/likes`
    );
    return res.data.likes || res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to fetch post likes",
        }
      );
    }
    throw error;
  }
};

export interface PostCommentUser {
  id: number;
  email: string;
  profile: {
    name: string;
  };
  content: string;
  createdAt: string;
}

export const getPostComments = async (
  postId: number
): Promise<PostCommentUser[]> => {
  try {
    const res = await api.get<{ comments: PostCommentUser[] }>(
      `/posts/${postId}/comments`
    );
    return res.data.comments || res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to fetch post comments",
        }
      );
    }
    throw error;
  }
};

export interface RepostWithUser {
  repostId: number;
  repostComment?: string | null;
  createdAt?: string;
  user: {
    id: number | null;
    email: string | null;
    name: string | null;
  };
}

export const getPostReposts = async (
  postId: number
): Promise<RepostWithUser[]> => {
  const res = await api.get<{ reposts: RepostWithUser[] }>(
    `/posts/${postId}/reposts`
  );
  return res.data.reposts;
};

export interface UpdatePostPayload {
  content: string;
}

export const updatePost = async (
  postId: number,
  data: UpdatePostPayload
): Promise<Post> => {
  try {
    const res = await api.patch<Post>(`/posts/${postId}/postupdate`, data);
    // console.log(res.data);
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to update post",
        }
      );
    }
    throw error;
  }
};

export interface DeletePostResponse {
  message: string;
}

export const deletePost = async (
  postId: number
): Promise<DeletePostResponse> => {
  try {
    const res = await api.delete<DeletePostResponse>(
      `/posts/${postId}/postdelete`
    );
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to delete post",
        }
      );
    }
    throw error;
  }
};
