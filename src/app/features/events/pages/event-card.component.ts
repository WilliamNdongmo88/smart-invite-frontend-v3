import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { Event, InvitationCard } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink],
  template: `
<div class="card-page">

  <!-- Header -->
  <div class="page-header">
    @if (event()) {
      <a [routerLink]="['/events', event()!.id]" class="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        {{ event()!.title }}
      </a>
    }
    <div class="header-row">
      <h1 class="page-title">Carte d'invitation</h1>
      @if (event() && !loading()) {
        <div class="header-actions">
          <a [routerLink]="['/events', event()!.id, 'edit']" class="btn-action btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier
          </a>
          <button class="btn-action btn-gold" (click)="downloadPdf()" [disabled]="downloading()">
            @if (downloading()) {
              <span class="spinner-sm"></span> Téléchargement...
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Télécharger PDF
            }
          </button>
        </div>
      }
    </div>
  </div>

  @if (loading()) {
    <div class="loader-wrap"><div class="spinner-lg"></div></div>
  } @else if (!card()) {
    <div class="empty-state">
      <span class="empty-icon">🎴</span>
      <p class="empty-title">Aucune carte configurée</p>
      <p class="empty-sub">Cet événement n'a pas encore de carte d'invitation.</p>
      <a [routerLink]="['/events', event()!.id, 'edit']" class="btn-action btn-gold">Configurer la carte</a>
    </div>
  } @else if (isUpload()) {
    <!-- PDF importé -->
    <div class="pdf-container">
      <iframe [src]="pdfSafeUrl()!" class="pdf-iframe" title="Carte d'invitation"></iframe>
    </div>
  } @else {
    <!-- Carte personnalisée -->
    <div class="preview-outer">
      <div class="preview-wrapper">

        <div class="preview-top-band">
          <img src="/img/logo.png" class="preview-logo" alt="Smart Invite" />
          <p class="preview-title">{{ card()!.title }}</p>
        </div>

        <div class="preview-body">
          <p class="preview-salutation">Cher/Chère {{ guestNamePlaceholder }},</p>
          <div class="preview-messages">
            @if (card()!.mainMessage) { <span>{{ card()!.mainMessage }}</span> }
            @if (card()!.mainMessagePart1) { <span>{{ card()!.mainMessagePart1 }}</span> }
            @if (card()!.mainMessagePart2) { <span>{{ card()!.mainMessagePart2 }}</span> }
          </div>

          <hr class="preview-divider" />
          <p class="preview-programme-title">PROGRAMME</p>

          <div class="preview-programme">
            @if (isMariage()) {
              @if (event()!.civilLocation || event()!.civilDateTime) {
                <div class="preview-ceremony">
                  <span class="preview-ceremony-title">MARIAGE CIVIL {{ formatDate(event()!.civilDateTime) }}</span>
                  <span class="preview-ceremony-loc">{{ event()!.civilLocation }}</span>
                </div>
              }
              @if (event()!.showWeddingReligiousLocation && (event()!.religiousLocation || event()!.religiousDateTime)) {
                <div class="preview-ceremony">
                  <span class="preview-ceremony-title">CÉRÉMONIE RELIGIEUSE {{ formatDate(event()!.religiousDateTime) }}</span>
                  <span class="preview-ceremony-loc">{{ event()!.religiousLocation }}</span>
                </div>
              }
              @if (event()!.banquetLocation || event()!.banquetDateTime) {
                <div class="preview-ceremony">
                  <span class="preview-ceremony-title">RÉCEPTION NUPTIALE {{ formatDate(event()!.banquetDateTime) }}</span>
                  <span class="preview-ceremony-loc">{{ event()!.banquetLocation }}</span>
                </div>
              }
            } @else {
              <div class="preview-ceremony">
                <span class="preview-ceremony-title">{{ event()!.title }}</span>
                <span class="preview-ceremony-loc">{{ formatDate(event()!.eventDate) }}</span>
              </div>
            }
          </div>

          <hr class="preview-divider" />

          @if (card()!.eventTheme) {
            <p class="preview-theme">THÈME DE LA SOIRÉE : {{ card()!.eventTheme }}</p>
          }

          <div class="preview-qr-zone">
            <img src="/img/qrcode.png" class="preview-qr-img" alt="QR Code" />
            @if (card()!.qrInstructions) { <p class="preview-qr-text">{{ card()!.qrInstructions }}</p> }
            @if (card()!.dressCodeMessage) { <p class="preview-qr-text">{{ card()!.dressCodeMessage }}</p> }
            @if (card()!.sousMainMessage) { <p class="preview-qr-text">{{ card()!.sousMainMessage }}</p> }
          </div>

          @if (card()!.thanksMessage1) { <p class="preview-thanks">{{ card()!.thanksMessage1 }}</p> }
          @if (card()!.closingMessage) { <p class="preview-closing">{{ card()!.closingMessage }}</p> }
        </div>

        <div class="preview-bottom-band">
          <p class="preview-names">{{ event()!.concernedNames || event()!.title }}</p>
        </div>

      </div>
    </div>
  }

</div>
  `,
  styles: [`
*, *::before, *::after { box-sizing: border-box; }

.card-page {
  display: flex; flex-direction: column; gap: 1.5rem;
  width: 100%; max-width: 900px; min-width: 0;
}

.page-header { display: flex; flex-direction: column; gap: 0.75rem; }

.back-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  color: #666; font-size: 0.8rem; text-decoration: none; width: fit-content;
  transition: color 0.2s;
  &:hover { color: #c9a84c; }
}

.header-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.page-title { font-size: clamp(1.2rem,4vw,1.7rem); font-weight: 800; color: #fff; margin: 0; }
.header-actions { display: flex; align-items: center; gap: 0.5rem; }

.btn-action {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.8rem; font-weight: 600; padding: 0.5rem 1rem;
  border-radius: 8px; cursor: pointer; text-decoration: none;
  transition: all 0.2s; white-space: nowrap; border: none;
}
.btn-outline {
  background: none; border: 1px solid #333; color: #aaa;
  &:hover { border-color: #c9a84c; color: #c9a84c; }
}
.btn-gold {
  background: #c9a84c; border: 1px solid #c9a84c; color: #111;
  &:hover:not(:disabled) { background: #b8943e; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.loader-wrap { display: flex; justify-content: center; padding: 4rem; }
.spinner-lg {
  width: 36px; height: 36px;
  border: 3px solid #2a2a2a; border-top-color: #c9a84c;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner-sm {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(17,17,17,0.3); border-top-color: #111;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 4rem 2rem; text-align: center;
}
.empty-icon  { font-size: 3rem; }
.empty-title { font-size: 1.1rem; font-weight: 700; color: #e5e5e5; margin: 0; }
.empty-sub   { font-size: 0.85rem; color: #666; margin: 0; }

/* PDF iframe */
.pdf-container {
  background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 14px;
  overflow: hidden; height: 80vh;
}
.pdf-iframe { width: 100%; height: 100%; border: none; display: block; }

/* Custom card preview */
.preview-outer {
  display: flex; justify-content: center;
}

.preview-wrapper {
  background: #fff; color: #333;
  width: 100%; max-width: 680px;
  border-radius: 4px;
  box-shadow: 0 4px 40px rgba(0,0,0,0.5);
  font-family: Georgia, 'Times New Roman', serif;
  overflow: hidden;
}

.preview-top-band {
  background: #fff; border-bottom: 2px solid #c9a84c;
  padding: 1.5rem 2rem 1rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.preview-logo { height: 60px; object-fit: contain; }
.preview-title {
  font-size: 1.1rem; font-weight: 700; color: #c9a84c;
  text-align: center; margin: 0; font-style: italic;
}

.preview-body { padding: 1.5rem 2.5rem; display: flex; flex-direction: column; gap: 0.75rem; }

.preview-salutation { font-size: 0.9rem; color: #333; margin: 0; }
.preview-messages { display: flex; flex-direction: column; gap: 0.3rem; }
.preview-messages span { font-size: 0.85rem; color: #444; line-height: 1.6; }

.preview-divider { border: none; border-top: 1px solid #c9a84c; margin: 0.5rem 0; }
.preview-programme-title {
  text-align: center; font-size: 0.8rem; font-weight: 700;
  letter-spacing: 0.15em; color: #333; margin: 0;
}

.preview-programme { display: flex; flex-direction: column; gap: 0.75rem; }
.preview-ceremony { display: flex; flex-direction: column; gap: 0.15rem; }
.preview-ceremony-title { font-size: 0.78rem; font-weight: 700; color: #c9a84c; }
.preview-ceremony-loc   { font-size: 0.82rem; color: #555; }

.preview-theme {
  text-align: center; font-size: 0.78rem; font-weight: 700;
  letter-spacing: 0.1em; color: #333; margin: 0;
}

.preview-qr-zone {
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  padding: 0.5rem 0;
}
.preview-qr-img { width: 90px; height: 90px; object-fit: contain; }
.preview-qr-text { font-size: 0.75rem; color: #555; text-align: center; font-style: italic; margin: 0; }

.preview-thanks  { font-size: 0.85rem; color: #333; text-align: center; margin: 0; }
.preview-closing { font-size: 0.85rem; color: #333; text-align: center; margin: 0; }

.preview-bottom-band {
  background: #fff; border-top: 2px solid #c9a84c;
  padding: 1rem 2rem; text-align: center;
}
.preview-names { font-size: 1rem; font-weight: 700; color: #c9a84c; margin: 0; font-style: italic; }

@media (max-width: 600px) {
  .preview-body { padding: 1rem 1.25rem; }
  .header-row { flex-direction: column; align-items: flex-start; }
}
  `],
})
export class EventCardComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly svc        = inject(EventService);
  private readonly toast      = inject(ToastService);
  private readonly sanitizer  = inject(DomSanitizer);

  loading     = signal(true);
  downloading = signal(false);
  event       = signal<Event | null>(null);
  card        = signal<InvitationCard | null>(null);

  readonly guestNamePlaceholder = 'Invité(e)';

  isUpload  = computed(() => this.event()?.importMyModelCard === true);
  isMariage = computed(() => {
    const t = this.event()?.type;
    return t === 'MARIAGE' || t === 'FIANCAILLES';
  });

  pdfSafeUrl = computed((): SafeResourceUrl | null => {
    const url = this.card()?.pdfUrl;
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  private eventId = 0;

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId) { this.router.navigate(['/events']); return; }

    forkJoin({
      event: this.svc.findById(this.eventId),
      card:  this.svc.getCard(this.eventId).pipe(catchError(() => of({ data: null }))),
    }).subscribe({
      next: ({ event, card }) => {
        this.event.set(event.data!);
        const cardData = (card as any)?.data;
        const note = cardData?.card ?? cardData?.invitationNote ?? null;
        this.card.set(note);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger la carte');
        this.router.navigate(['/events']);
      },
    });
  }

  downloadPdf(): void {
    this.downloading.set(true);
    this.svc.downloadCardPdf(this.eventId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carte-invitation-${this.eventId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => {
        this.toast.error('Erreur lors du téléchargement');
        this.downloading.set(false);
      },
    });
  }

  formatDate(dt: string | null | undefined): string {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const days   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const h = d.getHours().toString().padStart(2,'0');
    const m = d.getMinutes().toString().padStart(2,'0');
    return `le ${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }
}
