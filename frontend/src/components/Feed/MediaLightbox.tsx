import React, { useState, lazy, Suspense } from "react";
import { MediaItem } from "./PostItem";
import {
  // PostCommentUser,
  Post as PostType,
  // RepostWithUser,
  getPostReposts,
} from "../../api/Post";
import {
  AiOutlineClose,
  AiOutlineLike,
  AiOutlineComment,
  AiOutlineRetweet,
} from "react-icons/ai";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { BiCommentDetail } from "react-icons/bi";
import { MdAccountCircle } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";

interface MediaLightboxProps {
  post: PostType;
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  handleLike: () => void;
  handleRepost: (comment?: string) => void;
  isLiked: boolean;
  isReposted: boolean;
  timeSince: (dateString: string) => string;
}

const CommentSection = lazy(() => import("./CommentSection"));
const RepostModal = lazy(() => import("./RepostModal"));
const ReactionsBox = lazy(() => import("./ReactionsBox"));
const RepostDialog = lazy(() => import("./RepostDialog"));

const PostContent: React.FC<{ post: PostType }> = ({ post }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderContentWithHashtags = (text: string | null): React.ReactNode => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span
            key={index}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const MAX_VISIBLE_CHARS = 150;
  const MAX_NEWLINES = 3;
  const content = post.content || "";
  const lines = content.split("\n");
  const visibleLines = lines.slice(0, MAX_NEWLINES);
  const visibleText = visibleLines.join("\n");
  const trimmedText =
    visibleText.length > MAX_VISIBLE_CHARS
      ? visibleText.slice(0, MAX_VISIBLE_CHARS) + "..."
      : visibleText;
  const shouldTruncate =
    content.length > MAX_VISIBLE_CHARS || lines.length > MAX_NEWLINES;
  const displayText = isExpanded ? content : trimmedText;

  return (
    <div className="text-gray-700 mt-1 whitespace-pre-wrap break-words">
      {renderContentWithHashtags(displayText)}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 font-semibold ml-1 hover:underline"
        >
          {isExpanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
};

const MediaLightbox: React.FC<MediaLightboxProps> = ({
  post,
  media,
  initialIndex,
  onClose,
  handleLike,
  handleRepost,
  isLiked,
  isReposted,
  timeSince,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [isRepostDropdownOpen, setIsRepostDropdownOpen] = useState(false);
  const [isReactionsOpen, setIsReactionsOpen] = useState(false);
  const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false);

  const repostsQuery = useQuery({
    queryKey: ["reposts", post.id],
    queryFn: () => getPostReposts(post.id),
    enabled: isRepostDialogOpen,
  });

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleRepostFromModal = (postToRepost: PostType, thought: string) => {
    handleRepost(thought?.trim() || "");
    setIsRepostModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 flex justify-center items-center overflow-auto">
        <button
          title="close lightbox"
          className="absolute top-4 right-4 text-white text-3xl"
          onClick={onClose}
        >
          <AiOutlineClose />
        </button>

        <div className="flex flex-col md:flex-row gap-4 max-w-5xl w-full h-[81vh] mx-2 md:mx-0 bg-white rounded-lg overflow-hidden">
          <div className="relative w-full md:w-2/3 flex justify-center items-center bg-black">
            {media[currentIndex].type === "video" ? (
              <video
                src={media[currentIndex].url}
                controls
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <img
                src={media[currentIndex].url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            )}

            {media.length > 1 && (
              <>
                <button
                  title="previous media"
                  onClick={prevMedia}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
                >
                  <FaArrowLeft />
                </button>
                <button
                  title="next media"
                  onClick={nextMedia}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
                >
                  <FaArrowRight />
                </button>
              </>
            )}
          </div>

          <div className="w-full md:w-1/3 flex flex-col">
            <div className="mb-4 p-4">
              <div className="flex items-center gap-2">
                <MdAccountCircle className="w-10 h-10 text-gray-500 rounded-full flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">
                    {post.author?.profile?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {timeSince(post.createdAt)} ago
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <PostContent post={post} />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 py-3 border-t border-b border-gray-100 px-4">
              <span
                className="cursor-pointer hover:text-blue-600"
                onClick={() => setIsReactionsOpen(true)}
              >
                <span className="font-semibold">{post.likeCount}</span> Likes
              </span>
              <div className="flex gap-4">
                <span className="cursor-pointer hover:text-blue-600">
                  <span className="font-semibold">{post.commentCount}</span>{" "}
                  Comments
                </span>
                <span
                  className="cursor-pointer hover:text-blue-600"
                  onClick={() => setIsRepostDialogOpen(true)}
                >
                  <span className="font-semibold">{post.repostCount}</span>{" "}
                  Reposts
                </span>
              </div>
            </div>

            <div className="flex justify-around text-gray-600 py-2 border-b border-gray-100 px-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 ${
                  isLiked ? "text-blue-600" : "text-gray-600"
                }`}
              >
                <AiOutlineLike size={20} />
                <span className="hidden sm:inline">Like</span>
              </button>
              <button
                // onClick={() =>
                //   document.querySelector("#lightbox-comment-input")?.focus()
                // }
                onClick={() => {
                  const input = document.querySelector(
                    "#lightbox-comment-input"
                  ) as HTMLInputElement | HTMLTextAreaElement | null;
                  input?.focus();
                }}
                className="flex items-center gap-1 p-2 rounded-md hover:bg-gray-100"
              >
                <AiOutlineComment size={20} />
                <span className="hidden sm:inline">Comment</span>
              </button>
              <div className="relative flex flex-col items-center gap-1">
                <button
                  onClick={() => setIsRepostDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 ${
                    isReposted ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  <AiOutlineRetweet size={20} />
                  <span className="hidden sm:inline">Repost</span>
                </button>
                {isRepostDropdownOpen && (
                  <div
                    className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl shadow-lg w-64 z-20 overflow-hidden"
                    onMouseLeave={() => setIsRepostDropdownOpen(false)}
                  >
                    <button
                      onClick={() => {
                        setIsRepostModalOpen(true);
                        setIsRepostDropdownOpen(false);
                      }}
                      className="flex flex-col items-start w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BiCommentDetail className="text-gray-600 text-lg" />
                        <span className="text-sm font-semibold text-gray-800">
                          Repost with your thoughts
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleRepost();
                        setIsRepostDropdownOpen(false);
                      }}
                      className="flex flex-col items-start w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <AiOutlineRetweet className="text-gray-600 text-lg" />
                        <span className="text-sm font-semibold text-gray-800">
                          Repost
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto min-h-0 
                         scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
            >
              <Suspense
                fallback={
                  <p className="text-gray-500 text-sm px-4 pt-4">
                    Loading comments...
                  </p>
                }
              >
                <div className="px-4 pt-4">
                  {" "}
                  <CommentSection
                    postId={post.id}
                    timeSince={timeSince}
                    inputId="lightbox-comment-input"
                  />
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {isRepostModalOpen && (
          <RepostModal
            post={post}
            onClose={() => setIsRepostModalOpen(false)}
            onSubmit={handleRepostFromModal}
          />
        )}
        {isReactionsOpen && (
          <ReactionsBox
            postId={post.id}
            onClose={() => setIsReactionsOpen(false)}
          />
        )}
        {isRepostDialogOpen && (
          <RepostDialog
            onClose={() => setIsRepostDialogOpen(false)}
            reposts={repostsQuery.data || []}
            loading={repostsQuery.isLoading}
            originalPost={post}
            timeSince={timeSince}
            postItemProps={{
              isLiked: isLiked,
              timeSince: timeSince,
              handleLike: () => Promise.resolve(),
            }}
          />
        )}
      </Suspense>
    </>
  );
};

export default MediaLightbox;
