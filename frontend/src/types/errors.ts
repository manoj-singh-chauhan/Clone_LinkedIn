import type { FieldError } from "react-hook-form";
import type { CredentialResponse } from "@react-oauth/google";
import type { AxiosError } from "axios";

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

export interface APIErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string | string[]>;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type ApiError = AxiosError<{ error: string }>;
export type GoogleCredential = CredentialResponse;
export type FormError = FieldError | undefined;     
