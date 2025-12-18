import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFullProfile, FullProfileResponse } from "../api/profile";
import Header from "../components/Header";
import { ProfileContext } from "../context/ProfileContext";
import IntroCard from "../components/profile/IntroCard";
import AboutSection from "../components/profile/AboutSection";

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const queryKey = ["profile", Number(userId)];

  const { data, isLoading, isError } = useQuery<FullProfileResponse, Error>({
    queryKey: queryKey,
    queryFn: () => getFullProfile(Number(userId)),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="text-center p-10">Loading profile...</div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <Header />
        <div className="text-center p-10 text-red-500">Profile not found.</div>
      </>
    );
  }

  return (
    <ProfileContext.Provider value={data}>
      <Header />
      <div className="bg-gray-50 min-h-screen py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <IntroCard />
          <AboutSection />

          {/* <ExperienceSection /> */}
          {/* <EducationSection /> */}
          {/* <SkillSection /> */}
        </div>
      </div>
    </ProfileContext.Provider>
  );
};

export default ProfilePage;
