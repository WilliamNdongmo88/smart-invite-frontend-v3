import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  GoogleLoginResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'si_access_token';
const REFRESH_TOKEN_KEY = 'si_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly base = `${environment.apiUrl}/api/auth`;

  register(req: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.base}/register`, req);
  }

  verifyEmail(req: VerifyEmailRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/verify-email`, req);
  }

  login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.base}/login`, req).pipe(
      tap((res) => {
        if (res.data) {
          console.log("### data: ", res.data);
          this.setTokens(res.data.accessToken, res.data.refreshToken);
        }
      })
    );
  }

  refresh(): Observable<ApiResponse<RefreshTokenResponse>> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<ApiResponse<RefreshTokenResponse>>(`${this.base}/refresh`, { refreshToken })
      .pipe(tap((res) => { if (res.data) this.setAccessToken(res.data.accessToken); }));
  }

  logout(): Observable<ApiResponse<void>> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<ApiResponse<void>>(`${this.base}/logout`, { refreshToken } as LogoutRequest)
      .pipe(tap(() => this.clearTokens()));
  }

  googleLogin(idToken: string): Observable<ApiResponse<GoogleLoginResponse>> {
    return this.http.post<ApiResponse<GoogleLoginResponse>>(`${this.base}/google`, { idToken } as GoogleLoginRequest).pipe(
      tap((res) => {
        if (res.data && !res.data.needsRegistration && res.data.accessToken && res.data.refreshToken) {
          console.log("### data: ", res.data);
          this.setTokens(res.data.accessToken, res.data.refreshToken);
        }
      })
    );
  }

  forgotPassword(req: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/forgot-password`, req);
  }

  resetPassword(req: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/reset-password`, req);
  }

  // ---- Token helpers ----

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  getRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  private setTokens(access: string, refresh: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  private setAccessToken(access: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  clearTokens(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
