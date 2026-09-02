import {
  Component, inject, signal, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone, PLATFORM_ID, Input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckinService } from '../../../../core/services/checkin.service';
import { EventSummary, ScanResponse } from '../../../../core/models/checkin.model';

type FeedbackState = 'idle' | 'scanning' | 'VALID' | 'DUPLICATE' | 'EXPIRED' | 'INVALID' | 'error';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.scss'],
})
export class ScanComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() eventId?: number;

  private readonly svc        = inject(CheckinService);
  private readonly zone       = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  cameraActive  = signal(false);
  cameraError   = signal<string | null>(null);
  state         = signal<FeedbackState>('idle');
  lastResult    = signal<ScanResponse | null>(null);
  counts        = signal({ valid: 0, duplicate: 0, invalid: 0, total: 0 });
  soundEnabled  = signal(true);

  /** Liste des événements de l'organisateur (chargée au init). */
  events        = signal<EventSummary[]>([]);
  eventsLoading = signal(false);
  eventsError   = signal<string | null>(null);

  /** ID de l'événement sélectionné dans le sélecteur. */
  selectedEventId    = signal<number | null>(null);
  /** Titre de l'événement sélectionné. */
  selectedEventTitle = signal<string | null>(null);

  /** ID de l'événement en cours de scan (déduit du dernier QR valide). */
  currentEventId    = signal<number | null>(null);
  /** Titre de l'événement en cours de scan. */
  currentEventTitle = signal<string | null>(null);

  manualToken = '';

  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;
  private jsqr: ((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null = null;
  private audioCtx: AudioContext | null = null;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('jsqr').then(m => { this.jsqr = m.default; });
      this.loadEvents();
    }
  }

  /** Charge la liste des événements disponibles pour cet agent. */
  loadEvents(): void {
    this.eventsLoading.set(true);
    this.eventsError.set(null);
    this.svc.getAgentEvents().subscribe({
      next: (res) => {
        this.events.set(res.data ?? []);
        this.eventsLoading.set(false);
        // Si un seul événement, le pré-sélectionner automatiquement
        if (res.data && res.data.length === 1) {
          this.selectEvent(res.data[0]);
        }
      },
      error: () => {
        this.eventsError.set('Impossible de charger les événements.');
        this.eventsLoading.set(false);
      },
    });
  }

  /** Sélectionne un événement et charge ses stats. */
  selectEvent(event: EventSummary): void {
    this.selectedEventId.set(event.id);
    this.selectedEventTitle.set(event.title);
    this.currentEventId.set(event.id);
    this.currentEventTitle.set(event.title);
    this.loadParameters();
  }

  /** Désélectionne l'événement (retour au sélecteur). */
  clearEventSelection(): void {
    this.stopCamera();
    this.selectedEventId.set(null);
    this.selectedEventTitle.set(null);
    this.currentEventId.set(null);
    this.currentEventTitle.set(null);
    this.counts.set({ valid: 0, duplicate: 0, invalid: 0, total: 0 });
    this.state.set('idle');
    this.lastResult.set(null);
  }

  private loadParameters(): void {
    const eid = this.currentEventId();
    this.svc.getStats(eid ?? undefined).subscribe({
      next: (res) => {
        const p = res.data!;
        this.soundEnabled.set(p.confirmationSound);
        this.counts.set({
          valid:     p.validScans,
          duplicate: p.duplicateScans,
          invalid:   p.invalidScans,
          total:     p.totalScans,
        });
      },
      error: () => {},
    });
  }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    const eid = this.selectedEventId() ?? this.eventId;
    if (eid) {
      this.svc.updateSound(eid, next).subscribe();
    }
  }

  ngOnDestroy(): void { this.stopCamera(); }

  async startCamera(): Promise<void> {
    // Bloquer le démarrage si aucun événement sélectionné
    if (!this.selectedEventId()) return;
    if (!isPlatformBrowser(this.platformId)) return;
    this.cameraError.set(null);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.cameraActive.set(true);
      this.state.set('scanning');
      this.tick();
    } catch {
      this.cameraError.set('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.cameraActive.set(false);
    const s = this.state();
    if (s === 'idle' || s === 'scanning') this.state.set('idle');
  }

  private tick(): void {
    this.rafId = requestAnimationFrame(() => {
      if (!this.cameraActive()) return;
      this.tryDecode();
      this.tick();
    });
  }

  private tryDecode(): void {
    if (this.processing || !this.jsqr) return;
    const video  = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    if (video.readyState < 2) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const code = this.jsqr(img.data, w, h);
    if (code?.data) this.handleToken(code.data);
  }

  private extractToken(raw: string): string {
    try {
      const url = new URL(raw);
      const segments = url.pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] ?? raw;
    } catch {
      return raw.trim();
    }
  }

  private handleToken(token: string): void {
    token = this.extractToken(token);
    this.processing = true;
    this.state.set('scanning');
    this.svc.scan(token).subscribe({
      next: (res) => this.zone.run(() => this.showResult(res.data!)),
      error: (err) => this.zone.run(() => {
        this.state.set('error');
        this.lastResult.set({ result: 'INVALID', message: err?.error?.message || 'Erreur réseau' });
        this.scheduleReset();
      }),
    });
  }

  private showResult(res: ScanResponse): void {
    this.lastResult.set(res);
    this.state.set(res.result as FeedbackState);

    // Mettre à jour l'événement si le QR scanné apporte une info
    if (res.eventId && res.eventId > 0) {
      this.currentEventId.set(res.eventId);
    }
    if (res.eventTitle) {
      this.currentEventTitle.set(res.eventTitle);
    }

    this.loadParameters();

    if (this.soundEnabled()) this.playSound(res.result);
    if (res.result === 'VALID' || res.result === 'DUPLICATE') {
      this.stopCamera();
    } else {
      this.scheduleReset();
    }
  }

  private playSound(result: string): void {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (result === 'VALID') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch { /* AudioContext non disponible */ }
  }

  private scheduleReset(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.zone.run(() => {
        this.processing = false;
        if (this.cameraActive()) this.state.set('scanning');
        else this.state.set('idle');
      });
    }, 2500);
  }

  resetForNext(): void {
    this.processing = false;
    this.lastResult.set(null);
    this.state.set('idle');
    this.startCamera();
  }

  submitManual(): void {
    const token = this.manualToken.trim();
    if (!token) return;
    this.manualToken = '';
    this.handleToken(token);
  }

  feedbackIcon(): string {
    const map: Record<string, string> = {
      VALID: '✅', DUPLICATE: '⚠️', EXPIRED: '⏰', INVALID: '❌', error: '❌',
    };
    return map[this.state()] ?? '';
  }

  feedbackTitle(): string {
    const map: Record<string, string> = {
      VALID: 'Accès autorisé', DUPLICATE: 'Déjà scanné',
      EXPIRED: 'Invitation expirée', INVALID: 'QR invalide', error: 'Erreur',
    };
    return map[this.state()] ?? '';
  }

  /** Retourne un label lisible pour un événement dans le sélecteur. */
  eventLabel(ev: EventSummary): string {
    const parts: string[] = [ev.title];
    if (ev.dateLabel) parts.push(ev.dateLabel);
    if (ev.venueCity) parts.push(ev.venueCity);
    return parts.join(' · ');
  }
}
