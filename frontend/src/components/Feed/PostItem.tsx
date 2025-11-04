import React, {
  memo,
  // useCallback,
  useState,
  Suspense,
} from "react";
import {
  Post as PostType,
  likePost,
  repostPost,
  getPostReposts,
  RepostWithUser,
  // MediaItem,
  // PostCommentUser,
} from "../../api/Post";
import {
  AiOutlineLike,
  AiOutlineComment,
  AiOutlineRetweet,
} from "react-icons/ai";
import {
  MdLink,
  MdDelete,
  MdReport,
  MdPersonAdd,
  MdVisibilityOff,
  MdBlock,
  MdEdit,
} from "react-icons/md";
import { MdAccountCircle } from "react-icons/md";
import { FaRegFileAlt } from "react-icons/fa";
import { BiCommentDetail } from "react-icons/bi";
import { BsThreeDots } from "react-icons/bs";
import ReactionsBox from "./ReactionsBox";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";

const RepostModal = React.lazy(() => import("./RepostModal"));
const MediaLightbox = React.lazy(() => import("./MediaLightbox"));
const RepostDialog = React.lazy(() => import("./RepostDialog"));
const CommentSection = React.lazy(() => import("./CommentSection"));

export interface RepostingPost {
  post: PostType;
  openDropdown: boolean;
}

export interface MediaItem {
  url: string;
  type: "image" | "video" | "document";
}

// interface PostItemProps {
//   post: PostType;
//   timeSince: (dateString: string) => string;
//   onEdit: (post: PostType) => void;
//   onDelete: (post: PostType) => void;
//   isLastPost: boolean;
//   lastPostRef?: (node: HTMLDivElement | null) => void;

//   hideRepostButton?: boolean;
//   disableRepostCountClick?: boolean;
// }

export interface PostItemProps {
  post: PostType;
  timeSince: (dateString: string) => string;
  onEdit: (post: PostType) => void;
  onDelete: (post: PostType) => void;
  isLastPost: boolean;
  lastPostRef?: (node: HTMLDivElement | null) => void;

  
  isLiked?: boolean;
  isReposted?: boolean;
  handleLike?: (postId: number) => void;
  handleRepost?: (postId: number, comment?: string) => void;
  handleShowReposts?: (post: PostType) => void;

  
  hideRepostButton?: boolean;
  disableRepostCountClick?: boolean;
}


const PostItem: React.FC<PostItemProps> = memo(
  ({
    post,
    timeSince,
    onEdit,
    onDelete,
    isLastPost,
    lastPostRef,
    hideRepostButton,
    disableRepostCountClick,
  }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false);

    const [lightbox, setLightbox] = useState<{
      media: MediaItem[];
      index: number;
    } | null>(null);
    const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
    const [isRepostDialogOpen, setIsRepostDialogOpen] = useState(false);
    const [repostList, setRepostList] = useState<RepostWithUser[]>([]);
    const [repostLoading, setRepostLoading] = useState(false);

    const [activeLikesBox, setActiveLikesBox] = useState(false);
    const [isRepostDropdownOpen, setIsRepostDropdownOpen] = useState(false);

    const isLiked = post.likedByCurrentUser;
    const isReposted = post.repostedByCurrentUser;
    const isAuthor = Number(user?.id) === post.author.id;

    const authorName = post.author?.profile?.name || "Unknown";
    const postDate = post.createdAt ? timeSince(post.createdAt) : "";
    const media = post.media || [];

    const likeMutation = useMutation({
      mutationFn: () => likePost(post.id),
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: ["posts"] });
        const previousData = queryClient.getQueryData<InfiniteData<PostType[]>>(
          ["posts"]
        );

        if (previousData) {
          const newData = {
            ...previousData,
            pages: previousData.pages.map((page) =>
              page.map((p) =>
                p.id === post.id
                  ? {
                      ...p,
                      likedByCurrentUser: !p.likedByCurrentUser,
                      likeCount: p.likedByCurrentUser
                        ? p.likeCount - 1
                        : p.likeCount + 1,
                    }
                  : p
              )
            ),
          };
          queryClient.setQueryData(["posts"], newData);
        }
        return { previousData };
      },
      onError: (err, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(["posts"], context.previousData);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      },
    });

    const repostMutation = useMutation({
      mutationFn: ({ comment }: { comment?: string }) =>
        repostPost(post.id, comment),
      onMutate: async () => {},
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        setIsRepostModalOpen(false);
        setIsRepostDropdownOpen(false);
      },
    });

    const handleLike = () => likeMutation.mutate();

    const handleRepost = (comment?: string) => {
      repostMutation.mutate({ comment });
    };

    const handleRepostFromModal = (postToRepost: PostType, thought: string) => {
      handleRepost(thought?.trim() || "");
    };

    const handleShowComments = () => {
      setIsCommentSectionOpen((prev) => !prev);
    };

    const handleShowReposts = async () => {
      setIsRepostDialogOpen(true);
      setRepostLoading(true);
      try {
        const reposts = await getPostReposts(post.id);
        setRepostList(reposts);
      } catch {
        setRepostList([]);
      } finally {
        setRepostLoading(false);
      }
    };

    const handleCopyLink = () => {
      const postUrl = `${window.location.origin}/home/post/${post.id}`;
      navigator.clipboard.writeText(postUrl);
      alert("Link copied to clipboard!");
    };

    const handleFollowAuthor = () => alert("Following");
    const handleHidePost = () => alert("Post hidden");
    const handleBlockAuthor = () => alert("Author blocked");
    const handleReportPost = () => alert("Post reported");

    const renderContentWithHashtags = (text: string) => {
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

    return (
      <>
        <div
          ref={isLastPost ? lastPostRef : null}
          className="bg-white border border-gray-200 rounded-sm shadow-sm"
        >
          <div className="flex items-start gap-3 mb-3 p-2 relative">
            <MdAccountCircle className="w-10 h-10 text-gray-500 rounded-full flex-shrink-0" />
            <div className="flex-grow">
              <p className="font-semibold text-gray-800 flex items-center gap-1">
                {authorName}
                <MdOutlineVerifiedUser size={15} title="verified user" />
              </p>
              <p className="text-sm text-gray-500">{postDate} ago</p>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Post options"
              >
                <BsThreeDots size={20} className="text-gray-600" />
              </button>

              {isMenuOpen && (
                <div
                  className="absolute top-12 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-56"
                  onMouseLeave={() => setIsMenuOpen(false)}
                >
                  <ul className="py-1">
                    <MenuItem
                      icon={<MdLink size={18} />}
                      text="Copy link to post"
                      onClick={() => {
                        handleCopyLink();
                        setIsMenuOpen(false);
                      }}
                    />
                    {isAuthor && (
                      <>
                        <MenuItem
                          icon={<MdEdit size={18} />}
                          text="Edit post"
                          onClick={() => {
                            onEdit(post);
                            setIsMenuOpen(false);
                          }}
                        />
                        <MenuItem
                          icon={<MdDelete size={18} />}
                          text="Delete post"
                          onClick={() => {
                            onDelete(post);
                            setIsMenuOpen(false);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        />
                      </>
                    )}
                    {!isAuthor && (
                      <>
                        <MenuItem
                          icon={<MdPersonAdd size={18} />}
                          text={`Follow ${authorName}`}
                          onClick={() => {
                            handleFollowAuthor();
                            setIsMenuOpen(false);
                          }}
                        />
                        <MenuItem
                          icon={<MdVisibilityOff size={18} />}
                          text="I don't want to see this"
                          onClick={() => {
                            handleHidePost();
                            setIsMenuOpen(false);
                          }}
                        />
                        <MenuItem
                          icon={<MdBlock size={18} />}
                          text={`Block ${authorName}`}
                          onClick={() => {
                            handleBlockAuthor();
                            setIsMenuOpen(false);
                          }}
                        />
                        <MenuItem
                          icon={<MdReport size={18} />}
                          text="Report post"
                          onClick={() => {
                            handleReportPost();
                            setIsMenuOpen(false);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        />
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {post.content &&
            (() => {
              const MAX_VISIBLE_CHARS = 200;
              const MAX_NEWLINES = 4;
              const lines = post.content.split("\n");
              const visibleLines = lines.slice(0, MAX_NEWLINES);
              const visibleText = visibleLines.join("\n");
              const trimmedText =
                visibleText.length > MAX_VISIBLE_CHARS
                  ? visibleText.slice(0, MAX_VISIBLE_CHARS) + "..."
                  : visibleText;
              const shouldTruncate =
                post.content.length > MAX_VISIBLE_CHARS ||
                lines.length > MAX_NEWLINES;
              const displayText = isExpanded ? post.content : trimmedText;

              return (
                <div className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed mb-4 text-base px-2">
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
            })()}

          <PostMediaGrid
            media={media as MediaItem[]}
            onClick={(index) =>
              setLightbox({ media: media as MediaItem[], index })
            }
          />

          <div className="flex justify-between items-center text-sm text-gray-600 border-t border-gray-100 pt-3 mt-3 px-2 relative">
            <span
              className="cursor-pointer hover:text-blue-600 relative"
              onClick={() => setActiveLikesBox((prev) => !prev)}
            >
              <span className="font-semibold">{post.likeCount}</span> Likes
              {activeLikesBox && (
                <ReactionsBox
                  postId={post.id}
                  onClose={() => setActiveLikesBox(false)}
                />
              )}
            </span>
            <div className="flex gap-4">
              <span
                className="cursor-pointer hover:text-blue-600"
                onClick={handleShowComments}
              >
                <span className="font-semibold">{post.commentCount}</span>{" "}
                Comments
              </span>
              <span
                className={
                  disableRepostCountClick
                    ? "text-gray-600"
                    : "cursor-pointer hover:text-blue-600"
                }
                onClick={
                  disableRepostCountClick ? undefined : handleShowReposts
                }
              >
                <span className="font-semibold">{post.repostCount}</span>{" "}
                Reposts
              </span>
            </div>
          </div>

          <div className="flex justify-around text-gray-600 mt-2 border-t border-gray-100 pt-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 ${
                isLiked ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <AiOutlineLike size={20} />
              <span className="hidden sm:inline">Like</span>
            </button>
            <button
              onClick={handleShowComments}
              className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100"
            >
              <AiOutlineComment size={20} />
              <span className="hidden sm:inline">Comment</span>
            </button>
            {!hideRepostButton && (
              <div className="relative flex flex-col items-center gap-1">
                <button
                  onClick={() => setIsRepostDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 ${
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
                      <p className="text-xs text-gray-500 pl-7">
                        Create a new post with this post attached
                      </p>
                    </button>
                    <button
                      onClick={() => handleRepost()}
                      className="flex flex-col items-start w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <AiOutlineRetweet className="text-gray-600 text-lg" />
                        <span className="text-sm font-semibold text-gray-800">
                          Repost
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 pl-7">
                        Instantly share this post to your feed
                      </p>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Suspense
            fallback={
              <p className="p-4 text-center text-sm text-gray-500">
                Loading comments...
              </p>
            }
          >
            {isCommentSectionOpen && (
              <CommentSection postId={post.id} timeSince={timeSince} inputId="lightbox-comment-input"/>
            )}
          </Suspense>
        </div>

        <Suspense fallback={null}>
          {isRepostModalOpen && (
            <RepostModal
              post={post}
              onClose={() => setIsRepostModalOpen(false)}
              onSubmit={handleRepostFromModal}
            />
          )}

          {lightbox && (
            <MediaLightbox
              post={post}
              media={lightbox.media}
              initialIndex={lightbox.index}
              onClose={() => setLightbox(null)}
              handleLike={handleLike}
              handleRepost={handleRepost}
              isLiked={isLiked ?? false}
              isReposted={isReposted ?? false}
              timeSince={timeSince}
            />
          )}

          {isRepostDialogOpen && (
            <RepostDialog
              onClose={() => setIsRepostDialogOpen(false)}
              reposts={repostList}
              loading={repostLoading}
              originalPost={post}
              timeSince={timeSince}
              postItemProps={{
                isLiked: isLiked ?? false,
                isReposted: isReposted,
                handleLike: () => likeMutation.mutate(),
                // handleRepost: () => repostMutation.mutate({}),
                handleShowReposts: handleShowReposts,
                hideRepostButton: true,
              }}
            />
          )}
        </Suspense>
      </>
    );
  }
);

export const PostMediaGrid: React.FC<{
  media: MediaItem[];
  onClick?: (index: number) => void;
}> = ({ media, onClick }) => {
  const count = media.length;
  if (count === 0) return null;

  if (count === 1 && media[0].type === "document") {
    const doc = media[0];
    const fileName = doc.url.split("/").pop() || "Document File";
    const fileExtension = fileName.split(".").pop()?.toUpperCase() || "DOC";

    return (
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 flex items-center p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition shadow-md"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-gray-200 text-blue-600 rounded-lg flex-shrink-0 mr-4">
          <FaRegFileAlt className="text-xl" />
        </div>
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-gray-800 truncate">{fileName}</p>
          <p className="text-sm text-gray-500 mt-1">{fileExtension}</p>
        </div>
      </a>
    );
  }

  if (count === 3) {
    return (
      <div className="mb-4 grid grid-cols-3 gap-0.5 h-[24rem] sm:h-[22rem]">
        <div
          className="col-span-2 row-span-2 relative overflow-hidden rounded-sm cursor-pointer"
          onClick={() => onClick?.(0)}
        >
          {media[0].type === "video" ? (
            <video
              src={media[0].url}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={media[0].url}
              alt="media-0"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
        {media.slice(1, 3).map((m, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-sm cursor-pointer"
            onClick={() => onClick?.(i + 1)}
          >
            {m.type === "video" ? (
              <video
                src={m.url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={m.url}
                alt={`media-${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  const grid =
    count === 1
      ? "grid-cols-1 h-96"
      : count === 2
      ? "grid-cols-2 h-64"
      : "grid-cols-2 grid-rows-2 h-96";

  return (
    <div className={`mb-4 grid ${grid} gap-[2px] overflow-hidden`}>
      {media
        .filter((m) => m.type !== "document")
        .slice(0, 4)
        .map((m, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-sm cursor-pointer"
            onClick={() => onClick?.(i)}
          >
            {m.type === "video" ? (
              <video
                src={m.url}
                controls
                className="w-full h-full object-cover block"
              />
            ) : (
              <img
                src={m.url}
                alt={`media-${i}`}
                className="w-full h-full object-cover block"
              />
            )}
            {count > 4 && i === 3 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-semibold">
                +{count - 4}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

const MenuItem: React.FC<{
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  className?: string;
}> = ({ icon, text, onClick, className = "" }) => (
  <li>
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 ${className}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  </li>
);

export default PostItem;
