import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GuestService } from '../../../core/services/guest.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { Guest } from '../../../core/models/guest.model';
import { Event } from '../../../core/models/event.model';
import { RsvpStatus, NotificationMode, RSVP_STATUS_LABELS, NOTIFICATION_MODE_LABELS } from '../../../core/models/enums.model';

type RsvpTab = 'ALL' | RsvpStatus;

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: 'guests.component.html',
  styleUrl: 'guests.component.scss',
})
export class GuestsComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly fb       = inject(FormBuilder);
  private readonly svc      = inject(GuestService);
  private readonly eventSvc = inject(EventService);
  private readonly toast    = inject(ToastService);

  // ── State ──
  eventId = 0;
  event   = signal<Event | null>(null);
  guests  = signal<Guest[]>([]);
  loading = signal(true);
  saving  = signal(false);
  reminderLoading = signal<number | null>(null);

  // ── Pagination ──
  page         = signal(0);
  totalPages   = signal(0);
  totalElements = signal(0);
  readonly PAGE_SIZE = 15;

  // ── Filters ──
  activeTab  = signal<RsvpTab>('ALL');
  searchTerm = signal('');
  private searchTimer: any;

  // ── Selection ──
  selected = signal<Set<number>>(new Set());

  // ── Modals ──
  showForm       = signal(false);
  editingGuest   = signal<Guest | null>(null);
  confirmDeleteId = signal<number | null>(null);
  confirmBulkDelete = signal(false);
  confirmReminderId = signal<number | null>(null);

  // ── Labels ──
  readonly rsvpLabels = RSVP_STATUS_LABELS;
  readonly notifLabels = NOTIFICATION_MODE_LABELS;

  readonly tabs: { key: RsvpTab; label: string }[] = [
    { key: 'ALL',       label: 'Tous' },
    { key: 'PENDING',   label: 'En attente' },
    { key: 'CONFIRMED', label: 'Confirmés' },
    { key: 'DECLINED',  label: 'Refusés' },
    { key: 'PRESENT',   label: 'Présents' },
  ];

  readonly notifOptions: { key: NotificationMode; label: string }[] = [
    { key: 'EMAIL',    label: 'Email' },
    { key: 'WHATSAPP', label: 'WhatsApp' },
    { key: 'BOTH',     label: 'Email & WhatsApp' },
  ];

  // ── Form ──
  form = this.fb.group({
    fullName:         ['', [Validators.required, Validators.minLength(2)]],
    email:            [''],
    phoneNumber:      [''],
    notificationMode: ['EMAIL' as NotificationMode],
    tableNumber:      [null as number | null],
  });

  // ── Computed ──
  allSelected = computed(() => {
    const g = this.guests();
    return g.length > 0 && g.every(x => this.selected().has(x.id));
  });

  selectedCount = computed(() => this.selected().size);

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
    const tab = this.activeTab();
    this.svc.list(this.eventId, {
      page:   this.page(),
      size:   this.PAGE_SIZE,
      search: this.searchTerm() || undefined,
      rsvp:   tab !== 'ALL' ? tab : undefined,
    }).subscribe({
      next: (res) => {
        const p = res.data!;
        this.guests.set(p.content);
        this.totalPages.set(p.totalPages);
        this.totalElements.set(p.totalElements);
        this.selected.set(new Set());
        this.loading.set(false);
      },
      error: () => { this.toast.error('Erreur de chargement'); this.loading.set(false); },
    });
  }

  // ── Tabs & Search ──
  setTab(tab: RsvpTab): void {
    this.activeTab.set(tab);
    this.page.set(0);
    this.load();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 350);
  }

  // ── Pagination ──
  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages() - 1) { this.page.update(p => p + 1); this.load(); } }

  // ── Selection ──
  toggleAll(): void {
    const cur = this.selected();
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.guests().map(g => g.id)));
    }
  }

  toggleOne(id: number): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  isSelected(id: number): boolean { return this.selected().has(id); }

  // ── Add / Edit ──
  openAdd(): void {
    this.editingGuest.set(null);
    this.form.reset({ notificationMode: 'EMAIL' });
    this.showForm.set(true);
  }

  openEdit(g: Guest): void {
    this.editingGuest.set(g);
    this.form.patchValue({
      fullName:         g.fullName,
      email:            g.email ?? '',
      phoneNumber:      g.phoneNumber ?? '',
      notificationMode: g.notificationMode ?? 'EMAIL',
      tableNumber:      g.tableNumber ?? null,
    });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  saveGuest(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const req: any = {
      fullName:         v.fullName!,
      email:            v.email      || undefined,
      phoneNumber:      v.phoneNumber || undefined,
      notificationMode: v.notificationMode ?? 'EMAIL',
      tableNumber:      v.tableNumber ?? undefined,
    };

    const editing = this.editingGuest();
    const obs = editing
      ? this.svc.update(editing.id, req)
      : this.svc.add(this.eventId, req);

    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Invité modifié' : 'Invité ajouté');
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || (editing ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout');
        this.toast.error(msg);
        this.saving.set(false);
      },
    });
  }

  // ── Delete ──
  askDelete(id: number): void { this.confirmDeleteId.set(id); }
  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.confirmDeleteId.set(null);
    this.svc.delete(id).subscribe({
      next: () => { this.toast.success('Invité supprimé'); this.load(); },
      error: () => this.toast.error('Erreur lors de la suppression'),
    });
  }

  // ── Bulk delete ──
  askBulkDelete(): void { this.confirmBulkDelete.set(true); }
  cancelBulkDelete(): void { this.confirmBulkDelete.set(false); }

  confirmBulkDeleteAction(): void {
    const ids = Array.from(this.selected());
    this.confirmBulkDelete.set(false);
    this.svc.bulkDelete({ guestIds: ids }).subscribe({
      next: () => { this.toast.success(`${ids.length} invité(s) supprimé(s)`); this.load(); },
      error: () => this.toast.error('Erreur lors de la suppression'),
    });
  }

  // ── Reminder ──
  askReminder(id: number): void { this.confirmReminderId.set(id); }
  cancelReminder(): void { this.confirmReminderId.set(null); }

  confirmReminder(): void {
    const id = this.confirmReminderId();
    if (!id) return;
    this.confirmReminderId.set(null);
    this.reminderLoading.set(id);
    this.svc.sendReminder(id).subscribe({
      next: () => { this.toast.success('Rappel envoyé'); this.reminderLoading.set(null); },
      error: () => { this.toast.error('Erreur lors de l\'envoi'); this.reminderLoading.set(null); },
    });
  }

  // ── Helpers ──
  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  rsvpClass(status: RsvpStatus): string {
    const map: Record<string, string> = {
      PENDING: 'rsvp-pending', CONFIRMED: 'rsvp-confirmed',
      DECLINED: 'rsvp-declined', PRESENT: 'rsvp-present',
    };
    return map[status] ?? '';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
