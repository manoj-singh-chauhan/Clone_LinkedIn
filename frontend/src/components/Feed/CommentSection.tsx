import React, { useState, useCallback, Fragment } from "react";
import {
  getPostComments,
  commentPost,
  likeComment,
  replyToComment,
  getCommentReplies,
  deleteComment,
  PostCommentUser,
  GetCommentsResponse,
  CommentReplyResponse,
} from "../../api/Post";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { MdAccountCircle, MdDelete, MdReport } from "react-icons/md";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import { AiOutlineLike } from "react-icons/ai";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface CommentSectionProps {
  postId: number;
  timeSince: (dateString: string) => string;
  inputId?: string;
}

const COMMENT_LIMIT = 3;

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  timeSince,
  inputId = "comment-input",
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const commentsQueryKey = ["comments", postId];

  const [commentText, setCommentText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [replyMap, setReplyMap] = useState<Record<number, PostCommentUser[]>>(
    {}
  );
  const [loadingReplies, setLoadingReplies] = useState<number | null>(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState<number | null>(
    null
  );

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: commentsQueryKey,
    queryFn: ({ pageParam = 1 }) =>
      getPostComments(postId, pageParam, COMMENT_LIMIT),
    getNextPageParam: (
      lastPage: GetCommentsResponse,
      allPages: GetCommentsResponse[]
    ) => {
      const totalDbComments = lastPage.totalCount;
      const totalFetchedComments = allPages.flatMap(
        (page) => page.comments
      ).length;

      if (totalFetchedComments < totalDbComments) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: postId > 0,
  });

  const comments = data?.pages.flatMap((page) => page.comments) || [];

  const commentMutation = useMutation({
    mutationFn: (text: string) => commentPost(postId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setCommentText("");
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: number) => likeComment(commentId),
    onSuccess: (data, commentId) => {
      queryClient.setQueryData<InfiniteData<GetCommentsResponse>>(
        commentsQueryKey,
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: GetCommentsResponse) => ({
              ...page,
              comments: page.comments.map((comment: PostCommentUser) =>
                comment.commentId === commentId
                  ? {
                      ...comment,
                      likeCount: data.likeCount,
                      likedByCurrentUser: data.liked,
                    }
                  : comment
              ),
            })),
          };
        }
      );

      setReplyMap((currentMap) => {
        const newMap = { ...currentMap };
        for (const parentId in newMap) {
          newMap[parentId] = newMap[parentId].map((reply) =>
            reply.commentId === commentId
              ? {
                  ...reply,
                  likeCount: data.likeCount,
                  likedByCurrentUser: data.liked,
                }
              : reply
          );
        }
        return newMap;
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({
      parentCommentId,
      content,
    }: {
      parentCommentId: number;
      content: string;
    }) => replyToComment(parentCommentId, content),
    onSuccess: (newReply: CommentReplyResponse, variables) => {
      const newReplyComment: PostCommentUser = {
        commentId: newReply.commentId,
        content: newReply.content,
        createdAt: newReply.createdAt,
        likeCount: 0,
        replyCount: 0,
        likedByCurrentUser: false,
        user: {
          id: Number(user?.id) || null,
          name: user?.name || "You",
          email: user?.email || null,
        },
      };

      setReplyMap((currentMap) => ({
        ...currentMap,
        [variables.parentCommentId]: [
          ...(currentMap[variables.parentCommentId] || []),
          newReplyComment,
        ],
      }));
      setReplyTextMap((prev) => ({
        ...prev,
        [variables.parentCommentId]: "",
      }));
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: (data, commentId) => {
      queryClient.setQueryData<InfiniteData<GetCommentsResponse>>(
        commentsQueryKey,
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: GetCommentsResponse) => ({
              ...page,
              comments: page.comments.filter(
                (c: PostCommentUser) => c.commentId !== commentId
              ),
            })),
          };
        }
      );

      setReplyMap((currentMap) => {
        const newMap = { ...currentMap };
        for (const parentId in newMap) {
          newMap[parentId] = newMap[parentId].filter(
            (reply) => reply.commentId !== commentId
          );
        }
        return newMap;
      });

      queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setCommentText((prev) => prev + emojiData.emoji);
  };

  const handleCommentSubmit = () => {
    const text = commentText.trim();
    if (!text) return;
    commentMutation.mutate(text);
  };

  const handleLikeComment = (commentId: number) => {
    likeCommentMutation.mutate(commentId);
  };

  const handleReplyChange = (commentId: number, text: string) => {
    setReplyTextMap((prev) => ({ ...prev, [commentId]: text }));
  };

  const handleReplySubmit = (parentCommentId: number) => {
    const content = replyTextMap[parentCommentId]?.trim();
    if (!content) return;
    replyMutation.mutate({ parentCommentId, content });
  };

  const handleToggleReplies = useCallback(
    async (commentId: number) => {
      if (replyMap[commentId]) {
        setReplyMap((currentMap) => {
          const newMap = { ...currentMap };
          delete newMap[commentId];
          return newMap;
        });
        return;
      }

      setLoadingReplies(commentId);
      try {
        const replies = await getCommentReplies(commentId);
        setReplyMap((currentMap) => ({ ...currentMap, [commentId]: replies }));
      } catch (error) {
        console.error("Failed to fetch replies:", error);
      } finally {
        setLoadingReplies(null);
      }
    },
    [replyMap]
  );

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  if (isLoading) {
    return (
      <p className="p-4 text-center text-sm text-gray-500">
        Loading comments...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="p-4 text-center text-sm text-red-500">
        Failed to load comments.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3 px-2">
      <div className="flex gap-2 items-start">
        <MdAccountCircle className="w-10 h-10 text-gray-400 rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col relative">
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-1">
            <input
              id={inputId}
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommentSubmit();
              }}
              className="flex-1 outline-none py-2 px-1 rounded-full"
            />
            <BsEmojiSmile
              size={22}
              className="text-gray-500 cursor-pointer hover:text-yellow-500 ml-2"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            />
          </div>
          {showEmojiPicker && (
            <div className="absolute -right-2 -top-[400px] z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
              />
            </div>
          )}
          {commentText.trim() && (
            <button
              className="mt-1 bg-blue-600 text-white px-4 py-1 rounded-full text-sm hover:bg-blue-700 transition self-end"
              onClick={handleCommentSubmit}
              disabled={commentMutation.isPending}
            >
              {commentMutation.isPending ? "Posting..." : "Send"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-2">
        {comments.map((comment) => {
          const replies = replyMap[comment.commentId] || [];
          const isReplying = replyingTo === comment.commentId;
          const areRepliesVisible = replyMap[comment.commentId] != null;

          return (
            <Fragment key={comment.commentId}>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                  <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1 relative">
                    <div className="absolute top-2 right-2">
                      <button
                        title="Comment options"
                        onClick={() =>
                          setActiveCommentMenu(
                            activeCommentMenu === comment.commentId
                              ? null
                              : comment.commentId
                          )
                        }
                        className="p-1 rounded-full hover:bg-gray-200"
                      >
                        <BsThreeDots size={16} />
                      </button>
                      {activeCommentMenu === comment.commentId && (
                        <div
                          className="absolute top-full right-0 bg-white shadow-lg rounded-md z-10 w-32 border"
                          onMouseLeave={() => setActiveCommentMenu(null)}
                        >
                          {comment.user?.id === Number(user?.id) && (
                            <button
                              onClick={() => {
                                handleDeleteComment(comment.commentId);
                                setActiveCommentMenu(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <MdDelete size={16} /> Delete
                            </button>
                          )}
                          {comment.user?.id !== Number(user?.id) && (
                            <button
                              onClick={() => {
                                alert("not implemented");
                                setActiveCommentMenu(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <MdReport size={16} /> Report
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-800">
                      {comment.user?.name}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {comment.content}
                    </p>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <span>{timeSince(comment.createdAt)} ago</span>
                      <span className="font-bold">·</span>
                      <button
                        onClick={() => handleLikeComment(comment.commentId)}
                        className={`font-semibold hover:underline ${
                          comment.likedByCurrentUser
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        Like
                      </button>
                      {comment.likeCount > 0 && (
                        <>
                          <span className="text-gray-400">·</span>
                          <span className="flex items-center gap-0.5">
                            <AiOutlineLike
                              size={14}
                              className="text-gray-500"
                            />
                            {comment.likeCount}
                          </span>
                        </>
                      )}
                      <span className="font-bold">·</span>
                      <button
                        onClick={() =>
                          setReplyingTo(isReplying ? null : comment.commentId)
                        }
                        className="font-semibold text-gray-600 hover:underline"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ml-10">
                  {comment.replyCount > 0 && (
                    <button
                      onClick={() => handleToggleReplies(comment.commentId)}
                      className="text-sm font-semibold text-gray-600 hover:underline"
                    >
                      {loadingReplies === comment.commentId
                        ? "Loading..."
                        : areRepliesVisible
                        ? "Hide replies"
                        : `View ${comment.replyCount} ${
                            comment.replyCount > 1 ? "replies" : "reply"
                          }`}
                    </button>
                  )}
                </div>

                {isReplying && (
                  <div className="ml-10 mt-2 flex gap-2 items-start">
                    <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                    <div className="flex-1 flex flex-col relative">
                      <div className="flex items-center border border-gray-300 rounded-full px-3 py-1">
                        <input
                          type="text"
                          placeholder="Write a reply..."
                          value={replyTextMap[comment.commentId] || ""}
                          onChange={(e) =>
                            handleReplyChange(comment.commentId, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleReplySubmit(comment.commentId);
                          }}
                          className="flex-1 outline-none py-1 px-1 rounded-full text-sm"
                          autoFocus
                        />
                      </div>
                      {(replyTextMap[comment.commentId] || "").trim() && (
                        <button
                          className="mt-1 bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs hover:bg-blue-700 transition self-end"
                          onClick={() => handleReplySubmit(comment.commentId)}
                          disabled={replyMutation.isPending}
                        >
                          {replyMutation.isPending ? "..." : "Post"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {areRepliesVisible && (
                  <div className="ml-10 space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.commentId} className="flex gap-2">
                        <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                        <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1 relative">
                          <div className="absolute top-2 right-2">
                            <button
                              title="Comment options"
                              onClick={() =>
                                setActiveCommentMenu(
                                  activeCommentMenu === reply.commentId
                                    ? null
                                    : reply.commentId
                                )
                              }
                              className="p-1 rounded-full hover:bg-gray-200"
                            >
                              <BsThreeDots size={16} />
                            </button>
                            {activeCommentMenu === reply.commentId && (
                              <div
                                className="absolute top-full right-0 bg-white shadow-lg rounded-md z-10 w-32 border"
                                onMouseLeave={() => setActiveCommentMenu(null)}
                              >
                                {reply.user?.id === Number(user?.id) && (
                                  <button
                                    onClick={() => {
                                      handleDeleteComment(reply.commentId);
                                      setActiveCommentMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <MdDelete size={16} /> Delete
                                  </button>
                                )}
                                {reply.user?.id !== Number(user?.id) && (
                                  <button
                                    onClick={() => {
                                      alert("Report reply (not implemented)");
                                      setActiveCommentMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <MdReport size={16} /> Report
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-gray-800">
                            {reply.user?.name}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {reply.content}
                          </p>
                          <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                            <span>{timeSince(reply.createdAt)} ago</span>
                            <span className="font-bold">·</span>
                            <button
                              onClick={() => handleLikeComment(reply.commentId)}
                              className={`font-semibold hover:underline ${
                                reply.likedByCurrentUser
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            >
                              Like
                            </button>
                            {reply.likeCount > 0 && (
                              <>
                                <span className="text-gray-400">·</span>
                                <span className="flex items-center gap-0.5">
                                  <AiOutlineLike
                                    size={14}
                                    className="text-gray-500"
                                  />
                                  {reply.likeCount}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}

        {hasNextPage && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm font-semibold text-blue-600 hover:underline disabled:text-gray-500"
            >
              {isFetchingNextPage ? "Loading more..." : "Load more comments"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;