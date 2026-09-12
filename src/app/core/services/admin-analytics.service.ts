import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

// ── Modèles ──────────────────────────────────────────────────────────

export interface DailyCount    { period: string; count: number; }
export interface PageViewCount { url: string;    views: number; }
export interface LabelCount    { label: string;  count: number; }
export interface LabelValue    { label: string;  avgSeconds: number; }

export interface AnalyticsStats {
  uniqueVisitorsByDay:     DailyCount[];
  uniqueVisitorsByWeek:    DailyCount[];
  uniqueVisitorsByMonth:   DailyCount[];
  topPages:                PageViewCount[];
  byCountry:               LabelCount[];
  byDevice:                LabelCount[];
  avgDurationByOs:         LabelValue[];
  avgDurationByBrowser:    LabelValue[];
  bounceRate:              number;
  totalVisitors:           number;
  totalSessions:           number;
  totalPageViews:          number;
}

// ── Service ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin/analytics`;

  getStats(topPages = 10): Observable<ApiResponse<AnalyticsStats>> {
    return this.http.get<ApiResponse<AnalyticsStats>>(
      `${this.base}/stats`,
      { params: { topPages: topPages.toString() } }
    );
  }
}
