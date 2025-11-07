import React, { useState } from "react";
import { useProfileData } from "../../context/ProfileContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileIntro, FullProfileResponse } from "../../api/profile";
import {
  MdAccountCircle,
  MdDelete,
  MdFileUpload,
  MdEdit,
  MdOutlineFilterFrames,
} from "react-icons/md";
import { AiOutlineClose } from "react-icons/ai";


interface ProfilePicModalProps {
  onClose: () => void;
  onUpdatePhotoClick: () => void;
  onEditClick: (profileImageUrl: string) => void;
}


const IconButton: React.FC<{
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isDelete?: boolean;
}> = ({ text, icon, onClick, disabled, isDelete }) => {
  const colorClass = isDelete
    ? "text-red-400 hover:bg-red-900/40"
    : "text-gray-200 hover:bg-gray-700/60";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-20 p-2 rounded-lg transition-all ${colorClass} disabled:opacity-50`}
    >
      {icon}
      <span className="text-xs mt-1 font-semibold">{text}</span>
    </button>
  );
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
            Delete profile photo
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
          Are you sure? Having a profile picture helps others recognize you.
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

const ProfilePicModal: React.FC<ProfilePicModalProps> = ({
  onClose,
  onUpdatePhotoClick,
  onEditClick,
}) => {
  const profileData = useProfileData();
  const { profile } = profileData;
  const queryClient = useQueryClient();
  const queryKey = ["profile", profileData.id];

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await updateProfileIntro({ profilePictureUrl: null });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousProfileData =
        queryClient.getQueryData<FullProfileResponse>(queryKey);

      if (previousProfileData) {
        queryClient.setQueryData<FullProfileResponse>(queryKey, {
          ...previousProfileData,
          profile: {
            ...previousProfileData.profile,
            profilePictureUrl: null, // Optimistically set to null
          },
        });
      }
      return { previousProfileData };
    },
    onError: (err: Error, variables, context) => {
      alert("Failed to delete picture: " + err.message);
      if (context?.previousProfileData) {
        queryClient.setQueryData(queryKey, context.previousProfileData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      setShowConfirmDelete(false);
      onClose();
    },
  });

  const isPending = deleteMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-24 p-4">
      <div className="bg-[#1b1f23] rounded-lg w-full max-w-3xl h-[450px] shadow-2xl flex flex-col overflow-hidden animate-fadeIn relative">
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Profile photo</h2>
          <button
            title="close"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-full text-gray-300 hover:bg-gray-700 transition"
          >
            <AiOutlineClose size={18} />
          </button>
        </div>

        <div className="flex justify-center items-center bg-[#161a1d] flex-1">
          {profile.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt="Profile"
              className="w-60 h-60 rounded-full object-cover border-4 border-gray-700 shadow-inner"
            />
          ) : (
            <MdAccountCircle className="w-60 h-60 text-gray-500" />
          )}
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-700 bg-[#1b1f23]">
          <div className="flex items-center gap-1">
            <IconButton
              text="Edit"
              icon={<MdEdit size={22} />}
              onClick={() => {
                if (profile.profilePictureUrl) {
                  onEditClick(profile.profilePictureUrl);
                } else {
                  alert("No profile photo to edit!");
                }
              }}
              disabled={isPending}
            />
            <IconButton
              text="Update photo"
              icon={<MdFileUpload size={22} />}
              onClick={onUpdatePhotoClick}
              disabled={isPending}
            />
            <IconButton
              text="Frames"
              icon={<MdOutlineFilterFrames size={22} />}
              onClick={() => alert("Frames feature not implemented")}
              disabled={isPending}
            />
          </div>

          <IconButton
            text={deleteMutation.isPending ? "Deleting..." : "Delete"}
            icon={<MdDelete size={22} />}
            onClick={() => setShowConfirmDelete(true)}
            disabled={!profile.profilePictureUrl || isPending} // Disable if no pic
            isDelete={true}
          />
        </div>

        {showConfirmDelete && (
          <DeleteConfirmModal
            isPending={isPending}
            onCancel={() => setShowConfirmDelete(false)}
            onConfirm={() => deleteMutation.mutate()}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePicModal;