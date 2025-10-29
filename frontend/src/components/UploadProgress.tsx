import { useUpload } from "../context/UploadContext";

const UploadProgress = () => {
  const { uploading, progress, cancelUpload } = useUpload();

  if (!uploading) return null; 
  return (
    <div className="fixed top-24 right-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-200 w-72 z-50 transition-all duration-500">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
          Uploading Post...
        </h4>
        <span className="text-xs text-gray-500">{progress}%</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${
            progress === 100 ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p
        className={`text-xs mt-1 transition-all duration-300 ${
          progress === 100 ? "text-green-600 font-medium" : "text-gray-600"
        }`}
      >
        {progress < 100 ? "Uploading..." : "Upload Complete"}
      </p>

      {progress < 100 && cancelUpload && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => cancelUpload()}
            className="text-xs text-red-500 border border-red-400 rounded-full px-3 py-1 hover:bg-red-50 transition-all"
          >
            Cancel Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;
