import React, { useState, useEffect } from "react";
import { MediaItem, PostCommentUser } from "./PostItem";
import { getPostComments, Post as PostType } from "../../api/Post";
import { AiOutlineClose } from "react-icons/ai";
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";

interface MediaLightboxProps {
  post: PostType;
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({
  post,
  media,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [comments, setComments] = useState<PostCommentUser[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await getPostComments(post.id);
        setComments(fetchedComments);
      } catch (err) {
        console.error("Failed to fetch comments for lightbox", err);
      }
    };
    fetchComments();
  }, [post.id]);

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 flex justify-center items-center overflow-auto">
      <button
        title="close lightbox"
        className="absolute top-4 right-4 text-white text-3xl"
        onClick={onClose}
      >
        <AiOutlineClose />
      </button>

      <div className="flex flex-col md:flex-row gap-4 max-w-5xl w-full h-[81vh] mx-2 md:mx-0 bg-white rounded-lg overflow-hidden">
        {/* Media */}
        <div className="relative w-full md:w-3/4 flex justify-center items-center bg-black">
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
                < FaArrowRight />
              </button>
            </>
          )}
        </div>

        {/* Comments */}
         <div className="w-full md:w-1/3 p-4 flex flex-col overflow-auto">
          <div className="mb-4">
            <p className="font-semibold text-gray-800">
              {post.author?.profile?.name || "Unknown"}
            </p>
            <p className="text-gray-700 mt-1">{post.content}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="font-semibold text-gray-600 mb-2">Comments</p>
            {comments.length === 0 && (
              <p className="text-gray-500 text-sm">No comments</p>
            )}
            {comments.map((comment) => (
              <div
                key={comment.commentId ?? comment.id ?? Math.random()}
                className="flex gap-2 mb-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-800">
                    {comment.user?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLightbox;