import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AgentResponse, CheckinParameters, CreateAgentRequest, EventSummary, ScanResponse } from '../models/checkin.model';

@Injectable({ providedIn: 'root' })
export class CheckinService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/checkin`;

  createAgent(req: CreateAgentRequest): Observable<ApiResponse<AgentResponse>> {
    return this.http.post<ApiResponse<AgentResponse>>(`${this.base}/agents`, req);
  }

  getAgents(): Observable<ApiResponse<AgentResponse[]>> {
    return this.http.get<ApiResponse<AgentResponse[]>>(`${this.base}/agents`);
  }

  deleteAgent(agentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/agents/${agentId}`);
  }

  scan(token: string): Observable<ApiResponse<ScanResponse>> {
    return this.http.post<ApiResponse<ScanResponse>>(`${this.base}/scan/${token}`, {});
  }

  getParameters(eventId: number): Observable<ApiResponse<CheckinParameters>> {
    return this.http.get<ApiResponse<CheckinParameters>>(`${this.base}/parameters/${eventId}`);
  }

  getStats(eventId?: number): Observable<ApiResponse<CheckinParameters>> {
    const params = eventId ? { params: { eventId: eventId.toString() } } : {};
    return this.http.get<ApiResponse<CheckinParameters>>(`${this.base}/stats`, params);
  }

  getAgentEvents(): Observable<ApiResponse<EventSummary[]>> {
    return this.http.get<ApiResponse<EventSummary[]>>(`${this.base}/events`);
  }

  updateSound(eventId: number, confirmationSound: boolean): Observable<ApiResponse<CheckinParameters>> {
    return this.http.patch<ApiResponse<CheckinParameters>>(`${this.base}/parameters/${eventId}/sound`, { confirmationSound });
  }
}
