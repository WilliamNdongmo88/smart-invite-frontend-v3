import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateEventRequest,
  CreateEventWithCardRequest,
  Event,
  EventStats,
  EventWithCard,
  ThankYouTemplate,
  UpdateEventRequest,
  UpdateEventWithCardRequest,
} from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/events`;

  create(req: CreateEventRequest): Observable<ApiResponse<Event>> {
    return this.http.post<ApiResponse<Event>>(this.base, req);
  }

  createWithCard(req: CreateEventWithCardRequest): Observable<ApiResponse<EventWithCard>> {
    return this.http.post<ApiResponse<EventWithCard>>(`${this.base}/with-card`, req);
  }

  findAll(): Observable<ApiResponse<Event[]>> {
    return this.http.get<ApiResponse<Event[]>>(this.base);
  }

  findById(id: number): Observable<ApiResponse<Event>> {
    return this.http.get<ApiResponse<Event>>(`${this.base}/${id}`);
  }

  update(id: number, req: UpdateEventRequest): Observable<ApiResponse<Event>> {
    return this.http.put<ApiResponse<Event>>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  getStats(id: number): Observable<ApiResponse<EventStats>> {
    return this.http.get<ApiResponse<EventStats>>(`${this.base}/${id}/stats`);
  }

  getCard(id: number): Observable<ApiResponse<EventWithCard>> {
    return this.http.get<ApiResponse<EventWithCard>>(`${this.base}/${id}/card`);
  }

  updateWithCard(id: number, req: UpdateEventWithCardRequest): Observable<ApiResponse<EventWithCard>> {
    return this.http.put<ApiResponse<EventWithCard>>(`${this.base}/${id}/with-card`, req);
  }

  downloadCardPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/card/download`, { responseType: 'blob' });
  }

  uploadCustomCard(id: number, file: File): Observable<ApiResponse<any>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<any>>(`${this.base}/${id}/card/upload`, form);
  }

  getThankYouTemplate(id: number): Observable<ApiResponse<ThankYouTemplate>> {
    return this.http.get<ApiResponse<ThankYouTemplate>>(`${this.base}/${id}/thank-you-message`);
  }

  updateThankYouMessage(id: number, req: ThankYouTemplate): Observable<ApiResponse<Event>> {
    return this.http.patch<ApiResponse<Event>>(`${this.base}/${id}/thank-you-message`, req);
  }
}
