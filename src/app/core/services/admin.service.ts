import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { OrganizerSummary } from '../models/user.model';
import { Payment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin`;
  private readonly payBase = `${environment.apiUrl}/api/payments`;

  getAllOrganizers(): Observable<ApiResponse<OrganizerSummary[]>> {
    return this.http.get<ApiResponse<OrganizerSummary[]>>(`${this.base}/organizers`);
  }

  blockUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/users/${userId}/block`, {});
  }

  unblockUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/users/${userId}/unblock`, {});
  }

  activateUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/users/${userId}/activate`, {});
  }

  deleteUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/users/${userId}`);
  }

  getAllPayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.payBase}/all`);
  }
}
