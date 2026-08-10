import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { Event } from '../../../core/models/event.model';
import { EventStatus, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '../../../core/models/enums.model';

type FilterTab = 'ALL' | EventStatus;

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: 'events-list.component.html',
  styleUrl: 'events-list.component.scss',
})
export class EventsListComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  deleting = signal<number | null>(null);
  confirmDeleteId = signal<number | null>(null);

  private allEvents = signal<Event[]>([]);
  activeTab = signal<FilterTab>('ALL');
  search = signal('');

  readonly typeLabels = EVENT_TYPE_LABELS;
  readonly statusLabels = EVENT_STATUS_LABELS;

  readonly tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL',       label: 'Tous' },
    { key: 'PLANNED',   label: 'Planifiés' },
    { key: 'ACTIVE',    label: 'Actifs' },
    { key: 'COMPLETED', label: 'Terminés' },
    { key: 'CANCELLED', label: 'Annulés' },
  ];

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const q = this.search().toLowerCase().trim();
    return this.allEvents().filter((e) => {
      const matchTab = tab === 'ALL' || e.status === tab;
      const matchSearch = !q || e.title.toLowerCase().includes(q) || this.typeLabels[e.type].toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  });

  readonly counts = computed(() => {
    const all = this.allEvents();
    return {
      ALL:       all.length,
      PLANNED:   all.filter((e) => e.status === 'PLANNED').length,
      ACTIVE:    all.filter((e) => e.status === 'ACTIVE').length,
      COMPLETED: all.filter((e) => e.status === 'COMPLETED').length,
      CANCELLED: all.filter((e) => e.status === 'CANCELLED').length,
    };
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.eventService.findAll().subscribe({
      next: (res) => { this.allEvents.set(res.data ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Erreur lors du chargement des événements'); this.loading.set(false); },
    });
  }

  setTab(tab: FilterTab): void { this.activeTab.set(tab); }
  onSearch(value: string): void { this.search.set(value); }

  askDelete(id: number): void { this.confirmDeleteId.set(id); }
  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deleting.set(id);
    this.confirmDeleteId.set(null);
    this.eventService.delete(id).subscribe({
      next: () => {
        this.allEvents.update((list) => list.filter((e) => e.id !== id));
        this.deleting.set(null);
        this.toast.success('Événement supprimé');
      },
      error: () => { this.deleting.set(null); this.toast.error('Erreur lors de la suppression'); },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  location(event: Event): string {
    return event.banquetLocation ?? event.religiousLocation ?? event.civilLocation ?? '';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active', PLANNED: 'badge-planned',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
    };
    return map[status] ?? '';
  }
}
