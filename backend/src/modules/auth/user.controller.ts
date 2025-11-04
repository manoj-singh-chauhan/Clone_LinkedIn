import { Request, Response } from "express";
import { signupSchema } from "./user.validation";
import { signupUser, verifyUserEmail } from "./user.service";
import { sendVerificationEmail } from "../../utils/sendEmail";
import { loginUser } from "./user.service";
import { resetPasswordSchema } from "./user.validation";
import { requestPasswordReset, resetPassword } from "./user.service";
import { googleLogin } from "./user.service";
import { COOKIE_OPTIONS } from "../../utils/cookieOptions";
import { verifyCaptcha } from "../../utils/verifyCaptcha";

//signup controller
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);
    const { user, token } = await signupUser({ name, email, password });

    const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;
    await sendVerificationEmail(email, verificationLink);

    res
      .status(201)
      .json({ message: "Signup successfulyy. Check your email to verify." });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

//verify controller
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await verifyUserEmail(token);

    res.json({ message: result.message, userId: result.userId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

//login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { user, token, name } = await loginUser(email, password);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, name: name },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

//forgot password

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, "h-captcha-response": token } = req.body;

    const isHuman = await verifyCaptcha(token);
    if (!isHuman) {
      return res.status(400).json({ error: "hCaptcha verification failed" });
    }

    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Something went wrong" });
  }
};

//after forgot reset password
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = resetPasswordSchema.parse(req.body);

    const result = await resetPassword(token, password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
};

//google login

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    const { user, token, name } = await googleLogin(idToken);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({
      message: "Google login successful",
      user: { id: user.id, email: user.email, name: name },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({ message: "Logged out successfully" });
};
