import React, { useState, useEffect } from "react";
import { MdAccountCircle } from "react-icons/md";
import { RepostWithUser, Post as PostType } from "../../api/Post";
import PostItem from "./PostItem";

interface PostItemProps {
  post: PostType;
  isLiked: boolean;
  timeSince: (dateString: string) => string;
  handleLike: (postId: number) => Promise<void>;
  hideRepostButton?: boolean;
  disableRepostCountClick?: boolean;
}

interface RepostDialogProps {
  onClose: () => void;
  reposts: RepostWithUser[];
  loading: boolean;
  originalPost: PostType;
  timeSince: (dateString: string) => string;
  postItemProps?: Partial<PostItemProps>;
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
      {/* Dialog Container */}
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4  sticky top-0 bg-white z-10">
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

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <p className="text-center text-gray-500 py-12 text-base">
              Loading reposts...
            </p>
          ) : reposts.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-base">
              No reposts yet.
            </p>
          ) : (
            reposts.map((r) => (
              <div key={r.repostId} className="pb-5">
                {/* Reposter Info */}
                <div className="flex items-start gap-3 mb-3">
                  <MdAccountCircle className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {r.user?.name} reposted
                    </p>
                    {r.repostComment && r.repostComment.trim() !== "" && (
                      <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                        {r.repostComment}
                      </p>
                    )}
                  </div>
                </div>

                {/* Original Post */}
                <div 
                className="border border-gray-200 rounded-xl bg-gray-50">
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
