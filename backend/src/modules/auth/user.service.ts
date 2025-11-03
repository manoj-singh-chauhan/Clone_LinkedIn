import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "./user.model";
import Profile from "../profile/profile.model";
import jwt from "jsonwebtoken";
import { sendResetPasswordEmail } from "../../utils/sendEmail";
import { OAuth2Client } from "google-auth-library";

//signup logic
export const signupUser = async ({ name, email, password }: any) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    if (!existingUser.isVerified) {
      if (
        existingUser.tokenExpiry &&
        existingUser.tokenExpiry.getTime() < Date.now()
      ) {
        await existingUser.destroy();
      } else {
        throw new Error(
          "Please verify your email. Verification link already sent."
        );
      }
    } else {
      throw new Error("Email already exists. Please login.");
    }
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  const user = await User.create({
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken: token,
    tokenExpiry,
  });
  await Profile.create({ userId: user.id, name });
  return { user, token };
};

//verify logic
export const verifyUserEmail = async (token: string) => {
  if (!token) throw new Error("Invalid or expired token");
  const user = await User.findOne({ where: { verificationToken: token } });
  if (!user) {
    throw new Error("Token expired or invalid. Please signup again.");
  }
  if (!user.tokenExpiry || user.tokenExpiry.getTime() < Date.now()) {
    await user.destroy();
    throw new Error("Token expired or invalid. Please signup again.");
  }
  user.isVerified = true;
  user.verificationToken = null;
  user.tokenExpiry = null;
  await user.save();

  return {
    message: "Email verified successfully. Now you can login",
    userId: user.id,
  };
};

//login logic
const JWT_SECRET = process.env.JWT_SECRET;
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  if (!user.isVerified) throw new Error("Please verify your email first");

  // if (user.isGoogleLogin) {
  //   throw new Error(
  //     "This account is linked with Google. Please login using Google."
  //   );
  // }
  if (!user.password) {
    if (user.isGoogleLogin) {
      throw new Error(
        // "This account was created with Google. Please login using Google."
        "This email is linked to a Google account. Please continue by selecting 'Login with Google'."
      );
    } else {
      throw new Error("Password not set for this account.");
    }
  }
  //check
  // if (!user.password) {
  //   throw new Error("Password not set for this user");
  // }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid password");
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, {
    expiresIn: "1h",
  });
  return { user, token };
};

//forgot password
export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  if (user.isGoogleLogin && !user.password) {
    throw new Error("This account was created with Google. Please login with Google.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000);
  user.resetPasswordToken = token;
  user.resetPasswordExpiry = expiry;
  await user.save();
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendResetPasswordEmail(email, resetLink);
  return { message: "Password reset email sent" };
};

//reset password
export const resetPassword = async (token: string, newPassword: string) => {
  const user = await User.findOne({ where: { resetPasswordToken: token } });
  if (!user) throw new Error("Invalid or expired token");
  if (user.resetPasswordExpiry! < new Date()) {
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();
    throw new Error("Token expired. Request again.");
  }
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpiry = null;
  await user.save();
  return { message: "Password reset successful" };
};

//google login
export const googleLogin = async (idToken: string) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error("Invalid Google token");
  const email = payload.email;
  const name = payload.name || "User";
  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({
      email,
      password: null,
      isVerified: true,
      isGoogleLogin: true,
    });

    await Profile.create({
      userId: user.id,
      name,
    });
  } else {
    let changed = false;

    if (!user.isVerified) {
      user.isVerified = true;
      user.verificationToken = null;
      user.tokenExpiry = null;
      changed = true;
    }

    if (!user.isGoogleLogin) {
      user.isGoogleLogin = true;
      changed = true;
    }

    if (changed) await user.save();

    const profile = await Profile.findOne({ where: { userId: user.id } });
    if (!profile) {
      await Profile.create({ userId: user.id, name });
    } else if ((!profile.name || profile.name.trim() === "") && name) {
      profile.name = name;
      await profile.save();
    }
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, {
    expiresIn: "1h",
  });

  return { user, token };
};
