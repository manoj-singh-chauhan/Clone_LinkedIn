import { Router } from "express";
import {
  getProfileHandler,
  updateProfileIntroHandler,
} from "./profile.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import cloudinary from "../../config/cloudinary.config";

const router = Router();

router.get("/signature", authenticate, (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "linkedin_clone/profile_images";
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    res.json({
      apiKey: cloudinary.config().api_key,
      cloudName: cloudinary.config().cloud_name,
      folder,
      timestamp,
      signature,
    });
  } catch (err: any) {
    console.error("Signature Error:", err.message);
    res
      .status(500)
      .json({ message: "Failed to get upload signature", error: err.message });
  }
});

router.get("/:userId", getProfileHandler);
router.put("/intro", authenticate, updateProfileIntroHandler);

export default router;