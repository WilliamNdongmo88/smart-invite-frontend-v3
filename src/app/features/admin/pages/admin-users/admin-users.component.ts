import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminEventDetail, EventSummary, OrganizerSummary, UserNewsMessage } from '../../../../core/models/user.model';
import { EventType } from '../../../../core/models/enums.model';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

type ActionType = 'block' | 'unblock' | 'activate' | 'delete';
type Tab = 'users' | 'messages';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
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
  msgProcessing   = signal<number | null>(null);
  deleteMsgId     = signal<number | null>(null);
  deletingMsg     = signal(false);

  filteredMessages = computed(() => {
    const q = this.msgSearch().toLowerCase();
    return q
      ? this.messages().filter(m =>
          (m.name ?? '').toLowerCase().includes(q) ||
          (m.message ?? '').toLowerCase().includes(q) ||
          (m.replyContact ?? '').toLowerCase().includes(q))
      : this.messages();
  });

  unreadCount = computed(() => this.messages().filter(m => !m.isRead).length);

  // ── Modale de réponse ─────────────────────────────────────────────
  replyTarget  = signal<UserNewsMessage | null>(null);
  replyText    = signal('');
  replySending = signal(false);

  // ── Détail d'un événement ────────────────────────────────────────
  detail = signal<AdminEventDetail | null>(null);
  detailLoading = signal(false);
  detailError = signal('');

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

  // ── Détail d'un événement ─────────────────────────────────────────

  openDetail(ev: EventSummary): void {
    this.detail.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);
    this.adminSvc.getEventDetail(ev.id).subscribe({
      next: (res) => { this.detail.set(res.data ?? null); this.detailLoading.set(false); },
      error: ()    => { this.detailLoading.set(false); this.detailError.set('Erreur lors du chargement'); },
    });
  }

  closeDetail(): void {
    this.detail.set(null);
    this.detailLoading.set(false);
    this.detailError.set('');
  }

  /** Lien vers la page immersive de l'événement en mode preview */
  eventDetailLink(d: AdminEventDetail): string {
    const slug = this.typeSlug(d.type);
    return `/events/${d.eventId}/${slug}?preview=true`;
  }

  typeSlug(type: EventType): string {
    switch (type) {
      case 'MARIAGE':    return 'wedding';
      case 'CONFERENCE': return 'conference';
      case 'GALA':       return 'gala';
      case 'CEREMONIE':  return 'ceremonie';
      default:           return 'wedding';
    }
  }

  typeLabel(type: EventType): string {
    switch (type) {
      case 'MARIAGE':    return 'Mariage';
      case 'CONFERENCE': return 'Conférence';
      case 'GALA':       return 'Gala';
      case 'CEREMONIE':  return 'Cérémonie';
      default:           return type;
    }
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

  // ── Marquer comme lu ─────────────────────────────────────────────

  markRead(msg: UserNewsMessage): void {
    if (msg.isRead) return;
    this.msgProcessing.set(msg.id);
    this.adminSvc.markContactRead(msg.id).subscribe({
      next: (res) => {
        this.messages.update(list =>
          list.map(m => m.id === msg.id ? { ...m, isRead: true } : m)
        );
        this.msgProcessing.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur');
        this.msgProcessing.set(null);
      },
    });
  }

  // ── Suppression message ───────────────────────────────────────────

  confirmDeleteMsg(id: number): void { this.deleteMsgId.set(id); }
  cancelDeleteMsg(): void            { this.deleteMsgId.set(null); }

  doDeleteMsg(): void {
    const id = this.deleteMsgId();
    if (!id) return;
    this.deletingMsg.set(true);
    this.adminSvc.deleteContact(id).subscribe({
      next: () => {
        this.messages.update(list => list.filter(m => m.id !== id));
        this.toast.success('Message supprimé');
        this.deleteMsgId.set(null);
        this.deletingMsg.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de la suppression');
        this.deletingMsg.set(false);
      },
    });
  }

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

  formatDateTime(dt?: string): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatAmount(amount?: number): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' XAF';
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
