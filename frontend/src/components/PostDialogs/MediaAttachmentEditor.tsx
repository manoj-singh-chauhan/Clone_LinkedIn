import { useState, useEffect, useCallback, memo } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { MdOutlineModeEdit } from "react-icons/md";
import EditDialog from "./EditDialog";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { TbUserFilled } from "react-icons/tb";
import { FaRegCopy } from "react-icons/fa6";

interface MediaAttachmentEditorProps {
  files: File[];
  onClose: () => void;
  onUpdate: (files: File[]) => void;
  onAddMore: () => void;
  onNext?: () => void;
}

interface MediaFileWithPreview {
  file: File;
  previewUrl: string;
}

interface ThumbnailProps {
  media: MediaFileWithPreview;
  index: number;
  isSelected: boolean;
  onSelect: (idx: number) => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, idx: number) => void;
  onDrop: () => void;
  isDragging: boolean;
}

const Thumbnail = memo(
  ({
    media,
    index,
    isSelected,
    onSelect,
    onDragStart,
    onDragOver,
    onDrop,
    isDragging,
  }: ThumbnailProps) => {
    const isImage = media.file.type.startsWith("image");

    return (
      <div
        className={`relative cursor-pointer rounded-lg overflow-hidden flex items-center justify-center transition-all duration-200 border border-gray-200 hover:border-blue-600 h-28 ${
          isSelected
            ? "ring-2 ring-offset-1 ring-blue-600 border-transparent"
            : ""
        } ${isDragging ? "opacity-50 scale-95" : ""}`}
        onClick={() => onSelect(index)}
        title={media.file.name}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={onDrop}
      >
        {isImage ? (
          <img
            src={media.previewUrl}
            alt={media.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={media.previewUrl}
            preload="metadata"
            muted
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute top-1 left-1 text-xs font-semibold text-white bg-black/60 px-1 rounded">
          {index + 1}
        </div>
      </div>
    );
  }
);

const MediaAttachmentEditor = ({
  files,
  onClose,
  onUpdate,
  onAddMore,
  onNext,
}: MediaAttachmentEditorProps) => {
  const [mediaList, setMediaList] = useState<MediaFileWithPreview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<File | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const newMedia = files.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setMediaList(newMedia);
    if (newMedia.length > 0)
      setCurrentIndex((prev) => Math.min(prev, newMedia.length - 1));
    return () => newMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
  }, [files]);

  const currentMedia = mediaList[currentIndex];
  const isImage = currentMedia?.file.type.startsWith("image");

  const handleRemove = useCallback(() => {
    if (!currentMedia) return;
    URL.revokeObjectURL(currentMedia.previewUrl);
    setMediaList((prev) => {
      const newMedia = prev.filter((_, i) => i !== currentIndex);
      if (currentIndex >= newMedia.length && newMedia.length > 0)
        setCurrentIndex(newMedia.length - 1);
      else if (newMedia.length === 0) setCurrentIndex(0);
      onUpdate(newMedia.map((m) => m.file));
      return newMedia;
    });
  }, [currentMedia, currentIndex, onUpdate]);

  const handleSaveEdit = useCallback(
    (updated: { file: File }) => {
      setMediaList((prev) => {
        const updatedList = [...prev];
        URL.revokeObjectURL(updatedList[currentIndex].previewUrl);
        updatedList[currentIndex] = {
          file: updated.file,
          previewUrl: URL.createObjectURL(updated.file),
        };
        onUpdate(updatedList.map((m) => m.file));
        return updatedList;
      });
      setEditDialogOpen(false);
    },
    [currentIndex, onUpdate]
  );

  const handleSelectThumbnail = useCallback(
    (idx: number) => setCurrentIndex(idx),
    []
  );

  const handleCopyCurrent = useCallback(() => {
    if (!currentMedia) return;
    const copiedFile = new File([currentMedia.file], currentMedia.file.name, {
      type: currentMedia.file.type,
    });
    const newPreviewUrl = URL.createObjectURL(copiedFile);

    setMediaList((prev) => {
      const updatedList = [
        ...prev.slice(0, currentIndex + 1),
        { file: copiedFile, previewUrl: newPreviewUrl },
        ...prev.slice(currentIndex + 1),
      ];
      onUpdate(updatedList.map((m) => m.file));
      return updatedList;
    });

    setCurrentIndex((prev) => prev + 1);
  }, [currentMedia, currentIndex, onUpdate]);

  const handleDragStart = useCallback(
    (idx: number) => setDraggedIndex(idx),
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, idx: number) => {
      e.preventDefault();
      setMediaList((prev) => {
        if (draggedIndex === null || draggedIndex === idx) return prev;
        const updated = [...prev];
        const [draggedItem] = updated.splice(draggedIndex, 1);
        updated.splice(idx, 0, draggedItem);
        setDraggedIndex(idx);
        return updated;
      });
    },
    [draggedIndex]
  );

  const handleDrop = useCallback(() => {
    setDraggedIndex(null);
    onUpdate(mediaList.map((m) => m.file));
  }, [mediaList, onUpdate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="bg-white w-[98%] max-w-5xl h-[87vh] rounded shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Edit Media</h2>
          <div className="flex items-center gap-4">
            {mediaList.length > 0 && (
              <span className="text-sm font-medium text-gray-500">
                {currentIndex + 1} of {mediaList.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Close Editor"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Media */}
          <div
            className="relative flex flex-col items-center justify-center border-gray-100"
            style={{
              width: "730px",
              height: "500px",
              flexShrink: 0,
              alignSelf: "center",
              borderRadius: "10px",
            }}
          >
            {mediaList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 rounded shadow-sm">
                <button
                  onClick={onAddMore}
                  className="flex items-center gap-2 px-6 py-2 text-white bg-blue-700 rounded-full hover:bg-blue-800 transition text-base font-semibold"
                >
                  <FiPlus size={18} /> Upload Media
                </button>
              </div>
            ) : isImage ? (
              <img
                src={currentMedia.previewUrl}
                alt={currentMedia.file.name}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <video
                src={currentMedia.previewUrl}
                controls
                preload="metadata"
                className="w-full h-full object-contain rounded-md"
              />
            )}
          </div>

          {/* Thumbnails */}
          {mediaList.length > 0 && (
            <div className="w-72 flex flex-col p-4 pb-10 bg-white border-l border-gray-100 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {mediaList.map((m, idx) => (
                  <Thumbnail
                    key={m.file.name + m.previewUrl}
                    media={m}
                    index={idx}
                    isSelected={currentIndex === idx}
                    onSelect={handleSelectThumbnail}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragging={draggedIndex === idx}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        {mediaList.length > 0 && (
          <div className="flex justify-between items-center py-4 px-8">
            <div className="flex justify-center items-center gap-4 flex-1">
              <button
                onClick={() => {
                  if (currentMedia) {
                    setMediaToEdit(currentMedia.file);
                    setEditDialogOpen(true);
                  }
                }}
                className="flex items-center justify-center w-12 h-12 text-black rounded-full bg-white shadow-md hover:bg-gray-100 transition"
                title="Edit File"
              >
                <MdOutlineModeEdit size={26} />
              </button>
              <button
                className="flex items-center justify-center w-12 h-12 text-black rounded-full bg-white shadow-md hover:bg-gray-100 transition"
                title="Tag"
              >
                <TbUserFilled size={26} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleCopyCurrent}
                className="flex items-center justify-center w-12 h-12 text-black bg-white rounded-full shadow-md hover:bg-gray-100 transition"
                title="Copy Media"
              >
                <FaRegCopy size={24} />
              </button>
              <button
                onClick={handleRemove}
                className="flex items-center justify-center w-12 h-12 text-black bg-white rounded-full shadow-md hover:bg-gray-100 transition"
                title="Delete File"
              >
                <RiDeleteBin6Fill size={24} />
              </button>
              <button
                onClick={onAddMore}
                className="flex items-center justify-center w-12 h-12 text-black bg-white border rounded-full shadow-md hover:bg-blue-50 transition"
                title="Add More Files"
              >
                <FiPlus size={22} />
              </button>
            </div>
          </div>
        )}

        
        <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-400 bg-white">
          <button
            onClick={onClose}
            className="flex items-center px-5 py-1.5 text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition font-semibold"
          >
            Back
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="flex items-center px-5 py-1.5 text-white bg-blue-700 rounded-full hover:bg-blue-800 transition font-semibold"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {editDialogOpen && mediaToEdit && (
        <EditDialog
          file={{ file: mediaToEdit }}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default memo(MediaAttachmentEditor);