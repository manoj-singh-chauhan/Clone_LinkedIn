import api from "./axois";
import axios from "axios";
import { AxiosError } from "axios";
import { APIErrorResponse } from "../types/errors";

export interface Profile {
  id: number;
  userId: number;
  name: string;
  headline: string | null;
  profilePictureUrl: string | null;
  coverPhotoUrl: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  about: string | null;
  contactInfo: object | null;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface Experience {
  id: number;
  userId: number;
  title: string;
  companyName: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface Education {
  id: number;
  userId: number;
  schoolName: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
}

export interface Skill {
  id: number;
  name: string;
}

export interface FullProfileResponse {
  id: number;
  email: string;
  profile: Profile;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
}

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: string;
  folder: string;
  cloudName: string;
  apiKey: string;
}

export const getFullProfile = async (
  userId: number
): Promise<FullProfileResponse> => {
  try {
    const res = await api.get<FullProfileResponse>(`/profile/${userId}`);
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to fetch profile",
        }
      );
    }
    throw new Error("Failed to fetch profile");
  }
};

export const getProfileUploadSignature =
  async (): Promise<CloudinarySignatureResponse> => {
    const res = await api.get<CloudinarySignatureResponse>(
      "/profile/signature"
    );
    return res.data;
  };

export const uploadToCloudinary = async (
  file: File,
  signatureData: CloudinarySignatureResponse
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", signatureData.timestamp);
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,
    formData
  );

  return res.data.secure_url as string;
};

export interface UpdateProfileIntroPayload {
  name: string;
  headline: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  about: string | null;
  profilePictureUrl?: string | null;
  coverPhotoUrl?: string | null;
}

export interface ProfileUploadFiles {
  profilePicFile?: File | null;
  coverPhotoFile?: File | null;
}

export const updateProfileIntro = async (
  data: Partial<UpdateProfileIntroPayload>,
  files?: ProfileUploadFiles
): Promise<Profile> => {
  try {
    let profilePictureUrl: string | undefined | null = undefined;
    let coverPhotoUrl: string | undefined | null = undefined;

    if (data.profilePictureUrl === null) {
      profilePictureUrl = null;
    }

    if (files && (files.profilePicFile || files.coverPhotoFile)) {
      const sigData = await getProfileUploadSignature();

      if (files.profilePicFile) {
        console.log("Uploading profile picture...");
        profilePictureUrl = await uploadToCloudinary(
          files.profilePicFile,
          sigData
        );
      }
      if (files.coverPhotoFile) {
        console.log("Uploading cover photo...");
        coverPhotoUrl = await uploadToCloudinary(files.coverPhotoFile, sigData);
      }
    }

    const payload: Partial<UpdateProfileIntroPayload> = {
      ...data,
    };

    if (profilePictureUrl !== undefined) {
      payload.profilePictureUrl = profilePictureUrl;
    }
    if (coverPhotoUrl !== undefined) {
      payload.coverPhotoUrl = coverPhotoUrl;
    }

    const res = await api.put<Profile>("/profile/intro", payload);
    return res.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw (
        (error.response.data as APIErrorResponse) || {
          message: "Failed to update profile",
        }
      );
    }
    throw new Error("Failed to update profile");
  }
};