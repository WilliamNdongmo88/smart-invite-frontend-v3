import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { AdminAnalyticsService, AnalyticsStats } from '../../../../core/services/admin-analytics.service';

type Period = 'day' | 'week' | 'month';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './admin-analytics.component.html',
  styleUrl:    './admin-analytics.component.scss',
})
export class AdminAnalyticsComponent implements OnInit {
  private readonly svc = inject(AdminAnalyticsService);

  loading = signal(true);
  error   = signal<string | null>(null);
  stats   = signal<AnalyticsStats | null>(null);

  /** Période active pour le graphique visiteurs */
  activePeriod = signal<Period>('day');

  /** Données du graphique selon la période sélectionnée */
  chartData = computed(() => {
    const s = this.stats();
    if (!s) return [];
    switch (this.activePeriod()) {
      case 'week':  return s.uniqueVisitorsByWeek;
      case 'month': return s.uniqueVisitorsByMonth;
      default:      return s.uniqueVisitorsByDay;
    }
  });

  /** Valeur max pour normaliser les barres du graphique */
  chartMax = computed(() => {
    const data = this.chartData();
    if (!data.length) return 1;
    return Math.max(...data.map(d => d.count), 1);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getStats(10).subscribe({
      next:  res  => { this.stats.set(res.data ?? null); this.loading.set(false); },
      error: err  => { this.error.set('Impossible de charger les statistiques'); this.loading.set(false); },
    });
  }

  setPeriod(p: Period): void {
    this.activePeriod.set(p);
  }

  /** Formate les secondes en "Xm Ys" */
  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  /** Barre de pourcentage pour les répartitions */
  pct(count: number, total: number): number {
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }

  /** Total pour byCountry */
  totalCountry = computed(() =>
    this.stats()?.byCountry.reduce((s, r) => s + r.count, 0) ?? 0
  );

  /** Total pour byDevice */
  totalDevice = computed(() =>
    this.stats()?.byDevice.reduce((s, r) => s + r.count, 0) ?? 0
  );

  /** Total pour topPages */
  maxPageViews = computed(() => {
    const pages = this.stats()?.topPages ?? [];
    return Math.max(...pages.map(p => p.views), 1);
  });

  /** Couleur par device */
  deviceColor(device: string): string {
    const map: Record<string, string> = {
      'Desktop': '#c9a84c',
      'Mobile':  '#60a5fa',
      'Tablet':  '#4ade80',
    };
    return map[device] ?? '#888';
  }
}
