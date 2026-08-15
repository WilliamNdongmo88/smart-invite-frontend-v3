import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Payment } from '../../../../core/models/payment.model';
import { PAYMENT_STATUS_LABELS, PaymentStatus } from '../../../../core/models/enums.model';

type StatusFilter = 'ALL' | PaymentStatus;

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: 'admin-payments.component.html',
  styleUrl: 'admin-payments.component.scss',
})
export class AdminPaymentsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly paymentSvc = inject(PaymentService);
  private readonly toast = inject(ToastService);

  payments     = signal<Payment[]>([]);
  loading      = signal(true);
  activeTab    = signal<StatusFilter>('ALL');
  reviewing    = signal<number | null>(null);

  // Reject modal
  rejectId     = signal<number | null>(null);
  rejectReason = '';

  readonly tabs: { key: StatusFilter; label: string }[] = [
    { key: 'ALL',          label: 'Tous' },
    { key: 'UNDER_REVIEW', label: 'En vérification' },
    { key: 'PENDING',      label: 'En attente' },
    { key: 'APPROVED',     label: 'Approuvés' },
    { key: 'REJECTED',     label: 'Rejetés' },
  ];

  readonly statusLabels = PAYMENT_STATUS_LABELS;

  filtered = computed(() => {
    const tab = this.activeTab();
    return tab === 'ALL'
      ? this.payments()
      : this.payments().filter(p => p.status === tab);
  });

  stats = computed(() => {
    const all = this.payments();
    return {
      total:       all.length,
      underReview: all.filter(p => p.status === 'UNDER_REVIEW').length,
      approved:    all.filter(p => p.status === 'APPROVED').length,
      rejected:    all.filter(p => p.status === 'REJECTED').length,
    };
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminSvc.getAllPayments().subscribe({
      next: (res) => { this.payments.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: StatusFilter): void { this.activeTab.set(tab); }

  approve(id: number): void {
    this.reviewing.set(id);
    this.paymentSvc.reviewPayment(id, { approved: true }).subscribe({
      next: () => { this.toast.success('Paiement approuvé ✅'); this.load(); this.reviewing.set(null); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.reviewing.set(null); },
    });
  }

  openReject(id: number): void { this.rejectId.set(id); this.rejectReason = ''; }
  closeReject(): void { this.rejectId.set(null); this.rejectReason = ''; }

  confirmReject(): void {
    const id = this.rejectId();
    if (!id || !this.rejectReason.trim()) return;
    this.reviewing.set(id);
    this.paymentSvc.reviewPayment(id, { approved: false, rejectionReason: this.rejectReason }).subscribe({
      next: () => {
        this.toast.success('Paiement rejeté');
        this.closeReject();
        this.load();
        this.reviewing.set(null);
      },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.reviewing.set(null); },
    });
  }

  statusClass(status: PaymentStatus): string {
    const map: Record<string, string> = {
      PENDING:      'badge-pending',
      UNDER_REVIEW: 'badge-review',
      APPROVED:     'badge-approved',
      REJECTED:     'badge-rejected',
    };
    return map[status] ?? '';
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatAmount(n: number): string { return n.toLocaleString('fr-FR') + ' XAF'; }

  countByStatus(status: StatusFilter): number {
    if (status === 'ALL') return this.payments().length;
    return this.payments().filter(p => p.status === status).length;
  }
}
