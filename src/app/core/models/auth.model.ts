import { NotificationMode } from './enums.model';

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  notificationMode: NotificationMode;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;   // nouveau refresh token (rotation)
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginResponse {
  needsRegistration: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  email?: string;
  name?: string;
  avatarUrl?: string;
}
