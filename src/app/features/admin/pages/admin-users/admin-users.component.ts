import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OrganizerSummary, UserNewsMessage } from '../../../../core/models/user.model';
import { DatePipe } from '@angular/common';

type ActionType = 'block' | 'unblock' | 'activate' | 'delete';
type Tab = 'users' | 'messages';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe],
  templateUrl: 'admin-users.component.html',
  styleUrl: 'admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);

  // ── Onglet actif ──────────────────────────────────────────────────
  activeTab = signal<Tab>('users');

  // ── Utilisateurs ─────────────────────────────────────────────────
  organizers  = signal<OrganizerSummary[]>([]);
  loading     = signal(true);
  processing  = signal<number | null>(null);
  search      = signal('');

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

  // ── Messages (usernews) ───────────────────────────────────────────
  messages        = signal<UserNewsMessage[]>([]);
  messagesLoading = signal(false);
  msgSearch       = signal('');

  filteredMessages = computed(() => {
    const q = this.msgSearch().toLowerCase();
    return q
      ? this.messages().filter(m =>
          (m.name ?? '').toLowerCase().includes(q) ||
          (m.message ?? '').toLowerCase().includes(q) ||
          (m.replyContact ?? '').toLowerCase().includes(q))
      : this.messages();
  });

  // ── Modale de réponse ─────────────────────────────────────────────
  replyTarget  = signal<UserNewsMessage | null>(null);
  replyText    = signal('');
  replySending = signal(false);

  ngOnInit(): void { this.loadUsers(); }

  // ── Chargement ───────────────────────────────────────────────────

  loadUsers(): void {
    this.loading.set(true);
    this.adminSvc.getAllOrganizers().subscribe({
      next:  (res) => { this.organizers.set(res.data ?? []); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  loadMessages(): void {
    this.messagesLoading.set(true);
    this.adminSvc.getAllContacts().subscribe({
      next:  (res) => { this.messages.set(res.data ?? []); this.messagesLoading.set(false); },
      error: ()    => this.messagesLoading.set(false),
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'messages' && this.messages().length === 0) {
      this.loadMessages();
    }
  }

  load(): void {
    this.loadUsers();
    if (this.activeTab() === 'messages') this.loadMessages();
  }

  // ── Gestion utilisateurs ─────────────────────────────────────────

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
      next:  () => { this.toast.success(msgs[action]); this.loadUsers(); this.processing.set(null); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.processing.set(null); },
    });
  }

  // ── Modale de réponse ─────────────────────────────────────────────

  openReply(msg: UserNewsMessage): void {
    this.replyTarget.set(msg);
    this.replyText.set('');
  }

  closeReply(): void {
    this.replyTarget.set(null);
    this.replyText.set('');
  }

  sendReply(): void {
    const target = this.replyTarget();
    const text   = this.replyText().trim();
    if (!target || !text) return;

    this.replySending.set(true);
    this.adminSvc.replyToContact(target.id, text).subscribe({
      next: () => {
        this.toast.success('Réponse envoyée avec succès !');
        this.replySending.set(false);
        this.closeReply();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de l\'envoi');
        this.replySending.set(false);
      },
    });
  }

  updateReplyText(value: string): void { this.replyText.set(value); }

  // ── Helpers ──────────────────────────────────────────────────────

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

  channelIcon(channel: string): string {
    return channel === 'WHATSAPP' ? '📱' : '✉️';
  }

  channelLabel(channel: string): string {
    return channel === 'WHATSAPP' ? 'WhatsApp' : 'Email';
  }

  channelClass(channel: string): string {
    return channel === 'WHATSAPP' ? 'ch-wa' : 'ch-email';
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(dt: string): string {
    return new Date(dt).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  actionLabel(action: ActionType): string {
    const map: Record<ActionType, string> = {
      block: 'Bloquer', unblock: 'Débloquer', activate: 'Activer', delete: 'Supprimer',
    };
    return map[action];
  }

  updateSearch(value: string): void { this.search.set(value); }
  updateMsgSearch(value: string): void { this.msgSearch.set(value); }
}
