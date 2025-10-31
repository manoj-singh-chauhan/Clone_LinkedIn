import { useState, useCallback, useRef } from "react";
import { MdPhotoSizeSelectActual, MdAccountCircle } from "react-icons/md";
import { RiVideoFill } from "react-icons/ri";
import { PiArticleNyTimesThin } from "react-icons/pi";
import PostDialog from "./PostDialogs/PostDialog";
// import ArticleDialog from "./Dialog/ArticleDialog";
// import { useAuth } from "../context/AuthContext";

const Post = () => {
  const [postOpen, setPostOpen] = useState(false);

  // const [articleOpen, setArticleOpen] = useState(false);
  const [initialPostFile, setInitialPostFile] = useState<File | null>(null);
  const photoVideoInputRef = useRef<HTMLInputElement>(null);
  // const documentInputRef = useRef<HTMLInputElement>(null);

  const closePostDialog = useCallback(() => {
    setPostOpen(false);
    setInitialPostFile(null);
  }, []);

  const openPostDialog = useCallback((file: File | null = null) => {
    setInitialPostFile(file);
    setPostOpen(true);
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      if (file) {
        openPostDialog(file);
      }

      event.target.value = "";
    },
    [openPostDialog]
  );

  

  // const handleArticleClick = () => {
  //   documentInputRef.current?.click();
  //   // setArticleOpen(true);
  // };

  return (
    <>
      <div className="bg-white p-3 rounded-md shadow-md mb-1 max-w-2xl mx-auto">
      {/* <div className="bg-white p-3 rounded-md shadow-md mb-4 w-80 h-80 mx-auto"> */}

        <div className="flex items-center gap-3 mb-3">
          <MdAccountCircle className="w-10 h-10 text-gray-500" />

          <input
            type="text"
            placeholder="Start a post"
            readOnly
            onClick={() => openPostDialog()}
            className="flex-1 border rounded-full px-4 py-2 cursor-pointer text-gray-600"
          />
        </div>

        <div className="flex justify-around text-gray-500 text-sm mt-2">
          <input
            ref={photoVideoInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            placeholder="photo"
            multiple={true} 
            className="hidden"
          />

          <button
            className="flex items-center gap-2 hover:text-blue-600"
            onClick={() => photoVideoInputRef.current?.click()}
          >
            <RiVideoFill size={20} className="text-green-500" /> Video
          </button>

          <button
            className="flex items-center gap-2 hover:text-blue-600"
            onClick={() => photoVideoInputRef.current?.click()}
          >
            <MdPhotoSizeSelectActual size={20} className="text-blue-500" />{" "}
            Photo
          </button>

          {/* <input
            ref={documentInputRef}
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
            placeholder="document"
          /> */}

          <button className="flex items-center gap-2 hover:text-blue-600">
            <PiArticleNyTimesThin size={20} className="text-red-400" /> Article
          </button>
        </div>
      </div>

      {postOpen && (
        <PostDialog
          close={closePostDialog}
          initialFiles={initialPostFile ? [initialPostFile] : []}
        />
      )}

      {/* Article Dialog (Kept separate only if it's for non-file URL sharing) */}
      {/* {articleOpen && <ArticleDialog close={() => setArticleOpen(false)} />} */}
    </>
  );
};

export default Post;