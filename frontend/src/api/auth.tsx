import api from "./axois";
import { SignupData, LoginData, AuthResponse } from "../types/errors";

export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/signup", data);
  return res.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
};

export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/auth/googleLogin", { idToken });
  return res.data;
};

export const forgotPassword = async (
  email: string,
  captchaToken: string
): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>("/auth/forgot-password", {
    email,
    "h-captcha-response": captchaToken,
  });
  return res.data;
};

export const resetPassword = async (
  token: string,
  password: string
): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>(
    `/auth/reset-password/${token}`,
    { password }
  );
  return res.data;
};

export const verifyEmail = async (
  token: string
): Promise<{ message: string }> => {
  const res = await api.get<{ message: string }>(`/auth/verify/${token}`);
  return res.data;
};

export const logout = async (): Promise<{ message: string }> => {
  const res = await api.post<{ message: string }>("/auth/logout");
  return res.data;
};

export const checkAuth = async (): Promise<AuthResponse> => {
  const res = await api.get<AuthResponse>("/session");
  return res.data;
};
