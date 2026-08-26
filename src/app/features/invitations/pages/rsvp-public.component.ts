import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvitationService } from '../../../core/services/invitation.service';
import { PublicInvitation } from '../../../core/models/invitation.model';
import { EVENT_TYPE_LABELS } from '../../../core/models/enums.model';

type PageState = 'loading' | 'ready' | 'confirmed' | 'declined' | 'error';

@Component({
  selector: 'app-rsvp-public',
  standalone: true,
  imports: [],
  templateUrl: './rsvp-public.component.html',
  styleUrls: ['./rsvp-public.component.scss'],
})
export class RsvpPublicComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(InvitationService);

  state = signal<PageState>('loading');
  inv = signal<PublicInvitation | null>(null);
  submitting = signal<'CONFIRMED' | 'DECLINED' | null>(null);
  errorMsg = signal('Ce lien est invalide ou a expiré.');

  readonly simulatedCouplePhoto = '/img/photoCouple.avif';

  typeLabel = computed(() => {
    const t = this.inv()?.eventType;
    return t ? EVENT_TYPE_LABELS[t] : '';
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    this.svc.getPublic(token).subscribe({
      next: (res) => {
        this.inv.set(res.data!);
        const status = res.data!.rsvpStatus;
        if (status === 'CONFIRMED') {
          this.state.set('confirmed');
        } else if (status === 'DECLINED') {
          this.state.set('declined');
        } else {
          this.state.set('ready');
        }
      },
      error: (err) => {
        const msg = err?.error?.message;
        if (msg) this.errorMsg.set(msg);
        this.state.set('error');
      },
    });
  }

  coupleNames(): string {
    const i = this.inv();
    if (i?.concernedNames) return i.concernedNames;
    return i?.eventTitle || 'Votre événement';
  }

  eventTitle(): string {
    return this.inv()?.eventTitle || 'Invitation';
  }

  eventDate(): string {
    const dt = this.inv()?.eventDate || this.inv()?.banquetDateTime;
    if (!dt) return "Date de l'événement";
    return this.formatDate(dt);
  }

  eventLocation(): string {
    const i = this.inv();
    return i?.banquetLocation || i?.religiousLocation || i?.civilLocation || '';
  }

  couplePhoto(): string {
    const i = this.inv();
    return i?.couplePhotoUrl || this.simulatedCouplePhoto;
  }

  respond(status: 'CONFIRMED' | 'DECLINED'): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }

    this.submitting.set(status);
    this.svc.rsvp(token, { status }).subscribe({
      next: (res) => {
        this.inv.set(res.data!);
        this.state.set(status === 'CONFIRMED' ? 'confirmed' : 'declined');
        this.submitting.set(null);
      },
      error: (err) => {
        const msg = err?.error?.message;
        if (msg) this.errorMsg.set(msg);
        this.state.set('error');
        this.submitting.set(null);
      },
    });
  }

  private formatDate(dt: string): string {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }
}
