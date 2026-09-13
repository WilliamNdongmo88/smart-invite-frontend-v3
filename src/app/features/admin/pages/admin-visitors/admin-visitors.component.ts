import { Component, inject, signal, computed, OnInit } from '@angular/core';
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

export interface LabelCount    { label: string; count: number; }
export interface PageViewCount { url: string;   views: number; }
export interface DailyCount    { period: string; count: number; }

export interface VisitorOverview {
  byCountry:   LabelCount[];
  byBrowser:   LabelCount[];
  byOs:        LabelCount[];
  byDevice:    LabelCount[];
  topPages:    PageViewCount[];
  visitsByDay: DailyCount[];
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
  kpi          = signal<VisitorStatsKpi | null>(null);
  overview     = signal<VisitorOverview | null>(null);
  visitors     = signal<VisitorRow[]>([]);
  loading      = signal(false);
  kpiLoading   = signal(false);
  ovLoading    = signal(false);
  error        = signal<string | null>(null);

  // ── Filtres ────────────────────────────────────────────────────────
  search   = '';
  country  = '';
  city     = '';
  device   = '';
  browser  = '';
  dateFrom = '';
  dateTo   = '';

  // ── Computed pour les barres des stats cards ───────────────────────
  maxCountry  = computed(() => Math.max(...(this.overview()?.byCountry  ?? []).map(x => x.count), 1));
  maxBrowser  = computed(() => Math.max(...(this.overview()?.byBrowser  ?? []).map(x => x.count), 1));
  maxOs       = computed(() => Math.max(...(this.overview()?.byOs       ?? []).map(x => x.count), 1));
  maxDevice   = computed(() => Math.max(...(this.overview()?.byDevice   ?? []).map(x => x.count), 1));
  maxPageView = computed(() => Math.max(...(this.overview()?.topPages   ?? []).map(x => x.views), 1));
  maxDay      = computed(() => Math.max(...(this.overview()?.visitsByDay ?? []).map(x => x.count), 1));

  ngOnInit(): void {
    this.loadKpi();
    this.loadOverview();
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

  // ── Chargement overview (6 stats cards) ────────────────────────────
  loadOverview(): void {
    this.ovLoading.set(true);
    this.http.get<ApiResponse<VisitorOverview>>(`${this.base}/overview`)
      .subscribe({
        next:  res => { this.overview.set(res.data ?? null); this.ovLoading.set(false); },
        error: ()  => this.ovLoading.set(false),
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
  filter(): void { this.loadVisitors(); }

  reset(): void {
    this.search = this.country = this.city = this.device = this.browser = this.dateFrom = this.dateTo = '';
    this.loadVisitors();
  }

  reload(): void {
    this.loadKpi();
    this.loadOverview();
    this.loadVisitors();
  }

  // ── Utilitaires ────────────────────────────────────────────────────

  pct(value: number, max: number): number {
    if (!max) return 0;
    return Math.max(Math.round((value / max) * 100), value > 0 ? 2 : 0);
  }

  formatDuration(sec: number | null): string {
    if (sec == null || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m === 0 ? `${s}s` : `${m}m ${s}s`;
  }

  formatAvg(sec: number): string {
    if (!sec || sec <= 0) return '0m 0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  returningPct(): string {
    const k = this.kpi();
    if (!k || k.totalVisitors === 0) return '0%';
    return `${Math.round((k.returningVisitors / k.totalVisitors) * 100)}%`;
  }

  deviceIcon(device: string): string {
    const d = device?.toLowerCase() ?? '';
    if (d === 'mobile') return '📱';
    if (d === 'tablet') return '📟';
    return '🖥️';
  }

  /** Tronque une URL longue pour l'affichage */
  shortUrl(url: string): string {
    return url?.length > 40 ? url.substring(0, 40) + '…' : url;
  }
}
