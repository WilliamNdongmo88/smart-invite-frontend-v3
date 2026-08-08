import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AgentResponse, CreateAgentRequest, ScanResponse } from '../models/checkin.model';

@Injectable({ providedIn: 'root' })
export class CheckinService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/checkin`;

  createAgent(req: CreateAgentRequest): Observable<ApiResponse<AgentResponse>> {
    return this.http.post<ApiResponse<AgentResponse>>(`${this.base}/agents`, req);
  }

  scan(token: string): Observable<ApiResponse<ScanResponse>> {
    return this.http.post<ApiResponse<ScanResponse>>(`${this.base}/scan/${token}`, {});
  }
}
