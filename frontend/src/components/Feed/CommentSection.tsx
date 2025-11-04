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
import { useAuth } from "../../context/AuthContext"; // <-- Yahaan se 'user' aa raha hai
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

// Helper function (Username ko style karne ke liye)
const renderCommentContent = (text: string) => {
  // Yeh Regex @username ko dhoondhega
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <strong key={index} className="text-blue-600 font-semibold">
          {part}
        </strong>
      );
    }
    return part;
  });
};

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  timeSince,
  inputId = "comment-input",
}) => {
  const { user } = useAuth(); // <-- 'user' object (jismein ab 'name' hona chahiye)
  const queryClient = useQueryClient();
  const commentsQueryKey = ["comments", postId];

  const [commentText, setCommentText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false); // Reply box ke liye
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [replyMap, setReplyMap] = useState<Record<number, PostCommentUser[]>>(
    {}
  );
  const [loadingReplies, setLoadingReplies] = useState<number | null>(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState<number | null>(
    null
  );

  const [isInputActive, setIsInputActive] = useState(false);

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
      setIsInputActive(false); 
      setShowEmojiPicker(false);
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
      
      // --- FIX 1: "YOU" PROBLEM ---
      // 'user' object (useAuth() se) ab 'name' property rakhta hai
      // (kyunki humne login controller fix kar diya hai)
      const currentUserName = user?.name || user?.email || "Unknown"; // "You" ko hata diya

      const newReplyComment: PostCommentUser = {
        commentId: newReply.commentId,
        content: newReply.content,
        createdAt: newReply.createdAt,
        likeCount: 0,
        replyCount: 0,
        likedByCurrentUser: false,
        user: {
          id: Number(user?.id) || null,
          name: currentUserName, // <-- Yahaan 'currentUserName' ka istemaal karein
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
      setShowReplyEmojiPicker(false);
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
  
  // Reply box ke liye naya handler
  const handleReplyEmojiClick = (emojiData: EmojiClickData) => {
    if (replyingTo === null) return;
    setReplyTextMap((prev) => ({
      ...prev,
      [replyingTo]: (prev[replyingTo] || "") + emojiData.emoji,
    }));
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

  const handleReplyToReply = (
    parentCommentId: number,
    userToReply: PostCommentUser["user"]
  ) => {
    setReplyingTo(parentCommentId);
    // --- FIX 1 (Again): "User" PROBLEM ---
    const userName = userToReply?.name || userToReply?.email || "Unknown"; // "User" ko hata diya
    setReplyTextMap((prev) => ({
      ...prev,
      [parentCommentId]: `@${userName} `,
    }));
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
      
      {/* --- LINKEDIN-STYLE INPUT BOX --- */}
      <div className="flex gap-2 items-start">
        <MdAccountCircle className="w-10 h-10 text-gray-400 rounded-full flex-shrink-0" />

        {!isInputActive ? (
          // ----- STATE 1: INACTIVE (Default View) -----
          <div className="flex-1 flex items-center border border-gray-300 rounded-full px-3 py-1">
            <input
              id={inputId}
              type="text"
              placeholder="Add a comment..."
              className="flex-1 outline-none py-2 px-1 rounded-full cursor-text"
              onFocus={() => setIsInputActive(true)} 
            />
            <BsEmojiSmile
              size={22}
              className="text-gray-500 cursor-pointer hover:text-yellow-500 ml-2"
              onClick={() => setIsInputActive(true)}
            />
          </div>
        ) : (
          // ----- STATE 2: ACTIVE (Expanded View) -----
          <div className="flex-1 flex flex-col relative border border-gray-300 rounded-xl p-3">
            <textarea
              id={inputId}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 outline-none w-full text-sm resize-none"
              rows={3}
              autoFocus 
            />
            {/* Bottom bar with buttons */}
            <div className="flex justify-between items-center mt-3">
              <BsEmojiSmile
                size={22}
                className="text-gray-500 cursor-pointer hover:text-yellow-500"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              />

              <div className="flex gap-2">
                <button
                  className="text-sm font-semibold text-gray-600 px-4 py-1 rounded-full hover:bg-gray-200 transition"
                  onClick={() => {
                    setIsInputActive(false);
                    setCommentText("");
                    setShowEmojiPicker(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || commentMutation.isPending}
                >
                  {commentMutation.isPending ? "Posting..." : "Post"}
                </button>
              </div>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute top-full z-50 mt-1">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={350}
                  height={400}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* --- END INPUT BOX --- */}

      {/* --- Comment List --- */}
      <div className="space-y-3 mt-2">
        {comments.map((comment) => {
          const replies = replyMap[comment.commentId] || [];
          const isReplying = replyingTo === comment.commentId;
          const areRepliesVisible = replyMap[comment.commentId] != null;
          
          // --- FIX 1 (Again): Fallback logic
          const commentAuthorName = comment.user?.name || comment.user?.email || "Unknown";

          return (
            <Fragment key={comment.commentId}>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                  <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1 relative">
                    {/* ... 3-dot menu ... */}
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
                      {commentAuthorName} {/* <-- YAHAN FIX HAI */}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {renderCommentContent(comment.content)}
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
                        onClick={() => {
                          if (isReplying) {
                            setReplyingTo(null);
                            setShowReplyEmojiPicker(false);
                          } else {
                            setReplyingTo(comment.commentId);
                            // --- FIX 1 (Again): Fallback logic
                            const userName = comment.user?.name || comment.user?.email || "Unknown";
                            setReplyTextMap((prev) => ({
                              ...prev,
                              [comment.commentId]: `@${userName} `,
                            }));
                          }
                        }}
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

                {/* --- FIX 2: NAYA REPLY BOX UI --- */}
                {isReplying && (
                  <div className="ml-10 mt-2 flex gap-2 items-start">
                    <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                    {/* Active/Expanded Box Style */}
                    <div className="flex-1 flex flex-col relative border border-gray-300 rounded-xl p-3">
                      <textarea
                        id={`reply-input-${comment.commentId}`}
                        placeholder="Add a reply..."
                        value={replyTextMap[comment.commentId] || ""}
                        onChange={(e) =>
                          handleReplyChange(comment.commentId, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { // Submit on Enter
                            e.preventDefault();
                            handleReplySubmit(comment.commentId);
                          }
                        }}
                        className="flex-1 outline-none w-full text-sm resize-none"
                        rows={2} // Replies ke liye 2 rows kaafi hain
                        autoFocus
                      />
                      {/* Bottom bar with buttons */}
                      <div className="flex justify-between items-center mt-3">
                        <BsEmojiSmile
                          size={22}
                          className="text-gray-500 cursor-pointer hover:text-yellow-500"
                          onClick={() => setShowReplyEmojiPicker((prev) => !prev)}
                        />

                        <div className="flex gap-2">
                          <button
                            className="text-sm font-semibold text-gray-600 px-4 py-1 rounded-full hover:bg-gray-200 transition"
                            onClick={() => {
                              setReplyingTo(null); // Reply box band karein
                              setReplyTextMap((prev) => ({...prev, [comment.commentId]: ""})); // Text clear karein
                              setShowReplyEmojiPicker(false);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                            onClick={() => handleReplySubmit(comment.commentId)}
                            disabled={
                              !(replyTextMap[comment.commentId] || "").trim() ||
                              replyMutation.isPending
                            }
                          >
                            {replyMutation.isPending ? "Posting..." : "Reply"}
                          </button>
                        </div>
                      </div>
                      
                      {/* Reply Emoji Picker */}
                      {showReplyEmojiPicker && (
                        <div className="absolute top-full z-50 mt-1">
                          <EmojiPicker
                            onEmojiClick={handleReplyEmojiClick}
                            width={350}
                            height={400}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* --- END FIX 2 --- */}


                {/* Replies List */}
                {areRepliesVisible && (
                  <div className="ml-10 space-y-3">
                    {replies.map((reply) => {
                      // --- FIX 1 (Again): Fallback logic
                      const replyAuthorName = reply.user?.name || reply.user?.email || "Unknown";

                      return (
                        <div key={reply.commentId} className="flex gap-2">
                          <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                          <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1 relative">
                            {/* ... 3-dot menu for reply ... */}
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
                              {replyAuthorName} {/* <-- YAHAN FIX HAI */}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {renderCommentContent(reply.content)}
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
                              <span className="font-bold">·</span>
                              <button
                                onClick={() =>
                                  handleReplyToReply(
                                    comment.commentId,
                                    reply.user
                                  )
                                }
                                className="font-semibold text-gray-600 hover:underline"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}

        {/* Load more comments button */}
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