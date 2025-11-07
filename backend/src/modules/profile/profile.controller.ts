import { Request, Response } from "express";
import { getProfileSchema, updateProfileIntroSchema } from "./profile.validation";
import { getFullProfileService, updateProfileIntroService } from "./profile.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";



export const getProfileHandler = async (req: Request, res: Response) => {
  try {
    const { params } = getProfileSchema.parse({ params: req.params });
    const { userId } = params;
    const profileData = await getFullProfileService(userId);
    return res.status(200).json(profileData);
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ message: "Validation failed", errors: err.errors });
    }
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to fetch profile" });
  }
};


export const updateProfileIntroHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { body } = updateProfileIntroSchema.parse({ body: req.body });
    console.log(req.body);
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const updatedProfile = await updateProfileIntroService(userId, body);
    return res.status(200).json(updatedProfile);
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ message: "Validation failed", errors: err.errors });
    }
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to update profile" });
  }
};

