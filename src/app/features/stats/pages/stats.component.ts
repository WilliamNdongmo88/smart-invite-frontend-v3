import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { Payment } from '../../../core/models/payment.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'stats.component.html',
  styleUrl: 'stats.component.scss',
})
export class StatsComponent implements OnInit {
  private readonly paymentSvc = inject(PaymentService);

  payments = signal<Payment[]>([]);
  loading  = signal(true);

  readonly year = new Date().getFullYear();

  // ── Statistiques paiements ──────────────────────────────────────
  readonly paymentStats = computed(() => {
    const all      = this.payments();
    const approved = all.filter(p => p.status === 'APPROVED');
    const pending  = all.filter(p => p.status === 'PENDING' || p.status === 'UNDER_REVIEW');
    const rejected = all.filter(p => p.status === 'REJECTED');

    const totalRevenue    = approved.reduce((s, p) => s + (p.amount ?? 0), 0);
    const totalQuota      = approved.reduce((s, p) => s + (p.quota ?? 0), 0);
    const totalSent       = approved.reduce((s, p) => s + (p.sentInvitations ?? 0), 0);
    const usageRate       = totalQuota > 0 ? Math.round((totalSent / totalQuota) * 100) : 0;
    const avgAmount       = approved.length > 0 ? Math.round(totalRevenue / approved.length) : 0;
    const remaining       = totalQuota - totalSent;

    // Répartition par mois (6 derniers mois)
    const now = new Date();
    const months: { label: string; count: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const inMonth = approved.filter(p => {
        const pd = new Date(p.createdAt);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      });
      months.push({
        label,
        count:   inMonth.length,
        revenue: inMonth.reduce((s, p) => s + (p.amount ?? 0), 0),
      });
    }
    const maxRevenue = Math.max(...months.map(m => m.revenue), 1);

    return {
      total: all.length, approved: approved.length,
      pending: pending.length, rejected: rejected.length,
      totalRevenue, totalQuota, totalSent, usageRate,
      avgAmount, remaining, months, maxRevenue,
    };
  });

  ngOnInit(): void {
    this.paymentSvc.getHistory().subscribe({
      next: (res) => { this.payments.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fmt(n: number): string { return n.toLocaleString('fr-FR'); }
  fmtXAF(n: number): string { return n.toLocaleString('fr-FR') + ' XAF'; }
  barH(v: number, max: number): number { return max > 0 ? Math.round((v / max) * 100) : 0; }
  readonly Math = Math;
}
