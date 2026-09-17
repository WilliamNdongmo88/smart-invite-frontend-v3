import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Referrer, ReferrerRequest } from '../../../../core/models/referrer.model';
import { NotificationMode } from '../../../../core/models/enums.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-admin-referrers',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: 'admin-referrers.component.html',
  styleUrl: 'admin-referrers.component.scss',
})
export class AdminReferrersComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);

  referrers = signal<Referrer[]>([]);
  loading   = signal(true);
  processing = signal<number | null>(null);
  search    = signal('');

  // ── Modale de création ────────────────────────────────────────────
  showCreate  = signal(false);
  creating    = signal(false);
  newName     = signal('');
  newPhone    = signal('');
  newEmail    = signal('');
  newMode     = signal<NotificationMode>('EMAIL');
  copiedCode  = signal<string | null>(null);

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q
      ? this.referrers().filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.email ?? '').toLowerCase().includes(q))
      : this.referrers();
  });

  stats = computed(() => {
    const all = this.referrers();
    return {
      total:     all.length,
      active:    all.filter(r => r.active).length,
      inactive:  all.filter(r => !r.active).length,
      registrations: all.reduce((s, r) => s + r.registrations, 0),
      approvedAmount: all.reduce((s, r) => s + (r.approvedAmount ?? 0), 0),
    };
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminSvc.getReferrers().subscribe({
      next:  (res) => { this.referrers.set(res.data ?? []); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  // ── Création ──────────────────────────────────────────────────────

  openCreate(): void {
    this.newName.set('');
    this.newPhone.set('');
    this.newEmail.set('');
    this.newMode.set('EMAIL');
    this.showCreate.set(true);
  }

  closeCreate(): void { this.showCreate.set(false); }

  updateNewName(v: string)  { this.newName.set(v); }
  updateNewPhone(v: string) { this.newPhone.set(v); }
  updateNewEmail(v: string) { this.newEmail.set(v); }
  updateNewMode(v: string)  { this.newMode.set(v as NotificationMode); }

  canCreate(): boolean {
    const name = this.newName().trim();
    const email = this.newEmail().trim();
    const phone = this.newPhone().trim();
    if (name.length < 2) return false;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
    return !(!email && !phone);
  }

  create(): void {
    if (!this.canCreate()) return;
    this.creating.set(true);

    const req: ReferrerRequest = {
      name: this.newName().trim(),
      notificationMode: this.newMode(),
    };
    const email = this.newEmail().trim();
    const phone = this.newPhone().trim();
    if (email) req.email = email;
    if (phone) req.phone = phone;

    this.adminSvc.createReferrer(req).subscribe({
      next: (res) => {
        this.creating.set(false);
        this.closeCreate();
        this.copyCode(res.data?.code ?? '');
        this.toast.success('Recommandateur créé ! Le code a été copié.');
        this.load();
      },
      error: (err) => {
        this.creating.set(false);
        this.toast.error(err?.error?.message || 'Erreur lors de la création');
      },
    });
  }

  // ── Copies / activation ──────────────────────────────────────────

  copyCode(code: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiedCode.set(code);
        setTimeout(() => this.copiedCode.set(null), 2000);
      });
    }
  }

  toggleActive(ref: Referrer): void {
    this.processing.set(ref.id);
    this.adminSvc.toggleReferrer(ref.id).subscribe({
      next: () => {
        this.toast.success(ref.active ? 'Recommandateur désactivé' : 'Recommandateur activé');
        this.processing.set(null);
        this.load();
      },
      error: (err) => {
        this.processing.set(null);
        this.toast.error(err?.error?.message || 'Erreur');
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  modeIcon(mode: NotificationMode): string {
    return mode === 'WHATSAPP' ? '📱' : mode === 'BOTH' ? '📱✉️' : '✉️';
  }

  modeLabel(mode: NotificationMode): string {
    if (mode === 'WHATSAPP') return 'WhatsApp';
    if (mode === 'BOTH')     return 'Email & WhatsApp';
    return 'Email';
  }

  modeClass(mode: NotificationMode): string {
    return mode === 'WHATSAPP' ? 'ch-wa' : 'ch-email';
  }

  formatAmount(v: number): string {
    return (v ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' XAF';
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  updateSearch(value: string): void { this.search.set(value); }
}