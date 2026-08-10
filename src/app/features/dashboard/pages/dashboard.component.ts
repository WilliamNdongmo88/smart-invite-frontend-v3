import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models/event.model';
import { EventStats } from '../../../core/models/event.model';
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '../../../core/models/enums.model';

interface DashboardStats {
  activeEvents: number;
  totalGuests: number;
  confirmationRate: number;
  nextEventDate: string | null;
  nextEventTitle: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: 'dashboard.component.html',
  styleUrl: 'dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly auth = inject(AuthService);

  userName = this.auth.getName() ?? 'vous';
  loading = signal(true);
  events = signal<Event[]>([]);
  eventStatsMap = signal<Record<number, EventStats>>({});
  stats = signal<DashboardStats>({
    activeEvents: 0,
    totalGuests: 0,
    confirmationRate: 0,
    nextEventDate: null,
    nextEventTitle: null,
  });

  readonly typeLabels = EVENT_TYPE_LABELS;
  readonly statusLabels = EVENT_STATUS_LABELS;

  ngOnInit(): void {
    this.eventService.findAll().pipe(
      switchMap((res) => {
        const allEvents = res.data ?? [];
        this.events.set(allEvents.slice(0, 3));

        if (allEvents.length === 0) return of({ events: allEvents, statsArr: [] });

        const statsRequests = allEvents.map((e) =>
          this.eventService.getStats(e.id).pipe(catchError(() => of(null)))
        );
        return forkJoin(statsRequests).pipe(
          switchMap((statsArr) => of({ events: allEvents, statsArr }))
        );
      }),
      catchError(() => of({ events: [], statsArr: [] }))
    ).subscribe(({ events, statsArr }) => {
      const validStats = (statsArr as (any | null)[]).filter(Boolean).map((r: any) => r.data as EventStats);

      const activeEvents = events.filter((e) => e.status === 'ACTIVE' || e.status === 'PLANNED').length;
      const totalGuests = validStats.reduce((s, st) => s + (st?.totalGuests ?? 0), 0);
      const totalConfirmed = validStats.reduce((s, st) => s + (st?.confirmed ?? 0), 0);
      const confirmationRate = totalGuests > 0 ? Math.round((totalConfirmed / totalGuests) * 100) : 0;

      const upcoming = events
        .filter((e) => e.eventDate && new Date(e.eventDate) >= new Date())
        .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime());

      const statsMap: Record<number, EventStats> = {};
      validStats.forEach((st) => { if (st?.id) statsMap[st.id] = st; });
      this.eventStatsMap.set(statsMap);

      this.stats.set({
        activeEvents,
        totalGuests,
        confirmationRate,
        nextEventDate: upcoming[0]?.eventDate ?? null,
        nextEventTitle: upcoming[0]?.title ?? null,
      });

      this.loading.set(false);
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  responseRate(eventId: number): number {
    const st = this.eventStatsMap()[eventId];
    if (!st || st.totalGuests === 0) return 0;
    return Math.round(((st.confirmed + st.declined) / st.totalGuests) * 100);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge-active',
      PLANNED: 'badge-planned',
      COMPLETED: 'badge-completed',
      CANCELLED: 'badge-cancelled',
    };
    return map[status] ?? '';
  }
}
