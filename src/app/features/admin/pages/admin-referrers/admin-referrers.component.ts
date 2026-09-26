import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Referrer, ReferrerRequest } from '../../../../core/models/referrer.model';
import { NotificationMode } from '../../../../core/models/enums.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DialCodeSelectComponent } from '../../../../shared/components/dial-code-select/dial-code-select.component';

@Component({
  selector: 'app-admin-referrers',
  standalone: true,
  imports: [FormsModule, DialCodeSelectComponent, TranslatePipe],
  templateUrl: 'admin-referrers.component.html',
  styleUrl: 'admin-referrers.component.scss',
})
export class AdminReferrersComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);

  referrers  = signal<Referrer[]>([]);
  loading    = signal(true);
  processing = signal<number | null>(null);
  search     = signal('');

  // ── Modale de création ────────────────────────────────────────────
  showCreate  = signal(false);
  creating    = signal(false);
  newName     = signal('');
  newDialCode = signal('+237');
  newPhone    = signal('');
  newEmail    = signal('');
  newMode     = signal<NotificationMode>('WHATSAPP');
  copiedCode  = signal<string | null>(null);

  // ── Modale d'édition ──────────────────────────────────────────────
  showEdit     = signal(false);
  editing      = signal(false);
  editId       = signal<number | null>(null);
  editName     = signal('');
  editDialCode = signal('+237');
  editPhone    = signal('');
  editEmail    = signal('');
  editMode     = signal<NotificationMode>('WHATSAPP');

  // ── Suppression ───────────────────────────────────────────────────
  deleteId  = signal<number | null>(null);
  deleting  = signal(false);

  // ── Computed ──────────────────────────────────────────────────────
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
      total:          all.length,
      active:         all.filter(r => r.active).length,
      inactive:       all.filter(r => !r.active).length,
      registrations:  all.reduce((s, r) => s + r.registrations, 0),
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
    this.newDialCode.set('+237');
    this.newPhone.set('');
    this.newEmail.set('');
    this.newMode.set('WHATSAPP');
    this.showCreate.set(true);
  }

  closeCreate(): void { this.showCreate.set(false); }

  canCreate(): boolean {
    const name  = this.newName().trim();
    const email = this.newEmail().trim();
    const phone = this.newPhone().trim();
    if (name.length < 2) return false;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
    // Si mode EMAIL ou BOTH → email obligatoire ; sinon phone obligatoire
    const mode = this.newMode();
    if ((mode === 'EMAIL' || mode === 'BOTH') && !email) return false;
    if ((mode === 'WHATSAPP' || mode === 'BOTH') && !phone) return false;
    return true;
  }

  create(): void {
    if (!this.canCreate()) return;
    this.creating.set(true);

    const email = this.newEmail().trim();
    const local = this.newPhone().trim();
    const phone = local ? `${this.newDialCode()}${local}` : undefined;

    const req: ReferrerRequest = {
      name:             this.newName().trim(),
      notificationMode: this.newMode(),
      ...(email && { email }),
      ...(phone && { phone }),
    };

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

  // ── Édition ──────────────────────────────────────────────────────

  openEdit(ref: Referrer): void {
    this.editId.set(ref.id);
    this.editName.set(ref.name);
    this.editEmail.set(ref.email ?? '');
    this.editMode.set(ref.notificationMode);

    // Séparer indicatif + numéro local si un numéro complet est stocké
    const fullPhone = ref.phone ?? '';
    if (fullPhone.startsWith('+')) {
      // Trouver l'indicatif le plus long qui correspond
      const sorted = ['+237', '+33', '+1', '+44', '+49', '+34', '+39', '+32', '+41',
                      '+225', '+221', '+224', '+223', '+226', '+228', '+229', '+236',
                      '+241', '+242', '+243', '+244', '+245', '+246', '+248', '+252'];
      const match = sorted.find(dc => fullPhone.startsWith(dc));
      if (match) {
        this.editDialCode.set(match);
        this.editPhone.set(fullPhone.slice(match.length));
      } else {
        this.editDialCode.set('+237');
        this.editPhone.set(fullPhone.replace(/^\+\d{1,4}/, ''));
      }
    } else {
      this.editDialCode.set('+237');
      this.editPhone.set(fullPhone);
    }

    this.showEdit.set(true);
  }

  closeEdit(): void { this.showEdit.set(false); }

  canEdit(): boolean {
    const name  = this.editName().trim();
    const email = this.editEmail().trim();
    const phone = this.editPhone().trim();
    if (name.length < 2) return false;
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
    const mode = this.editMode();
    if ((mode === 'EMAIL' || mode === 'BOTH') && !email) return false;
    if ((mode === 'WHATSAPP' || mode === 'BOTH') && !phone) return false;
    return true;
  }

  saveEdit(): void {
    const id = this.editId();
    if (!id || !this.canEdit()) return;
    this.editing.set(true);

    const email = this.editEmail().trim();
    const local = this.editPhone().trim();
    const phone = local ? `${this.editDialCode()}${local}` : undefined;

    const req: ReferrerRequest = {
      name:             this.editName().trim(),
      notificationMode: this.editMode(),
      ...(email && { email }),
      ...(phone && { phone }),
    };

    this.adminSvc.updateReferrer(id, req).subscribe({
      next: () => {
        this.editing.set(false);
        this.closeEdit();
        this.toast.success('Recommandateur mis à jour avec succès');
        this.load();
      },
      error: (err) => {
        this.editing.set(false);
        this.toast.error(err?.error?.message || 'Erreur lors de la modification');
      },
    });
  }

  // ── Suppression ──────────────────────────────────────────────────

  confirmDelete(id: number): void { this.deleteId.set(id); }
  cancelDelete(): void            { this.deleteId.set(null); }

  doDelete(): void {
    const id = this.deleteId();
    if (!id) return;
    this.deleting.set(true);
    this.adminSvc.deleteReferrer(id).subscribe({
      next: () => {
        this.toast.success('Recommandateur supprimé');
        this.deleteId.set(null);
        this.deleting.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de la suppression');
        this.deleting.set(false);
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
    return mode === 'WHATSAPP' ? 'ch-wa' : mode === 'BOTH' ? 'ch-both' : 'ch-email';
  }

  /** Indique si le champ email doit être affiché selon le mode choisi */
  showEmailField(mode: NotificationMode): boolean {
    return mode === 'EMAIL' || mode === 'BOTH';
  }

  formatAmount(v: number): string {
    return (v ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' XAF';
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  updateSearch(value: string): void { this.search.set(value); }
}
