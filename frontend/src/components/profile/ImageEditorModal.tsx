// import React, { useState, useMemo } from "react";
// import { AiOutlineClose } from "react-icons/ai";
// import {
//   MdAccountCircle,
//   MdRotateLeft,
//   MdRotateRight,
//   //   MdPeople,
// } from "react-icons/md";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   updateProfileIntro,
//   getProfileUploadSignature,
//   uploadToCloudinary,
// } from "../../api/profile";
// import { useAuth } from "../../context/AuthContext";

// interface ImageEditorModalProps {
//   originalImageFile: File;
//   onClose: () => void;
//   onSaveAndClose: () => void;
// }

// const filterMap: Record<string, string> = {
//   none: "none",
//   grayscale: "grayscale(100%)",
//   sepia: "sepia(100%)",
//   contrast: "contrast(120%)",
//   brightness: "brightness(110%)",
// };

// const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
//   originalImageFile,
//   onClose,
//   onSaveAndClose,
// }) => {
//   const { user } = useAuth();
//   const queryClient = useQueryClient();

//   const [previewImage,
//     //  setPreviewImage
//     ] = useState<string>(
//     URL.createObjectURL(originalImageFile)
//   );

//   const [rotation, setRotation] = useState(0);
//   const [zoom, setZoom] = useState(1);
//   const [straighten, setStraighten] = useState(0);

//   const [activeTab, setActiveTab] = useState<"crop" | "filter" | "adjust">(
//     "crop"
//   );
//   const [brightness, setBrightness] = useState(100);
//   const [contrast, setContrast] = useState(100);
//   const [saturation, setSaturation] = useState(100);
//   const [filter, setFilter] = useState("none");

//   const updateProfilePictureMutation = useMutation({
//     mutationFn: async (editedImageFile: File) => {
//       const sigData = await getProfileUploadSignature();
//       const newUrl = await uploadToCloudinary(editedImageFile, sigData);
//       await updateProfileIntro({ profilePictureUrl: newUrl });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
//       onSaveAndClose();
//     },
//     onError: (err: Error) => {
//       console.error("Failed to save edited profile picture:", err);
//       alert("Failed to save picture: " + err.message);
//     },
//   });

//   const combinedFilter = useMemo(() => {
//     const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
//     return filter === "none"
//       ? adjustments
//       : `${filterMap[filter]} ${adjustments}`;
//   }, [filter, brightness, contrast, saturation]);

//   const handleSavePhoto = async () => {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     if (!ctx) {
//       alert("Canvas not supported, cannot process image.");
//       return;
//     }
//     const img = new Image();
//     img.src = previewImage;
//     img.onload = () => {
//       canvas.width = img.width;
//       canvas.height = img.height;

//       ctx.translate(canvas.width / 2, canvas.height / 2);
//       const totalRotationInDegrees = rotation + straighten;
//       const rad = (totalRotationInDegrees * Math.PI) / 180;
//       ctx.rotate(rad);
//       ctx.scale(zoom, zoom);

//       ctx.filter = combinedFilter;

//       ctx.drawImage(
//         img,
//         -img.width / 2,
//         -img.height / 2,
//         img.width,
//         img.height
//       );

//       canvas.toBlob(
//         async (blob) => {
//           if (blob) {
//             const editedFile = new File([blob], originalImageFile.name, {
//               type: originalImageFile.type,
//               lastModified: Date.now(),
//             });
//             updateProfilePictureMutation.mutate(editedFile);
//           } else {
//             alert("Failed to create edited image blob.");
//           }
//         },
//         originalImageFile.type,
//         1
//       );
//     };

//     img.onerror = (err) => {
//       alert("Failed to load image for processing.");
//       console.error("Image load error:", err);
//     };
//   };

//   return (
//     // <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
//     //   <div className="bg-white rounded-lg w-full max-w-4xl h-[600px] flex flex-col animate-fadeIn">
//      <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-12 p-4">
//       <div className="bg-white rounded-lg w-full max-w-4xl h-[600px] flex flex-col animate-fadeIn shadow-xl">
//         <div className="flex justify-between items-center p-4 border-b">
//           <h2 className="text-xl font-semibold text-gray-900">Edit photo</h2>
//           <button
//             title="close"
//             onClick={onClose}
//             className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
//             disabled={updateProfilePictureMutation.isPending}
//           >
//             <AiOutlineClose size={20} />
//           </button>
//         </div>

//         <div className="flex flex-1 overflow-hidden">
//           <div className="flex-1 flex justify-center items-center bg-gray-100 p-4 relative">
//             <div className="w-64 h-64 rounded-full overflow-hidden border border-gray-300 flex justify-center items-center bg-gray-200">
//               {previewImage ? (
//                 <img
//                   src={previewImage}
//                   alt="Profile Preview"
//                   style={{
//                     transform: `rotate(${
//                       rotation + straighten
//                     }deg) scale(${zoom})`,
//                     filter: combinedFilter,
//                   }}
//                   className="object-cover w-full h-full"
//                 />
//               ) : (
//                 <MdAccountCircle className="w-full h-full text-gray-400" />
//               )}
//             </div>
//           </div>

//           <div className="w-80 border-l p-4 flex flex-col">
//             <div className="flex border-b pb-2 mb-4">
//               <button
//                 onClick={() => setActiveTab("crop")}
//                 className={`flex-1 text-center font-semibold pb-2 ${
//                   activeTab === "crop"
//                     ? "text-blue-600 border-b-2 border-blue-600"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 Crop
//               </button>
//               <button
//                 onClick={() => setActiveTab("filter")}
//                 className={`flex-1 text-center font-semibold pb-2 ${
//                   activeTab === "filter"
//                     ? "text-blue-600 border-b-2 border-blue-600"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 Filter
//               </button>
//               <button
//                 onClick={() => setActiveTab("adjust")}
//                 className={`flex-1 text-center font-semibold pb-2 ${
//                   activeTab === "adjust"
//                     ? "text-blue-600 border-b-2 border-blue-600"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 Adjust
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto space-y-6">
//               {activeTab === "crop" && (
//                 <>
//                   <div className="space-y-2">
//                     <p className="font-semibold text-gray-700">Rotation</p>
//                     <div className="flex justify-center gap-4">
//                       <button
//                         title="setrotation"
//                         onClick={() => setRotation((prev) => prev - 90)}
//                         className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
//                       >
//                         <MdRotateLeft size={24} />
//                       </button>
//                       <button
//                         title="rotation"
//                         onClick={() => setRotation((prev) => prev + 90)}
//                         className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
//                       >
//                         <MdRotateRight size={24} />
//                       </button>
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="zoom"
//                       className="font-semibold text-gray-700"
//                     >
//                       Zoom
//                     </label>
//                     <input
//                       type="range"
//                       id="zoom"
//                       min="0.5"
//                       max="2"
//                       step="0.1"
//                       value={zoom}
//                       onChange={(e) => setZoom(parseFloat(e.target.value))}
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="straighten"
//                       className="font-semibold text-gray-700"
//                     >
//                       Straighten
//                     </label>
//                     <input
//                       type="range"
//                       id="straighten"
//                       min="-45"
//                       max="45"
//                       step="1"
//                       value={straighten}
//                       onChange={(e) =>
//                         setStraighten(parseFloat(e.target.value))
//                       }
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                     />
//                   </div>
//                 </>
//               )}

//               {/* Filter Panel */}
//               {activeTab === "filter" && (
//                 <div className="flex flex-wrap gap-3">
//                   {Object.keys(filterMap).map((key) => (
//                     <button
//                       key={key}
//                       onClick={() => setFilter(key)}
//                       className={`px-4 py-1.5 rounded-full border text-sm capitalize transition ${
//                         filter === key
//                           ? "bg-blue-600 text-white border-blue-600"
//                           : "border-gray-300 text-gray-700 hover:bg-gray-100"
//                       }`}
//                     >
//                       {key}
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {/* Adjust Panel */}
//               {activeTab === "adjust" && (
//                 <>
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="brightness"
//                       className="font-semibold text-gray-700"
//                     >
//                       Brightness
//                     </label>
//                     <input
//                       type="range"
//                       id="brightness"
//                       min="50"
//                       max="150"
//                       step="1"
//                       value={brightness}
//                       onChange={(e) => setBrightness(Number(e.target.value))}
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="contrast"
//                       className="font-semibold text-gray-700"
//                     >
//                       Contrast
//                     </label>
//                     <input
//                       type="range"
//                       id="contrast"
//                       min="50"
//                       max="150"
//                       step="1"
//                       value={contrast}
//                       onChange={(e) => setContrast(Number(e.target.value))}
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="saturation"
//                       className="font-semibold text-gray-700"
//                     >
//                       Saturation
//                     </label>
//                     <input
//                       type="range"
//                       id="saturation"
//                       min="0"
//                       max="200"
//                       step="1"
//                       value={saturation}
//                       onChange={(e) => setSaturation(Number(e.target.value))}
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                     />
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end items-center p-4 border-t">
//           <button
//             onClick={handleSavePhoto}
//             disabled={updateProfilePictureMutation.isPending}
//             className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
//           >
//             {updateProfilePictureMutation.isPending ? "Saving..." : "Save photo"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ImageEditorModal;


import React, { useState, useMemo } from "react";
import { AiOutlineClose } from "react-icons/ai";
import {
  MdAccountCircle,
  MdRotateLeft,
  MdRotateRight,
} from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProfileIntro,
  getProfileUploadSignature,
  uploadToCloudinary,
  FullProfileResponse,
} from "../../api/profile";
import { useProfileData } from "../../context/ProfileContext";

interface ImageEditorModalProps {
  originalImageFile: File;
  onClose: () => void;
  onSaveAndClose: () => void;
}

const filterMap: Record<string, string> = {
  none: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(100%)",
  contrast: "contrast(120%)",
  brightness: "brightness(110%)",
};

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  originalImageFile,
  onClose,
  onSaveAndClose,
}) => {
  const profileData = useProfileData();
  const queryClient = useQueryClient();
  const queryKey = ["profile", profileData.id];

  // Local state for preview and edits
  const [previewImage] = useState<string>(
    URL.createObjectURL(originalImageFile)
  );
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [straighten, setStraighten] = useState(0);
  const [activeTab, setActiveTab] = useState<"crop" | "filter" | "adjust">(
    "crop"
  );
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState("none");

  // Optimistic update for SAVING a new photo
  const updateProfilePictureMutation = useMutation({
    mutationFn: async (editedImageFile: File) => {
      // 1. Get signature from our backend
      const sigData = await getProfileUploadSignature();
      // 2. Upload file to Cloudinary
      const newUrl = await uploadToCloudinary(editedImageFile, sigData);
      // 3. Update our backend with the new Cloudinary URL
      await updateProfileIntro({ profilePictureUrl: newUrl });
      return newUrl; // Return the final URL
    },

    onMutate: async (editedImageFile: File) => {
      await queryClient.cancelQueries({ queryKey });

      const previousProfileData =
        queryClient.getQueryData<FullProfileResponse>(queryKey);

      // Create a *local* URL for the edited file for instant preview
      const localOptimisticUrl = URL.createObjectURL(editedImageFile);

      if (previousProfileData) {
        queryClient.setQueryData<FullProfileResponse>(queryKey, {
          ...previousProfileData,
          profile: {
            ...previousProfileData.profile,
            profilePictureUrl: localOptimisticUrl, // Use local blob URL
          },
        });
      }
      // Return old data and the local URL so we can clean it up
      return { previousProfileData, localOptimisticUrl };
    },

    onError: (err: Error, variables, context) => {
      console.error("Failed to save edited profile picture:", err);
      alert("Failed to save picture: " + err.message);
      if (context?.previousProfileData) {
        queryClient.setQueryData(queryKey, context.previousProfileData);
      }
    },

    onSettled: (newUrl, error, variables, context) => {
      // Clean up the local blob URL to prevent memory leaks
      if (context?.localOptimisticUrl) {
        URL.revokeObjectURL(context.localOptimisticUrl);
      }

      // Invalidate to fetch the *real* Cloudinary URL from the server
      queryClient.invalidateQueries({ queryKey });

      if (!error) {
        onSaveAndClose();
      }
    },
  });

  const combinedFilter = useMemo(() => {
    const adjustments = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return filter === "none"
      ? adjustments
      : `${filterMap[filter]} ${adjustments}`;
  }, [filter, brightness, contrast, saturation]);

  // This function draws the edits onto a canvas and triggers the mutation
  const handleSavePhoto = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Canvas not supported, cannot process image.");
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for canvas editing
    img.src = previewImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      const totalRotationInDegrees = rotation + straighten;
      const rad = (totalRotationInDegrees * Math.PI) / 180;
      ctx.rotate(rad);
      ctx.scale(zoom, zoom);
      ctx.filter = combinedFilter;
      ctx.drawImage(
        img,
        -img.width / 2,
        -img.height / 2,
        img.width,
        img.height
      );

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const editedFile = new File([blob], originalImageFile.name, {
              type: originalImageFile.type,
              lastModified: Date.now(),
            });
            // This triggers the 'onMutate' optimistic update
            updateProfilePictureMutation.mutate(editedFile);
          } else {
            alert("Failed to create edited image blob.");
          }
        },
        originalImageFile.type,
        1
      );
    };
    img.onerror = (err) => {
      alert("Failed to load image for processing.");
      console.error("Image load error:", err);
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-12 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[600px] flex flex-col animate-fadeIn shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit photo</h2>
          <button
            title="close"
            onClick={onClose}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
            disabled={updateProfilePictureMutation.isPending}
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex justify-center items-center bg-gray-100 p-4 relative">
            <div className="w-64 h-64 rounded-full overflow-hidden border border-gray-300 flex justify-center items-center bg-gray-200">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  style={{
                    transform: `rotate(${
                      rotation + straighten
                    }deg) scale(${zoom})`,
                    filter: combinedFilter,
                  }}
                  className="object-cover w-full h-full"
                />
              ) : (
                <MdAccountCircle className="w-full h-full text-gray-400" />
              )}
            </div>
          </div>

          <div className="w-80 border-l p-4 flex flex-col">
            {/* Editor Tabs */}
            <div className="flex border-b pb-2 mb-4">
              <button
                onClick={() => setActiveTab("crop")}
                className={`flex-1 text-center font-semibold pb-2 ${
                  activeTab === "crop"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Crop
              </button>
              <button
                onClick={() => setActiveTab("filter")}
                className={`flex-1 text-center font-semibold pb-2 ${
                  activeTab === "filter"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Filter
              </button>
              <button
                onClick={() => setActiveTab("adjust")}
                className={`flex-1 text-center font-semibold pb-2 ${
                  activeTab === "adjust"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Adjust
              </button>
            </div>

            {/* Editor Panels */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {activeTab === "crop" && (
                <>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-700">Rotation</p>
                    <div className="flex justify-center gap-4">
                      <button
                        title="setrotation"
                        onClick={() => setRotation((prev) => prev - 90)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <MdRotateLeft size={24} />
                      </button>
                      <button
                        title="rotation"
                        onClick={() => setRotation((prev) => prev + 90)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <MdRotateRight size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="zoom"
                      className="font-semibold text-gray-700"
                    >
                      Zoom
                    </label>
                    <input
                      type="range"
                      id="zoom"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="straighten"
                      className="font-semibold text-gray-700"
                    >
                      Straighten
                    </label>
                    <input
                      type="range"
                      id="straighten"
                      min="-45"
                      max="45"
                      step="1"
                      value={straighten}
                      onChange={(e) =>
                        setStraighten(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}

              {activeTab === "filter" && (
                <div className="flex flex-wrap gap-3">
                  {Object.keys(filterMap).map((key) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-4 py-1.5 rounded-full border text-sm capitalize transition ${
                        filter === key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "adjust" && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="brightness"
                      className="font-semibold text-gray-700"
                    >
                      Brightness
                    </label>
                    <input
                      type="range"
                      id="brightness"
                      min="50"
                      max="150"
                      step="1"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="contrast"
                      className="font-semibold text-gray-700"
                    >
                      Contrast
                    </label>
                    <input
                      type="range"
                      id="contrast"
                      min="50"
                      max="150"
                      step="1"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="saturation"
                      className="font-semibold text-gray-700"
                    >
                      Saturation
                    </label>
                    <input
                      type="range"
                      id="saturation"
                      min="0"
                      max="200"
                      step="1"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center p-4 border-t">
          <button
            onClick={handleSavePhoto}
            disabled={updateProfilePictureMutation.isPending}
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {updateProfilePictureMutation.isPending
              ? "Saving..."
              : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;