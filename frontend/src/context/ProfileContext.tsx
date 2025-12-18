import { createContext, useContext } from "react";
import { FullProfileResponse } from "../api/profile";

export const ProfileContext = createContext<FullProfileResponse | null>(null);

export const useProfileData = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileData must be used within a ProfileProvider");
  }
  return context;
};
