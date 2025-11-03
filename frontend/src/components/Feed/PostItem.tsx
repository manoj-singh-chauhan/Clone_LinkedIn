import React, { memo, useCallback, useState } from "react";
import { Post as PostType } from "../../api/Post";
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
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import ReactionsBox from "./ReactionsBox";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

export interface RepostingPost {
  post: PostType;
  openDropdown: boolean;
}

export interface MediaItem {
  type: "image" | "video" | "document";
  url: string;
}

export interface PostCommentUser {
  commentId?: number;
  id?: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
}

interface PostItemProps {
  post: PostType;
  isLiked: boolean;
  isReposted: boolean;
  isCommentSectionOpen: boolean;
  commentText: string;
  comments: PostCommentUser[];
  showEmojiPicker: boolean;
  isRepostDropdownOpen: boolean;
  activeLikesBoxId: number | null;
  timeSince: (dateString: string) => string;
  handleLike: (postId: number) => void;
  handleShowComments: (postId: number) => void;
  handleCommentChange: (postId: number, text: string) => void;
  handleCommentSubmit: (postId: number) => Promise<void>;
  handleRepost: (postId: number, comment?: string) => Promise<void>;
  setLightbox: React.Dispatch<
    React.SetStateAction<{
      media: MediaItem[];
      index: number;
      post: PostType;
    } | null>
  >;
  setActiveLikesBox: React.Dispatch<React.SetStateAction<number | null>>;
  setShowEmojiPickerFor: React.Dispatch<React.SetStateAction<number | null>>;
  setReposting: React.Dispatch<React.SetStateAction<RepostingPost | null>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<PostType | null>>;
  handleShowReposts: (post: PostType) => Promise<void>;
  isLastPost: boolean;
  hideRepostButton?: boolean;
  lastPostRef?: (node: HTMLDivElement | null) => void;
  disableRepostCountClick?: boolean;
  handleEdit: (post: PostType) => void;
  handleDeletePost: (postId: number) => void;
  handleCopyLink: (postId: number) => void;
  handleFollowAuthor: (authorId: number) => void;
  handleHidePost: (postId: number) => void;
  handleBlockAuthor: (authorId: number) => void;
  handleReportPost: (postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = memo(
  ({
    post,
    isLiked,
    isReposted,
    isCommentSectionOpen,
    commentText,
    comments,
    showEmojiPicker,
    isRepostDropdownOpen,
    activeLikesBoxId,
    timeSince,
    handleLike,
    handleShowComments,
    handleCommentChange,
    handleCommentSubmit,
    handleRepost,
    setLightbox,
    setActiveLikesBox,
    setShowEmojiPickerFor,
    setReposting,
    setIsModalOpen,
    handleShowReposts,
    isLastPost,
    lastPostRef,
    hideRepostButton,
    disableRepostCountClick,
    handleEdit,
    handleDeletePost,
    handleCopyLink,
    handleFollowAuthor,
    handleHidePost,
    handleBlockAuthor,
    handleReportPost,
  }) => {
    const { user } = useAuth();
    // const isAuthor = user?.id === post.author.id;
    const isAuthor = Number(user?.id) === post.author.id;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const authorName = post.author?.profile?.name || "Unknown";
    const postDate = post.createdAt ? timeSince(post.createdAt) : "";
    const media = post.media || [];

    const handleEmojiClick = useCallback(
      (emojiData: EmojiClickData) => {
        handleCommentChange(post.id, commentText + emojiData.emoji);
      },
      [commentText, handleCommentChange, post.id]
    );

    const [isExpanded, setIsExpanded] = useState(false);

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
      <div
        ref={isLastPost ? lastPostRef : null}
        className="bg-white border border-gray-200 rounded-sm shadow-sm"
      >
        {/* Post Header */}
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

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute top-12 right-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-56" // Made it wider for icons
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <ul className="py-1">
                  {/* --- OPTION FOR EVERYONE --- */}
                  <MenuItem
                    icon={<MdLink size={18} />}
                    text="Copy link to post"
                    onClick={() => {
                      handleCopyLink(post.id);
                      setIsMenuOpen(false);
                    }}
                  />

                  {isAuthor && (
                    <>
                      {/* --- AUTHOR-ONLY OPTIONS --- */}
                      <MenuItem
                        icon={<MdEdit size={18} />}
                        text="Edit post"
                        onClick={() => {
                          handleEdit(post);
                          setIsMenuOpen(false);
                        }}
                      />
                      <MenuItem
                        icon={<MdDelete size={18} />}
                        text="Delete post"
                        onClick={() => {
                          handleDeletePost(post.id);
                          setIsMenuOpen(false);
                        }}
                        className="text-red-600 hover:bg-red-50"
                      />
                    </>
                  )}

                  {!isAuthor && (
                    <>
                      {/* --- OTHER USER POST OPTIONS --- */}
                      <MenuItem
                        icon={<MdPersonAdd size={18} />}
                        text={`Follow ${authorName}`}
                        onClick={() => {
                          handleFollowAuthor(post.author.id);
                          setIsMenuOpen(false);
                        }}
                      />
                      <MenuItem
                        icon={<MdVisibilityOff size={18} />}
                        text="I don't want to see this"
                        onClick={() => {
                          handleHidePost(post.id);
                          setIsMenuOpen(false);
                        }}
                      />
                      <MenuItem
                        icon={<MdBlock size={18} />}
                        text={`Block ${authorName}`}
                        onClick={() => {
                          handleBlockAuthor(post.author.id);
                          setIsMenuOpen(false);
                        }}
                      />
                      <MenuItem
                        icon={<MdReport size={18} />}
                        text="Report post"
                        onClick={() => {
                          handleReportPost(post.id);
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
          media={media}
          onClick={(index) => setLightbox({ media, index, post })}
        />

        
        <div className="flex justify-between items-center text-sm text-gray-600 border-t border-gray-100 pt-3 mt-3 px-2 relative">
          <span
            className="cursor-pointer hover:text-blue-600 relative"
            onClick={() =>
              setActiveLikesBox(activeLikesBoxId === post.id ? null : post.id)
            }
          >
            <span className="font-semibold">{post.likeCount}</span> Likes
            {activeLikesBoxId === post.id && (
              <ReactionsBox
                postId={post.id}
                onClose={() => setActiveLikesBox(null)}
              />
            )}
          </span>
          <div className="flex gap-4">
            <span
              className="cursor-pointer hover:text-blue-600"
              onClick={() => handleShowComments(post.id)}
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
                disableRepostCountClick
                  ? undefined
                  : () => handleShowReposts(post)
              }
            >
              <span className="font-semibold">{post.repostCount}</span> Reposts
            </span>
          </div>
        </div>

        
        <div className="flex justify-around text-gray-600 mt-2 border-t border-gray-100 pt-2">
          <button
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 ${
              isLiked ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <AiOutlineLike size={20} />
            <span className="hidden sm:inline">Like</span>
          </button>
          <button
            onClick={() => handleShowComments(post.id)}
            className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100"
          >
            <AiOutlineComment size={20} />
            <span className="hidden sm:inline">Comment</span>
          </button>
          {!hideRepostButton && (
            <div className="relative flex flex-col items-center gap-1">
              <button
                onClick={() =>
                  setReposting(
                    isRepostDropdownOpen ? null : { post, openDropdown: true }
                  )
                }
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
                  onMouseLeave={() => setReposting(null)}
                >
                  <button
                    onClick={() => {
                      setIsModalOpen(post);
                      setReposting(null);
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
                    onClick={() => handleRepost(post.id)}
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

        {isCommentSectionOpen && (
          <div className="mt-4 space-y-3 px-2">
            <div className="flex gap-2 items-start">
              <MdAccountCircle className="w-10 h-10 text-gray-400 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col relative">
                <div className="flex items-center border border-gray-300 rounded-full px-3 py-1">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) =>
                      handleCommentChange(post.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCommentSubmit(post.id);
                    }}
                    className="flex-1 outline-none py-2 px-1 rounded-full"
                  />
                  <BsEmojiSmile
                    size={22}
                    className="text-gray-500 cursor-pointer hover:text-yellow-500 ml-2"
                    onClick={() =>
                      setShowEmojiPickerFor(showEmojiPicker ? null : post.id)
                    }
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
                    onClick={() => handleCommentSubmit(post.id)}
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 mt-2">
              {(comments || []).map((comment) => (
                <div
                  key={comment.commentId ?? comment.id ?? Math.random()}
                  className="flex gap-2"
                >
                  <MdAccountCircle className="w-8 h-8 text-gray-400 rounded-full flex-shrink-0" />
                  <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {comment.user?.name}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {timeSince(comment.createdAt)} ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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