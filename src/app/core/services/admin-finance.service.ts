import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

// ── Modèles ───────────────────────────────────────────────────────────────────

export interface PeriodAmount { period: string; amount: number; }
export interface PeriodCount  { period: string; count:  number; }

export interface FinanceStats {
  // KPIs globaux
  totalRevenue:      number;
  revenueThisMonth:  number;
  revenueLastMonth:  number;
  monthlyGrowthPct:  number;
  totalApproved:     number;
  totalPending:      number;
  pendingAmount:     number;
  avgOrderValue:     number;

  // Séries temporelles
  byMonth:      PeriodAmount[];
  byYear:       PeriodAmount[];
  countByMonth: PeriodCount[];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminFinanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin/finance`;

  getStats(): Observable<ApiResponse<FinanceStats>> {
    return this.http.get<ApiResponse<FinanceStats>>(`${this.base}/stats`);
  }
}
