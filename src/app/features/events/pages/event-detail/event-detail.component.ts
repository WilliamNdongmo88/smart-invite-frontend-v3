import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EventService } from '../../../../core/services/event.service';
import { GuestService } from '../../../../core/services/guest.service';
import { LinkService } from '../../../../core/services/link.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Event } from '../../../../core/models/event.model';
import { EventStats } from '../../../../core/models/event.model';
import { Guest } from '../../../../core/models/guest.model';
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '../../../../core/models/enums.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'], 
})
export class EventDetailComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc    = inject(EventService);
  private readonly guestSvc = inject(GuestService);
  private readonly linkSvc  = inject(LinkService);
  private readonly toast  = inject(ToastService);

  loading = signal(true);
  linkLoading = signal(false);
  event   = signal<Event | null>(null);
  stats   = signal<EventStats | null>(null);
  guests  = signal<Guest[]>([]);

  /** true si l'utilisateur a déjà cliqué sur "Page Inscription" — persisté en localStorage */
  joinPageClicked = signal<boolean>(
    localStorage.getItem('joinPageClicked') === 'true'
  );

  typeLabel   = computed(() => this.event() ? EVENT_TYPE_LABELS[this.event()!.type] : '');
  statusLabel = computed(() => this.event() ? EVENT_STATUS_LABELS[this.event()!.status] : '');
  isMariage   = computed(() => {
    const t = this.event()?.type;
    return t === 'MARIAGE';
  });

  /** Route vers la page personnalisée (éditeur dédié) de l'événement */
  readonly editorRoute = computed(() => {
    const e = this.event();
    if (!e) return null;
    const map: Record<string, string> = {
      MARIAGE:    'wedding',
      CONFERENCE: 'conference',
      GALA:       'gala',
      CEREMONIE:  'ceremonie',
    };
    return map[e.type] ?? null;
  });
  responseRate = computed(() => {
    const s = this.stats();
    if (!s || s.totalGuests === 0) return 0;
    return Math.round(((s.confirmed + s.declined) / s.totalGuests) * 100);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/events']); return; }

    forkJoin({
      event:  this.svc.findById(id),
      stats:  this.svc.getStats(id),
      guests: this.guestSvc.list(id, { size: 8 }),
    }).subscribe({
      next: ({ event, stats, guests }) => {
        this.event.set(event.data!);
        this.stats.set(stats.data!);
        this.guests.set(guests.data?.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger l\'événement');
        this.router.navigate(['/events']);
      },
    });
  }

  formatDate(dt: string | null | undefined): string {
    if (!dt) return '—';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '—';
    const days   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const h = d.getHours().toString().padStart(2,'0');
    const m = d.getMinutes().toString().padStart(2,'0');
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }

  rsvpLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', CONFIRMED: 'Confirmé', DECLINED: 'Refusé', PRESENT: 'Présent',
    };
    return map[status] ?? status;
  }

  goToJoinPage(): void {
    const e = this.event();
    if (!e) return;
    // Marquer que l'utilisateur a cliqué — stoppe le clignotement
    localStorage.setItem('joinPageClicked', 'true');
    this.joinPageClicked.set(true);
    this.linkLoading.set(true);
    this.linkSvc.getByEvent(e.id).subscribe({
      next: (res) => {
        const links = res.data ?? [];
        if (links.length > 0 && links[0].token) {
          this.linkLoading.set(false);
          this.router.navigate(['/join', links[0].token]);
        } else {
          this.linkSvc.create({ eventId: e.id }).subscribe({
            next: (newLink) => {
              this.linkLoading.set(false);
              if (newLink.data?.token) {
                this.router.navigate(['/join', newLink.data.token]);
              } else {
                this.openJoinPreview(e);
              }
            },
            error: () => {
              this.linkLoading.set(false);
              this.openJoinPreview(e);
            },
          });
        }
      },
      error: () => {
        this.linkLoading.set(false);
        this.openJoinPreview(e);
      },
    });
  }

  private openJoinPreview(e: Event): void {
    const preview: Record<string, unknown> = {
      eventTitle:      e.title,
      eventType:       e.type,
      concernedNames:  e.concernedNames || e.title,
      eventDate:       e.eventDate || e.banquetDateTime || '',
      couplePhotoUrl:  e.couplePhotoUrl || null,
      banquetLocation: e.banquetLocation || null,
    };

    // Inclure le thème visuel pour les mariages
    if (e.type === 'MARIAGE') {
      const content = e.detailsContent || e.weddingDetailsContent;
      if (content?.theme) {
        preview['theme'] = content.theme;
      }
    }

    sessionStorage.setItem('join_preview', JSON.stringify(preview));
    this.router.navigate(['/join', 'preview']);
  }
}
