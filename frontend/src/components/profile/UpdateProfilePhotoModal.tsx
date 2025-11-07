import React, { useRef } from "react";
import { useProfileData } from "../../context/ProfileContext";
import { AiOutlineClose } from "react-icons/ai";
import { MdAccountCircle } from "react-icons/md";

interface UpdateProfilePhotoModalProps {
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

const UpdateProfilePhotoModal: React.FC<UpdateProfilePhotoModalProps> = ({
  onClose,
  onFileSelect,
}) => {
  const profileData = useProfileData();
  const { profile } = profileData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-start p-4">
      <div className="bg-white rounded-lg w-full max-w-[780px] h-[468px] flex flex-col animate-fadeIn mt-12">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Update photo</h2>
          <button
            title="close"
            onClick={onClose}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">
            {profile.name}, help others recognize you!
          </h3>
          {profile.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <MdAccountCircle className="w-36 h-36 text-gray-300 rounded-full border-4 border-white shadow-md" />
          )}
          <p className="text-sm text-gray-600 max-w-sm">
            On LinkedIn, we require members to use their real identities, so take
            or upload a photo of yourself. Then crop, filter and adjust it to
            perfection.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t">
          <input
            placeholder="select image"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => alert("Camera feature not implemented yet.")}
            className="px-4 py-2 rounded-full text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Use camera
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Upload photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfilePhotoModal;