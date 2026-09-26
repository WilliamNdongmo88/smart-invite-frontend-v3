import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { OrganizerSummary, AdminEventDetail, UserNewsMessage } from '../models/user.model';
import { Payment } from '../models/payment.model';
import { Referrer, ReferrerRequest } from '../models/referrer.model';

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

  getEventDetail(eventId: number): Observable<ApiResponse<AdminEventDetail>> {
    return this.http.get<ApiResponse<AdminEventDetail>>(`${this.base}/events/${eventId}`);
  }

  // ── Messages de contact ──────────────────────────────────────────

  getAllContacts(): Observable<ApiResponse<UserNewsMessage[]>> {
    return this.http.get<ApiResponse<UserNewsMessage[]>>(`${this.base}/contacts`);
  }

  replyToContact(id: number, replyMessage: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.base}/contacts/${id}/reply`,
      { replyMessage }
    );
  }

  markContactRead(id: number): Observable<ApiResponse<UserNewsMessage>> {
    return this.http.patch<ApiResponse<UserNewsMessage>>(`${this.base}/contacts/${id}/read`, {});
  }

  deleteContact(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/contacts/${id}`);
  }

  // ── Recommandateurs ─────────────────────────────────────────────

  getReferrers(): Observable<ApiResponse<Referrer[]>> {
    return this.http.get<ApiResponse<Referrer[]>>(`${this.base}/referrers`);
  }

  createReferrer(req: ReferrerRequest): Observable<ApiResponse<Referrer>> {
    return this.http.post<ApiResponse<Referrer>>(`${this.base}/referrers`, req);
  }

  toggleReferrer(id: number): Observable<ApiResponse<Referrer>> {
    return this.http.patch<ApiResponse<Referrer>>(`${this.base}/referrers/${id}/toggle`, {});
  }

  updateReferrer(id: number, req: ReferrerRequest): Observable<ApiResponse<Referrer>> {
    return this.http.put<ApiResponse<Referrer>>(`${this.base}/referrers/${id}`, req);
  }

  deleteReferrer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/referrers/${id}`);
  }
}
