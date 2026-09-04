import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface ContactRequest {
  name:         string;
  replyChannel: 'WHATSAPP' | 'EMAIL';
  replyContact: string;
  message:      string;
}

export interface ContactResponse {
  id:           number;
  name:         string;
  replyChannel: string;
  replyContact: string;
  createdAt:    string;
  message:      string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly url  = `${environment.apiUrl}/api/contact`;

  submit(req: ContactRequest): Observable<ApiResponse<ContactResponse>> {
    return this.http.post<ApiResponse<ContactResponse>>(this.url, req);
  }
}
