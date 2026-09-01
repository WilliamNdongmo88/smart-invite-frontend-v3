import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { Payment, PaymentPlan } from '../../../core/models/payment.model';
import { Event } from '../../../core/models/event.model';
import { PAYMENT_STATUS_LABELS, PaymentStatus } from '../../../core/models/enums.model';

type Tab = 'subscribe' | 'history';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: 'payments.component.html',
  styleUrl: 'payments.component.scss',
})
export class PaymentsComponent implements OnInit {
  private readonly svc      = inject(PaymentService);
  private readonly eventSvc = inject(EventService);
  private readonly fb       = inject(FormBuilder);
  private readonly toast    = inject(ToastService);

  // ── Tabs ──
  activeTab = signal<Tab>('subscribe');

  // ── Events ──
  events  = signal<Event[]>([]);
  loadingEvents = signal(true);

  // ── Plan ──
  plan         = signal<PaymentPlan | null>(null);
  loadingPlan  = signal(false);
  private quotaSubject = new Subject<number>();

   //── Coordonnées ──
  omNumber = '+237655002318';
  momoNumber = '+237682933424';
  cardNumber = '10005 00059 00000108383 95';

  // ── Subscribe form ──
  form = this.fb.group({
    eventId: [null as number | null, Validators.required],
    quota:   [100, [Validators.required, Validators.min(1)]],
  });

  subscribing = signal(false);
  pendingPayment = signal<Payment | null>(null);

  // ── Proof upload ──
  proofFile    = signal<File | null>(null);
  proofPreview = signal<string | null>(null);
  uploadingProof = signal(false);

  // ── History ──
  history        = signal<Payment[]>([]);
  loadingHistory = signal(false);
  historyTab     = signal<'ALL' | PaymentStatus>('ALL');

  readonly statusLabels = PAYMENT_STATUS_LABELS;

  readonly historyTabs: { key: 'ALL' | PaymentStatus; label: string }[] = [
    { key: 'ALL',          label: 'Tous' },
    { key: 'PENDING',      label: 'En attente' },
    { key: 'UNDER_REVIEW', label: 'En vérification' },
    { key: 'APPROVED',     label: 'Approuvés' },
    { key: 'REJECTED',     label: 'Rejetés' },
  ];

  filteredHistory = computed(() => {
    const tab = this.historyTab();
    return tab === 'ALL' ? this.history() : this.history().filter(p => p.status === tab);
  });

  readonly UNIT_PRICE = 52;

  computedTotal = computed(() => {
    const q = Number(this.form.value.quota) || 0;
    return q * this.UNIT_PRICE;
  });

  ngOnInit(): void {
    this.loadEvents();
    this.loadHistory();

    // Debounce quota changes → fetch plan
    this.quotaSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        this.loadingPlan.set(true);
        return this.svc.getPlan(q);
      })
    ).subscribe({
      next: (res) => { this.plan.set(res.data!); this.loadingPlan.set(false); },
      error: () => { this.loadingPlan.set(false); },
    });

    // Initial plan fetch
    this.quotaSubject.next(100);

    // Watch quota changes
    this.form.get('quota')!.valueChanges.subscribe(v => {
      const q = Number(v);
      if (q > 0) this.quotaSubject.next(q);
    });
  }

  private loadEvents(): void {
    this.eventSvc.findAll().subscribe({
      next: (res) => { this.events.set(res.data ?? []); this.loadingEvents.set(false); },
      error: () => this.loadingEvents.set(false),
    });
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.svc.getHistory().subscribe({
      next: (res) => { this.history.set(res.data ?? []); this.loadingHistory.set(false); },
      error: () => this.loadingHistory.set(false),
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'history') this.loadHistory();
  }

  setHistoryTab(tab: 'ALL' | PaymentStatus): void { this.historyTab.set(tab); }

  // ── Subscribe ──
  subscribe(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.subscribing.set(true);
    const v = this.form.value;
    this.svc.subscribe({ eventId: v.eventId!, quota: v.quota! }).subscribe({
      next: (res) => {
        this.pendingPayment.set(res.data!);
        this.subscribing.set(false);
        this.toast.success('Souscription initiée ! Uploadez votre preuve de paiement.');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de la souscription');
        this.subscribing.set(false);
      },
    });
  }

  // ── Proof ──
  onProofChange(event: globalThis.Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      this.toast.error('Format accepté : JPG, PNG, WEBP ou PDF');
      return;
    }
    this.proofFile.set(file);
    this.proofPreview.set(file.name);
  }

  submitProof(): void {
    const payment = this.pendingPayment();
    const file = this.proofFile();
    if (!payment || !file) return;
    this.uploadingProof.set(true);
    this.svc.submitProof(payment.id, file).subscribe({
      next: (res) => {
        this.toast.success('Preuve envoyée ! Votre paiement est en cours de vérification.');
        this.pendingPayment.set(null);
        this.proofFile.set(null);
        this.proofPreview.set(null);
        this.uploadingProof.set(false);
        this.loadHistory();
        this.setTab('history');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de l\'upload');
        this.uploadingProof.set(false);
      },
    });
  }

  cancelProof(): void {
    this.pendingPayment.set(null);
    this.proofFile.set(null);
    this.proofPreview.set(null);
  }

  // ── Helpers ──
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

  formatAmount(amount: number): string {
    return amount.toLocaleString('fr-FR') + ' XAF';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  // ── Copie dans le presse-papiers ──
  copied = signal(false);
  private copyTimeout: ReturnType<typeof setTimeout> | null = null;

  copy(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      if (this.copyTimeout) clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => {});
  }
}
