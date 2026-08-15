import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OrganizerSummary } from '../../../../core/models/user.model';

type ActionType = 'block' | 'unblock' | 'activate' | 'delete';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: 'admin-users.component.html',
  styleUrl: 'admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);

  organizers = signal<OrganizerSummary[]>([]);
  loading    = signal(true);
  processing = signal<number | null>(null);
  search     = signal('');

  // Confirm modal
  confirmUser   = signal<OrganizerSummary | null>(null);
  confirmAction = signal<ActionType | null>(null);

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q
      ? this.organizers().filter(o =>
          o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q))
      : this.organizers();
  });

  stats = computed(() => {
    const all = this.organizers();
    return {
      total:    all.length,
      active:   all.filter(o => o.isActive && !o.isBlocked).length,
      blocked:  all.filter(o => o.isBlocked).length,
      inactive: all.filter(o => !o.isActive && !o.isBlocked).length,
    };
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.adminSvc.getAllOrganizers().subscribe({
      next: (res) => { this.organizers.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openConfirm(user: OrganizerSummary, action: ActionType): void {
    this.confirmUser.set(user);
    this.confirmAction.set(action);
  }

  closeConfirm(): void {
    this.confirmUser.set(null);
    this.confirmAction.set(null);
  }

  confirm(): void {
    const user   = this.confirmUser();
    const action = this.confirmAction();
    if (!user || !action) return;
    this.closeConfirm();
    this.processing.set(user.id);

    const req$ = action === 'block'    ? this.adminSvc.blockUser(user.id)
               : action === 'unblock'  ? this.adminSvc.unblockUser(user.id)
               : action === 'activate' ? this.adminSvc.activateUser(user.id)
               :                         this.adminSvc.deleteUser(user.id);

    const msgs: Record<ActionType, string> = {
      block:    'Utilisateur bloqué',
      unblock:  'Utilisateur débloqué',
      activate: 'Utilisateur activé',
      delete:   'Utilisateur supprimé',
    };

    req$.subscribe({
      next: () => { this.toast.success(msgs[action]); this.load(); this.processing.set(null); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.processing.set(null); },
    });
  }

  statusLabel(o: OrganizerSummary): string {
    if (o.isBlocked)  return 'Bloqué';
    if (!o.isActive)  return 'Inactif';
    return 'Actif';
  }

  statusClass(o: OrganizerSummary): string {
    if (o.isBlocked)  return 'badge-blocked';
    if (!o.isActive)  return 'badge-inactive';
    return 'badge-active';
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  actionLabel(action: ActionType): string {
    const map: Record<ActionType, string> = {
      block: 'Bloquer', unblock: 'Débloquer', activate: 'Activer', delete: 'Supprimer',
    };
    return map[action];
  }

  updateSearch(value: string): void { this.search.set(value); }
}
