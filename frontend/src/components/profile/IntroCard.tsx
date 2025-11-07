import React, { useState, lazy } from "react";
import { useProfileData } from "../../context/ProfileContext";
import { MdAccountCircle, MdEdit } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const IntroEditModal = lazy(() => import("./IntroEditModal"));
const ProfilePicModal = lazy(() => import("./ProfilePicModal"));
const UpdateProfilePhotoModal = lazy(() => import("./UpdateProfilePhotoModal"));
const ImageEditorModal = lazy(() => import("./ImageEditorModal"));

type ModalStep =
  | "none"
  | "introEdit"
  | "profilePic"
  | "updatePhoto"
  | "imageEditor";

const IntroCard: React.FC = () => {
  const { user } = useAuth();

  const profileData = useProfileData();

  const { profile } = profileData;

  const [modalStep, setModalStep] = useState<ModalStep>("none");
  const [fileToEdit, setFileToEdit] = useState<File | null>(null);

  const isOwnProfile = Number(user?.id) === profile.userId;
  const coverPhoto = profile.coverPhotoUrl;
  const profilePic = profile.profilePictureUrl;

  const openUpdatePhotoStep = () => setModalStep("updatePhoto");

  const handleFileSelectedForEditing = (file: File) => {
    setFileToEdit(file);
    setModalStep("imageEditor");
  };

  const closeAllModals = () => {
    setModalStep("none");
    setFileToEdit(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-48">
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300"></div>
          )}

          <div
            className={`absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-white ${
              isOwnProfile ? "cursor-pointer" : ""
            } ${
              profilePic ? "bg-white" : ""
            } overflow-hidden flex justify-center items-center`}
            onClick={() => isOwnProfile && setModalStep("profilePic")}
          >
            {profilePic ? (
              <img
                src={profilePic}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <MdAccountCircle className="w-full h-full text-gray-400 bg-white" />
            )}
          </div>
        </div>

        <div className="pt-20 pb-6 px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {profile.name}
            </h1>
            <p className="text-md text-gray-700">
              {profile.headline || "headline"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {profile.locationCity || profile.locationCountry
                ? `${profile.locationCity || ""}${
                    profile.locationCity && profile.locationCountry ? ", " : ""
                  }${profile.locationCountry || ""}`
                : "Location information"}
            </p>
          </div>

          {isOwnProfile && (
            <button
              title="Edit Intro"
              onClick={() => setModalStep("introEdit")}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition border border-gray-300 shadow-sm"
            >
              <MdEdit size={20} className="text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {modalStep === "introEdit" && <IntroEditModal onClose={closeAllModals} />}

      {modalStep === "profilePic" && (
        <ProfilePicModal
          onClose={closeAllModals}
          onUpdatePhotoClick={openUpdatePhotoStep}
          onEditClick={async (profileImageUrl) => {
            try {
              const response = await fetch(profileImageUrl);
              const blob = await response.blob();
              const file = new File([blob], "profile.jpg", { type: blob.type });

              setFileToEdit(file);
              setModalStep("imageEditor");
            } catch (error) {
              alert("Failed to load profile photo for editing");
              console.error(error);
            }
          }}
        />
      )}

      {modalStep === "updatePhoto" && (
        <UpdateProfilePhotoModal
          onClose={closeAllModals}
          onFileSelect={handleFileSelectedForEditing}
        />
      )}

      {modalStep === "imageEditor" && fileToEdit && (
        <ImageEditorModal
          originalImageFile={fileToEdit}
          onClose={() => setModalStep("updatePhoto")}
          onSaveAndClose={closeAllModals}
        />
      )}
    </>
  );
};

export default IntroCard;