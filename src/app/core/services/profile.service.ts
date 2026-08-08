import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ChangePasswordRequest, UpdateProfileRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/profile`;

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(this.base);
  }

  updateProfile(req: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(this.base, req);
  }

  uploadAvatar(file: File): Observable<ApiResponse<string>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.base}/avatar`, form);
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.base}/password`, req);
  }

  deleteAccount(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(this.base);
  }
}
