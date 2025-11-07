import React, { useState } from "react";
import { useProfileData } from "../../context/ProfileContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProfileIntro,
  UpdateProfileIntroPayload,
  FullProfileResponse,
} from "../../api/profile";
import { AiOutlineClose } from "react-icons/ai";

interface IntroEditModalProps {
  onClose: () => void;
}

const IntroEditModal: React.FC<IntroEditModalProps> = ({ onClose }) => {
  
  const profileData = useProfileData();
  
  const { profile } = profileData;
  
  const queryClient = useQueryClient();

  
  const queryKey = ["profile", profileData.id];

  
  const [name, setName] = useState(profile.name);
  const [headline, setHeadline] = useState(profile.headline || "");
  const [locationCity, setLocationCity] = useState(profile.locationCity || "");
  const [locationCountry, setLocationCountry] = useState(
    profile.locationCountry || ""
  );
  const [about, setAbout] = useState(profile.about || "");

  const mutation = useMutation({
    mutationFn: (newIntroData: UpdateProfileIntroPayload) => {
      return updateProfileIntro(newIntroData);
    },

    
    onMutate: async (newIntroData) => {
      
      await queryClient.cancelQueries({ queryKey });

      
      const previousProfileData =
        queryClient.getQueryData<FullProfileResponse>(queryKey);

      
      if (previousProfileData) {
        queryClient.setQueryData<FullProfileResponse>(queryKey, {
          ...previousProfileData,
          profile: { 
            ...previousProfileData.profile,
            ...newIntroData,
          },
        });
      }

      return { previousProfileData };
    },

    onError: (err: Error, variables, context) => {
      console.error("Failed to update profile:", err);
      alert("Failed to update: " + err.message);
      if (context?.previousProfileData) {
        queryClient.setQueryData(queryKey, context.previousProfileData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      onClose();
    },
  });

  const handleSubmit = () => {
    const textData: UpdateProfileIntroPayload = {
      name,
      headline,
      locationCity,
      locationCountry,
      about,
    };
    mutation.mutate(textData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Edit Intro</h2>
          <button
            title="close"
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700"
            >
              Name*
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="headline"
              className="text-sm font-semibold text-gray-700"
            >
              Headline
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="locationCity"
              className="text-sm font-semibold text-gray-700"
            >
              Location (City)
            </label>
            <input
              id="locationCity"
              type="text"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="locationCountry"
              className="text-sm font-semibold text-gray-700"
            >
              Location (Country)
            </label>
            <input
              id="locationCountry"
              type="text"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="about"
              className="text-sm font-semibold text-gray-700"
            >
              About
            </label>
            <textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mt-1"
              rows={5}
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400"
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroEditModal;