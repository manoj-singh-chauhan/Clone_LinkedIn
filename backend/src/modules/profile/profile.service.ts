import User from "../auth/user.model";
import Profile from "./profile.model";
import Experience from "./experience.model";
import Education from "./education.model";
import Skill from "./skill.model";
import "./userSkill.model";

export const getFullProfileService = async (userId: number) => {
  const userProfile = await User.findByPk(userId, {
    attributes: ["id", "email"],
    include: [
      {
        model: Profile,
        as: "profile",
      },
      {
        model: Experience,
        as: "experiences",
        separate: true,
        order: [["startDate", "DESC"]],
      },
      {
        model: Education,
        as: "educations",
        separate: true,
        order: [["startDate", "DESC"]],
      },
      {
        model: Skill,
        as: "skills",
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
    ],
  });

  if (!userProfile) {
    const error: any = new Error("Profile not found");
    error.statusCode = 404;
    throw error;
  }

  return userProfile.toJSON();
};

export const updateProfileIntroService = async (
  userId: number,
  data: {
    name?: string;
    headline?: string | null;
    locationCity?: string | null;
    locationCountry?: string | null;
    about?: string | null;
  }
) => {
  const profile = await Profile.findOne({ where: { userId } });

  if (!profile) {
    const error: any = new Error("Profile not found for this user");
    error.statusCode = 404;
    throw error;
  }

  await profile.update(data);

  return profile.toJSON();
};
