import React, { useEffect, useState } from "react";
import { getPostLikes } from "../../api/Post";
import { MdAccountCircle } from "react-icons/md";

interface UserLike {
  likeId: number;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

interface ReactionsBoxProps {
  postId: number;
  onClose: () => void;
}

const ReactionsBox: React.FC<ReactionsBoxProps> = ({ postId, onClose }) => {
  const [likes, setLikes] = useState<UserLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLikes = async () => {
      try {
        const res = await getPostLikes(postId);
        setLikes(res);
      } catch (err) {
        console.error(err);
        setError("Failed to load likes");
      } finally {
        setLoading(false);
      }
    };
    loadLikes();
  }, [postId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-[480px] h-[600px] mt-24 rounded-xl shadow-2xl border border-gray-200 flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800 text-sm">Liked by</h3>
          <button
            className="text-gray-500 text-sm hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {loading ? (
            <p className="text-center text-gray-500 py-4 text-sm">
              Loading likes...
            </p>
          ) : error ? (
            <p className="text-center text-red-500 py-4 text-sm">{error}</p>
          ) : likes.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">
              No likes yet.
            </p>
          ) : (
            likes.map((like) => (
              <div
                key={like.likeId}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition"
              >
                <MdAccountCircle className="text-3xl text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {like.user.name}
                  </p>
                  <p className="text-xs text-gray-500">{like.user.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionsBox;