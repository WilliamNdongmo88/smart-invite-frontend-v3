import {
  Component, inject, signal, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone, PLATFORM_ID, Input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckinService } from '../../../../core/services/checkin.service';
import { ScanResponse } from '../../../../core/models/checkin.model';

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
      this.loadParameters();
    }
  }

  private loadParameters(): void {
    this.svc.getStats().subscribe({
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
    if (this.eventId) {
      this.svc.updateSound(this.eventId, next).subscribe();
    }
  }

  ngOnDestroy(): void { this.stopCamera(); }

  async startCamera(): Promise<void> {
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
    // Ne pas écraser l'état si un résultat est affiché
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
    // QR contient une URL complète → extraire le token (dernier segment de path)
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
    this.counts.update(c => ({
      total:     c.total + 1,
      valid:     res.result === 'VALID'     ? c.valid + 1     : c.valid,
      duplicate: res.result === 'DUPLICATE' ? c.duplicate + 1 : c.duplicate,
      invalid:   (res.result === 'INVALID' || res.result === 'EXPIRED') ? c.invalid + 1 : c.invalid,
    }));
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
        // Deux bips montants courts
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Bip grave descendant
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
}
