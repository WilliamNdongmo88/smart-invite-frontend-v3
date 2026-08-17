import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CreateLinkRequest, Link, UpdateLinkRequest } from '../models/checkin.model';
import { CreateGuestRequest, Invitation } from '../models/invitation.model';

@Injectable({ providedIn: 'root' })
export class LinkService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/link`;

  create(req: CreateLinkRequest): Observable<ApiResponse<Link>> {
    return this.http.post<ApiResponse<Link>>(`${this.base}/add-link`, req);
  }

  getByEvent(eventId: number): Observable<ApiResponse<Link[]>> {
    return this.http.get<ApiResponse<Link[]>>(`${this.base}/get-links`, {
      params: new HttpParams().set('eventId', eventId),
    });
  }

  update(linkId: number, req: UpdateLinkRequest): Observable<ApiResponse<Link>> {
    return this.http.put<ApiResponse<Link>>(`${this.base}/edit-link/${linkId}`, req);
  }

  delete(linkId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/delete-link/${linkId}`);
  }

  // Public — sans auth
  preview(token: string): Observable<ApiResponse<{
    eventTitle: string;
    concernedNames: string;
    eventDate: string;
    couplePhotoUrl: string | null;
    banquetLocation: string | null;
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/preview/${token}`);
  }

  join(token: string, req: CreateGuestRequest): Observable<ApiResponse<Invitation>> {
    return this.http.post<ApiResponse<Invitation>>(`${this.base}/join/${token}`, req);
  }
}
