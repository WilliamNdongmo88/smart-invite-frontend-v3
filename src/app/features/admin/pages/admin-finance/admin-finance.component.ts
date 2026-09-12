import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminFinanceService, FinanceStats, PeriodAmount } from '../../../../core/services/admin-finance.service';

type ChartMode = 'month' | 'year';

@Component({
  selector: 'app-admin-finance',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './admin-finance.component.html',
  styleUrl:    './admin-finance.component.scss',
})
export class AdminFinanceComponent implements OnInit {

  private readonly svc = inject(AdminFinanceService);

  loading = signal(true);
  error   = signal<string | null>(null);
  stats   = signal<FinanceStats | null>(null);

  /** Mode du graphique : par mois ou par année */
  chartMode = signal<ChartMode>('month');

  /** Données du graphique selon le mode actif */
  chartData = computed<PeriodAmount[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return this.chartMode() === 'year' ? s.byYear : s.byMonth;
  });

  /** Valeur max pour normaliser les barres */
  chartMax = computed(() => {
    const data = this.chartData();
    if (!data.length) return 1;
    return Math.max(...data.map(d => d.amount), 1);
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getStats().subscribe({
      next:  res => { this.stats.set(res.data ?? null); this.loading.set(false); },
      error: ()  => { this.error.set('Impossible de charger les statistiques financières'); this.loading.set(false); },
    });
  }

  setMode(m: ChartMode): void { this.chartMode.set(m); }

  // ── Formatage ──────────────────────────────────────────────────────────────

  /** Formate un montant en XAF avec séparateur de milliers */
  fmt(n: number | undefined | null): string {
    if (n == null) return '0 XAF';
    return n.toLocaleString('fr-FR') + ' XAF';
  }

  /** Formate le taux de croissance avec signe */
  fmtGrowth(pct: number | undefined | null): string {
    if (pct == null) return '—';
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  }

  /** Classe CSS pour la tendance (hausse / baisse / neutre) */
  growthClass(pct: number | undefined | null): string {
    if (pct == null || pct === 0) return 'neutral';
    return pct > 0 ? 'up' : 'down';
  }

  /** Hauteur de barre en % (min 2% pour rester visible) */
  barHeight(amount: number): number {
    const max = this.chartMax();
    if (!max) return 0;
    return Math.max((amount / max) * 100, amount > 0 ? 2 : 0);
  }

  /** Compte total du mois sélectionné (depuis countByMonth) */
  countForPeriod(period: string): number {
    const s = this.stats();
    if (!s) return 0;
    return s.countByMonth.find(c => c.period === period)?.count ?? 0;
  }
}
