import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/models/api-response.model';

// ── Modèles ───────────────────────────────────────────────────────────────────

export interface VisitorRow {
  id: number;
  ipAddress: string;
  country: string;
  city: string;
  device: string;
  os: string;
  browser: string;
  firstVisit: string | null;
  totalPageViews: number;
  totalSessions: number;
  lastDurationSeconds: number | null;
  visitorType: 'new' | 'returning';
}

export interface VisitorStatsKpi {
  totalVisitors: number;
  returningVisitors: number;
  totalPageViews: number;
  avgDurationSeconds: number;
}

// ── Composant ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-visitors',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-visitors.component.html',
  styleUrl: './admin-visitors.component.scss',
})
export class AdminVisitorsComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin/analytics`;

  // ── State ──────────────────────────────────────────────────────────
  kpi       = signal<VisitorStatsKpi | null>(null);
  visitors  = signal<VisitorRow[]>([]);
  loading   = signal(false);
  kpiLoading = signal(false);
  error     = signal<string | null>(null);

  // ── Filtres ────────────────────────────────────────────────────────
  search   = '';
  country  = '';
  city     = '';
  device   = '';
  browser  = '';
  dateFrom = '';
  dateTo   = '';

  ngOnInit(): void {
    this.loadKpi();
    this.loadVisitors();
  }

  // ── Chargement KPI ─────────────────────────────────────────────────
  loadKpi(): void {
    this.kpiLoading.set(true);
    this.http.get<ApiResponse<VisitorStatsKpi>>(`${this.base}/visitors/kpi`)
      .subscribe({
        next:  res => { this.kpi.set(res.data ?? null); this.kpiLoading.set(false); },
        error: ()  => this.kpiLoading.set(false),
      });
  }

  // ── Chargement tableau ─────────────────────────────────────────────
  loadVisitors(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.search)   params['search']   = this.search;
    if (this.country)  params['country']  = this.country;
    if (this.city)     params['city']     = this.city;
    if (this.device)   params['device']   = this.device;
    if (this.browser)  params['browser']  = this.browser;
    if (this.dateFrom) params['dateFrom'] = new Date(this.dateFrom).toISOString();
    if (this.dateTo)   params['dateTo']   = new Date(this.dateTo).toISOString();

    this.http.get<ApiResponse<VisitorRow[]>>(`${this.base}/visitors`, { params })
      .subscribe({
        next:  res => { this.visitors.set(res.data ?? []); this.loading.set(false); },
        error: ()  => { this.error.set('Impossible de charger les visiteurs'); this.loading.set(false); },
      });
  }

  // ── Actions filtres ────────────────────────────────────────────────
  filter(): void  { this.loadVisitors(); }

  reset(): void {
    this.search = this.country = this.city = this.device = this.browser = this.dateFrom = this.dateTo = '';
    this.loadVisitors();
  }

  // ── Utilitaires ────────────────────────────────────────────────────

  /** Formate les secondes en "Xm Ys" */
  formatDuration(sec: number | null): string {
    if (sec == null || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  /** Formate la durée moyenne des KPI */
  formatAvg(sec: number): string {
    if (!sec || sec <= 0) return '0m 0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  /** Retourne le % de visiteurs récurrents */
  returningPct(): string {
    const k = this.kpi();
    if (!k || k.totalVisitors === 0) return '0%';
    return `${Math.round((k.returningVisitors / k.totalVisitors) * 100)}%`;
  }

  /** Icône device */
  deviceIcon(device: string): string {
    const d = device?.toLowerCase() ?? '';
    if (d === 'mobile')  return '📱';
    if (d === 'tablet')  return '📟';
    return '🖥️';
  }
}
