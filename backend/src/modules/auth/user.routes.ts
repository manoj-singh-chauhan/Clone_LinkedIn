import { Router } from "express";
import { forgotPassword, googleAuth, login, logout, resetUserPassword, signup, verifyEmail } from "./user.controller";

const router = Router();

router.post("/signup", signup);
router.get("/verify/:token", verifyEmail);
router.post("/login",login)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetUserPassword);
router.post("/googleLogin",googleAuth);
router.post("/logout", logout);

export default router;