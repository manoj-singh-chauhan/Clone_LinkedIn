import React, { useRef, useState, useMemo } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { MdDeleteOutline, MdPhotoCamera } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProfileIntro,
  getProfileUploadSignature,
  uploadToCloudinary,
  FullProfileResponse,
} from "../../api/profile";
import { useProfileData } from "../../context/ProfileContext";

interface CoverImageEditorModalProps {
  onClose: () => void;
  initialCoverUrl: string;
}

const filterMap: Record<string, string> = {
  none: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(100%)",
  contrast: "contrast(120%)",
  brightness: "brightness(110%)",
};


const DeleteConfirmModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ onConfirm, onCancel, isPending }) => {
  return (
    <div className="absolute inset-0 bg-black/70 z-10 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Delete cover photo
          </h3>
          <button
            title="close"
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <AiOutlineClose size={18} className="text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Are you sure you want to delete your cover cover image? It helps your profile
          stand out to others.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-full font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:bg-gray-400"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CoverImageEditorModal: React.FC<CoverImageEditorModalProps> = ({
  onClose,
  initialCoverUrl,
}) => {
  const queryClient = useQueryClient();
  const { id } = useProfileData();
  const queryKey = ["profile", id];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);

  const [preview, setPreview] = useState(initialCoverUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTab,setActiveTab] = useState<"crop" | "filter" | "adjust">("crop");
  const [zoom, setZoom] = useState(1);
  const [straighten, setStraighten] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState("none");

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const combinedFilter = useMemo(() => {
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return filter === "none" ? adjustments : `${filterMap[filter]} ${adjustments}`;
  }, [filter, brightness, contrast, saturation]);

  
  const updateCoverMutation = useMutation({
    mutationFn: async (file: File | null) => {
      if (!file) {
        await updateProfileIntro({ coverPhotoUrl: null }); 
        return null;
      }
      const sigData = await getProfileUploadSignature();
      const newUrl = await uploadToCloudinary(file, sigData);
      await updateProfileIntro({ coverPhotoUrl: newUrl });
      return newUrl;
    },

    onMutate: async (file: File | null) => {
      await queryClient.cancelQueries({ queryKey });
      const previousProfile =
        queryClient.getQueryData<FullProfileResponse>(queryKey);
      const localPreview = file ? URL.createObjectURL(file) : "";

      if (previousProfile) {
        queryClient.setQueryData<FullProfileResponse>(queryKey, {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            coverPhotoUrl: localPreview,
          },
        });
      }
      return { previousProfile, localPreview };
    },

    onError: (error, file, context) => {
      console.error("update failed:", error);
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKey, context.previousProfile);
      }
    },

    onSettled: (newUrl, error, variables, context) => {
      if (context?.localPreview) URL.revokeObjectURL(context.localPreview);
      queryClient.invalidateQueries({ queryKey });
      if (!error) onClose();
    },
  });

  const isPending = updateCoverMutation.isPending;

  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!preview) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !preview) return;
    setPosition({
      x: e.clientX - dragStartPos.current.x,
      y: e.clientY - dragStartPos.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setZoom(1);
      setStraighten(0);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setFilter("none");
      setPosition({ x: 0, y: 0 });
      setActiveTab("crop");
    }
  };

  
  const handleConfirmDelete = async () => {
    try {
      await updateCoverMutation.mutateAsync(null);
      setPreview("");
      setSelectedFile(null);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete cover photo:", error);
    }
  };

  const handleApply = async () => {
    if (!preview && !selectedFile) {
      updateCoverMutation.mutate(null);
      return;
    }

    const imgElement = previewImgRef.current;
    if (!imgElement) return;

    let fileToProcess: File;
    let imageSrc = preview;

    if (selectedFile) {
      fileToProcess = selectedFile;
    } else {
      try {
        const response = await fetch(initialCoverUrl);
        const blob = await response.blob();
        fileToProcess = new File([blob], "cover.jpg", { type: blob.type });
        imageSrc = URL.createObjectURL(fileToProcess);
      } catch (error) {
        console.log(error);
        return;
      }
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const previewRect = imgElement.getBoundingClientRect();

      const previewAspect = previewRect.width / previewRect.height;
      const naturalAspect = naturalW / naturalH;

      let displayedW, displayedH;
      if (naturalAspect > previewAspect) {
        displayedW = previewRect.width;
        displayedH = displayedW / naturalAspect;
      } else {
        displayedH = previewRect.height;
        displayedW = displayedH * naturalAspect;
      }

      const scaleRatio = naturalW / displayedW;
      const scaledPosX = position.x * scaleRatio;
      const scaledPosY = position.y * scaleRatio;

      canvas.width = naturalW;
      canvas.height = naturalH;

      ctx.filter = combinedFilter;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.translate(scaledPosX, scaledPosY);
      ctx.rotate((straighten * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const editedFile = new File([blob], fileToProcess.name, {
              type: fileToProcess.type,
              lastModified: Date.now(),
            });
            updateCoverMutation.mutate(editedFile);
          }
        },
        fileToProcess.type,
        0.9
      );

      if (!selectedFile && imageSrc !== initialCoverUrl) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center h-screen animate-fadeIn">
      <div className="bg-white rounded-lg w-full max-w-[780px] flex flex-col shadow-lg overflow-auto max-h-[90vh] relative">
        {showDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            isPending={isPending}
          />
        )}

        
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
          <h2 className="text-[18px] font-semibold text-gray-900">Cover image</h2>
          <button
            title="close"
            onClick={onClose}
            disabled={isPending}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        
        <div className="flex-1 flex justify-center items-center bg-black min-h-[300px]">
          {preview ? (
            <div
              className="w-full max-w-[700px] overflow-hidden"
              style={{
                aspectRatio: "4 / 1",
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={preview}
                alt="Cover Preview"
                ref={previewImgRef}
                style={{
                  filter: combinedFilter,
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${straighten}deg)`,
                  pointerEvents: "none",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400 space-y-2">
              <MdPhotoCamera size={40} />
              <p>No cover image</p>
            </div>
          )}
        </div>

        
        <div className="flex justify-between items-center border-t px-6 py-3">
          <div className="flex items-center gap-3">
            <input
              placeholder="file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50"
            >
              Change photo
            </button>

            {preview && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition flex items-center gap-1 disabled:opacity-50"
              >
                <MdDeleteOutline size={18} />
                Delete photo
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isPending}
              className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isPending ? "Saving..." : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverImageEditorModal;