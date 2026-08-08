import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  BulkGenerateRequest,
  BulkGenerateResponse,
  CreateGuestRequest,
  Invitation,
  PublicInvitation,
  RsvpRequest,
} from '../models/invitation.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  generate(eventId: number, req: CreateGuestRequest): Observable<ApiResponse<Invitation>> {
    return this.http.post<ApiResponse<Invitation>>(
      `${this.base}/events/${eventId}/invitations/generate`, req
    );
  }

  bulkGenerate(req: BulkGenerateRequest): Observable<ApiResponse<BulkGenerateResponse>> {
    return this.http.post<ApiResponse<BulkGenerateResponse>>(
      `${this.base}/invitations/bulk-generate`, req
    );
  }

  list(eventId: number): Observable<ApiResponse<Invitation[]>> {
    return this.http.get<ApiResponse<Invitation[]>>(
      `${this.base}/events/${eventId}/invitations`
    );
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/invitations/${id}`);
  }

  // Public — sans auth
  getPublic(token: string): Observable<ApiResponse<PublicInvitation>> {
    return this.http.get<ApiResponse<PublicInvitation>>(`${this.base}/invitations/${token}`);
  }

  rsvp(token: string, req: RsvpRequest): Observable<ApiResponse<PublicInvitation>> {
    return this.http.post<ApiResponse<PublicInvitation>>(
      `${this.base}/invitations/${token}/rsvp`, req
    );
  }
}
