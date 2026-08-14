import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { GuestService } from '../../../core/services/guest.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { Invitation } from '../../../core/models/invitation.model';
import { Guest } from '../../../core/models/guest.model';
import { Event } from '../../../core/models/event.model';
import { InvitationStatus, RSVP_STATUS_LABELS } from '../../../core/models/enums.model';

type FilterTab = 'ALL' | InvitationStatus;

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'invitations.component.html',
  styleUrl: 'invitations.component.scss',
})
export class InvitationsComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly svc        = inject(InvitationService);
  private readonly guestSvc   = inject(GuestService);
  private readonly eventSvc   = inject(EventService);
  private readonly toast      = inject(ToastService);

  eventId = 0;
  event        = signal<Event | null>(null);
  invitations  = signal<Invitation[]>([]);
  guests       = signal<Guest[]>([]);
  loading      = signal(true);
  bulkLoading  = signal(false);

  // ── Tabs ──
  activeTab = signal<FilterTab>('ALL');
  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL',     label: 'Toutes' },
    { key: 'ACTIVE',  label: 'Actives' },
    { key: 'USED',    label: 'Utilisées' },
    { key: 'REVOKED', label: 'Révoquées' },
  ];

  filtered = computed(() => {
    const tab = this.activeTab();
    const list = this.invitations();
    return tab === 'ALL' ? list : list.filter(i => i.status === tab);
  });

  counts = computed(() => {
    const list = this.invitations();
    return {
      ALL:     list.length,
      ACTIVE:  list.filter(i => i.status === 'ACTIVE').length,
      USED:    list.filter(i => i.status === 'USED').length,
      REVOKED: list.filter(i => i.status === 'REVOKED').length,
    };
  });

  // ── Guests sans invitation ──
  guestsWithoutInvitation = computed(() => {
    const invitedGuestIds = new Set(this.invitations().map(i => i.guestId));
    return this.guests().filter(g => !invitedGuestIds.has(g.id));
  });

  // ── Selection bulk ──
  selectedGuestIds = signal<Set<number>>(new Set());

  allGuestsSelected = computed(() => {
    const without = this.guestsWithoutInvitation();
    return without.length > 0 && without.every(g => this.selectedGuestIds().has(g.id));
  });

  selectedCount = computed(() => this.selectedGuestIds().size);

  // ── Modals ──
  showBulkPanel    = signal(false);
  confirmDeleteId  = signal<number | null>(null);
  deletingId       = signal<number | null>(null);
  bulkResult       = signal<{ generated: number; skipped: number } | null>(null);

  readonly rsvpLabels = RSVP_STATUS_LABELS;

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId) { this.router.navigate(['/events']); return; }

    this.eventSvc.findById(this.eventId).subscribe({
      next: (res) => this.event.set(res.data!),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list(this.eventId).subscribe({
      next: (res) => {
        this.invitations.set(res.data ?? []);
        this.loading.set(false);
        this.loadGuests();
      },
      error: () => { this.toast.error('Erreur de chargement'); this.loading.set(false); },
    });
  }

  private loadGuests(): void {
    this.guestSvc.list(this.eventId, { size: 500 }).subscribe({
      next: (res) => this.guests.set(res.data?.content ?? []),
    });
  }

  // ── Tabs ──
  setTab(tab: FilterTab): void { this.activeTab.set(tab); }

  // ── Bulk panel ──
  openBulkPanel(): void {
    this.selectedGuestIds.set(new Set());
    this.bulkResult.set(null);
    this.showBulkPanel.set(true);
  }
  closeBulkPanel(): void { this.showBulkPanel.set(false); }

  toggleGuest(id: number): void {
    const s = new Set(this.selectedGuestIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedGuestIds.set(s);
  }

  toggleAllGuests(): void {
    if (this.allGuestsSelected()) {
      this.selectedGuestIds.set(new Set());
    } else {
      this.selectedGuestIds.set(new Set(this.guestsWithoutInvitation().map(g => g.id)));
    }
  }

  isGuestSelected(id: number): boolean { return this.selectedGuestIds().has(id); }

  bulkGenerate(): void {
    const ids = Array.from(this.selectedGuestIds());
    if (ids.length === 0) { this.toast.error('Sélectionnez au moins un invité'); return; }
    this.bulkLoading.set(true);
    this.svc.bulkGenerate({ eventId: this.eventId, guestIds: ids }).subscribe({
      next: (res) => {
        const d = res.data!;
        this.bulkResult.set({ generated: d.generated, skipped: d.skipped });
        this.bulkLoading.set(false);
        this.toast.success(`${d.generated} invitation(s) générée(s)`);
        this.load();
      },
      error: () => { this.toast.error('Erreur lors de la génération'); this.bulkLoading.set(false); },
    });
  }

  // ── Delete ──
  askDelete(id: number): void { this.confirmDeleteId.set(id); }
  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId()!;
    this.confirmDeleteId.set(null);
    this.deletingId.set(id);
    this.svc.delete(id).subscribe({
      next: () => {
        this.invitations.update(list => list.filter(i => i.id !== id));
        this.deletingId.set(null);
        this.toast.success('Invitation supprimée');
      },
      error: () => { this.deletingId.set(null); this.toast.error('Erreur lors de la suppression'); },
    });
  }

  // ── Helpers ──
  statusClass(status: InvitationStatus): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', USED: 'badge-used', REVOKED: 'badge-revoked',
    };
    return map[status] ?? '';
  }

  statusLabel(status: InvitationStatus): string {
    const map: Record<string, string> = {
      ACTIVE: 'Active', USED: 'Utilisée', REVOKED: 'Révoquée',
    };
    return map[status] ?? status;
  }

  rsvpClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'rsvp-pending', CONFIRMED: 'rsvp-confirmed',
      DECLINED: 'rsvp-declined', PRESENT: 'rsvp-present',
    };
    return map[status] ?? '';
  }

  guestOf(inv: Invitation): Guest | undefined {
    return this.guests().find(g => g.id === inv.guestId);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  copyLink(token: string): void {
    const url = `${window.location.origin}/invitations/${token}/rsvp`;
    navigator.clipboard.writeText(url).then(() => this.toast.success('Lien copié !'));
  }
}
