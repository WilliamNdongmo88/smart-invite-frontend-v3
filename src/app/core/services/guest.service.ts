import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { AddGuestRequest, BulkDeleteRequest, Guest, UpdateGuestRequest } from '../models/guest.model';
import { RsvpStatus } from '../models/enums.model';

export interface GuestListParams {
  search?: string;
  rsvp?: RsvpStatus;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  add(eventId: number, req: AddGuestRequest): Observable<ApiResponse<Guest>> {
    return this.http.post<ApiResponse<Guest>>(`${this.base}/events/${eventId}/guests`, req);
  }

  list(eventId: number, params: GuestListParams = {}): Observable<ApiResponse<PageResponse<Guest>>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.rsvp)   httpParams = httpParams.set('rsvp', params.rsvp);
    return this.http.get<ApiResponse<PageResponse<Guest>>>(
      `${this.base}/events/${eventId}/guests`, { params: httpParams }
    );
  }

  update(guestId: number, req: UpdateGuestRequest): Observable<ApiResponse<Guest>> {
    return this.http.put<ApiResponse<Guest>>(`${this.base}/guests/${guestId}`, req);
  }

  delete(guestId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/guests/${guestId}`);
  }

  bulkDelete(req: BulkDeleteRequest): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/guests/bulk`, { body: req });
  }

  sendReminder(guestId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/guests/${guestId}/reminder`, {});
  }
}
