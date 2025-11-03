import React, { useState, useEffect } from "react";
// import ReactDOM from "react-dom";
import { MdAccountCircle } from "react-icons/md";
// import { HiOutlineDotsHorizontal } from "react-icons/hi";
import {
  RepostWithUser,
  Post as PostType,
  PostCommentUser,
} from "../../api/Post";
import PostItem, { RepostingPost } from "./PostItem";

interface RepostDialogProps {
  onClose: () => void;
  reposts: RepostWithUser[];
  loading: boolean;
  originalPost: PostType;
  timeSince: (dateString: string) => string;
  postItemProps?: Partial<PostItemProps>;
}

interface PostItemProps {
  post: PostType;
  isLiked: boolean;
  isReposted?: boolean;
  isCommentSectionOpen?: boolean;
  commentText?: string;
  comments?: PostCommentUser[];
  showEmojiPicker?: boolean;
  activeLikesBoxId?: number | null;
  timeSince: (dateString: string) => string;
  handleLike: (postId: number) => Promise<void>;
  handleRepost?: (postId: number, comment?: string) => Promise<void>;
  handleShowReposts?: (post: PostType) => void;
  setActiveLikesBox?: React.Dispatch<React.SetStateAction<number | null>>;
  setShowEmojiPickerFor?: React.Dispatch<React.SetStateAction<number | null>>;
  setReposting?: React.Dispatch<React.SetStateAction<RepostingPost | null>>;
  setIsModalOpen?: React.Dispatch<React.SetStateAction<PostType | null>>;
  hideRepostButton?: boolean;
  disableRepostCountClick?: boolean;
}

const RepostDialog: React.FC<RepostDialogProps> = ({
  onClose,
  reposts,
  loading,
  originalPost,
  timeSince,
  postItemProps = {},
}) => {
  const [localPost, setLocalPost] = useState(originalPost);

  useEffect(() => {
    setLocalPost(originalPost);
  }, [originalPost]);

  const handleDialogLike = async (postId: number) => {
    setLocalPost((prev) => ({
      ...prev,
      likeCount: prev.likedByCurrentUser
        ? prev.likeCount - 1
        : prev.likeCount + 1,
      likedByCurrentUser: !prev.likedByCurrentUser,
    }));

    try {
      await postItemProps?.handleLike?.(postId);
    } catch (err) {
      console.error("Error liking post inside dialog:", err);
      // Revert state on error
      setLocalPost((prev) => ({
        ...prev,
        likeCount: prev.likedByCurrentUser
          ? prev.likeCount - 1
          : prev.likeCount + 1,
        likedByCurrentUser: !prev.likedByCurrentUser,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000]">
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn
                   absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 sticky top-0 bg-white z-10 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {reposts.length} Repost{reposts.length !== 1 ? "s" : ""}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div
          className="overflow-y-auto 
                     [&::-webkit-scrollbar]:w-2 
                     [&::-webkit-scrollbar-track]:bg-gray-100 
                     [&::-webkit-scrollbar-thumb]:bg-gray-400 
                     [&::-webkit-scrollbar-thumb]:rounded-full
                     [&::-webkit-scrollbar-thumb:hover]:bg-gray-500"
        >
          {loading ? (
            <p className="text-center text-gray-500 py-12 text-base">
              Loading reposts...
            </p>
          ) : reposts.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-base">
              No reposts yet.
            </p>
          ) : (
            reposts.map((r, i) => (
              <div
                key={r.repostId}
                className={`px-5 py-4 ${
                  i !== 0 ? "border-t border-gray-200" : ""
                } hover:bg-gray-50 transition`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MdAccountCircle className="w-10 h-10 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {r.user?.name}{" "}
                        <span className="text-gray-500 font-normal">
                          reposted this
                        </span>
                      </p>
                      {r.repostComment && r.repostComment.trim() !== "" && (
                        <p className="mt-1 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                          {r.repostComment}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dots button */}
                  {/* <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full">
                    <HiOutlineDotsHorizontal className="w-5 h-5" />
                  </button> */}
                </div>

                <div className="mt-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <PostItem
                    {...postItemProps}
                    post={localPost}
                    isLiked={localPost.likedByCurrentUser ?? false}
                    timeSince={timeSince}
                    handleLike={handleDialogLike}
                    hideRepostButton={true}
                    disableRepostCountClick={true}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RepostDialog;