import {
  Component, inject, signal, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, NgZone, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckinService } from '../../../core/services/checkin.service';
import { ScanResponse } from '../../../core/models/checkin.model';

type FeedbackState = 'idle' | 'scanning' | 'VALID' | 'DUPLICATE' | 'EXPIRED' | 'INVALID' | 'error';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="scan-page">

      <!-- Header stats -->
      <div class="scan-stats">
        <div class="stat"><span class="stat-n valid">{{ counts().valid }}</span><span class="stat-l">Valides</span></div>
        <div class="stat"><span class="stat-n dup">{{ counts().duplicate }}</span><span class="stat-l">Doublons</span></div>
        <div class="stat"><span class="stat-n inv">{{ counts().invalid }}</span><span class="stat-l">Invalides</span></div>
        <div class="stat"><span class="stat-n tot">{{ counts().total }}</span><span class="stat-l">Total</span></div>
      </div>

      <!-- Camera zone -->
      <div class="camera-wrap" [class]="'state-' + state()">

        <!-- Feedback overlay -->
        @if (state() !== 'idle' && state() !== 'scanning') {
          <div class="feedback-overlay" [class]="'fb-' + state()">
            <div class="fb-icon">{{ feedbackIcon() }}</div>
            <div class="fb-title">{{ feedbackTitle() }}</div>
            @if (lastResult()) {
              <div class="fb-guest">{{ lastResult()!.guestName }}</div>
              <div class="fb-event">{{ lastResult()!.eventTitle }}</div>
            }
            <div class="fb-msg">{{ lastResult()?.message }}</div>
          </div>
        }

        <!-- Video + canvas -->
        <video #videoEl autoplay playsinline muted class="camera-video"
               [class.hidden]="!cameraActive()"></video>
        <canvas #canvasEl class="camera-canvas"></canvas>

        <!-- Viewfinder -->
        @if (cameraActive() && state() === 'scanning') {
          <div class="viewfinder">
            <div class="vf-corner tl"></div>
            <div class="vf-corner tr"></div>
            <div class="vf-corner bl"></div>
            <div class="vf-corner br"></div>
            <div class="vf-line"></div>
          </div>
        }

        <!-- Camera off placeholder -->
        @if (!cameraActive()) {
          <div class="camera-off">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p>Caméra inactive</p>
          </div>
        }
      </div>

      <!-- Camera controls -->
      <div class="cam-controls">
        @if (!cameraActive()) {
          <button class="btn-cam start" (click)="startCamera()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            Démarrer la caméra
          </button>
        } @else {
          <button class="btn-cam stop" (click)="stopCamera()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Arrêter
          </button>
        }
        @if (cameraError()) {
          <span class="cam-error">{{ cameraError() }}</span>
        }
      </div>

      <!-- Manual input -->
      <div class="manual-section">
        <p class="manual-label">Saisie manuelle du token</p>
        <div class="manual-row">
          <input
            class="manual-input"
            type="text"
            placeholder="Collez ou tapez le token ici…"
            [(ngModel)]="manualToken"
            (keydown.enter)="submitManual()"
          />
          <button class="btn-submit" [disabled]="!manualToken.trim() || state() === 'scanning'" (click)="submitManual()">
            Scanner
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .scan-page {
      display: flex; flex-direction: column; gap: 1.25rem;
      width: 100%; max-width: 480px; margin: 0 auto; color: #e0e0e0;
    }

    /* Stats */
    .scan-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem;
    }
    .stat {
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px;
      padding: .75rem; text-align: center; display: flex; flex-direction: column; gap: .2rem;
    }
    .stat-n { font-size: 1.5rem; font-weight: 700; }
    .stat-l { font-size: .7rem; color: #888; }
    .valid { color: #22c55e; }
    .dup   { color: #f59e0b; }
    .inv   { color: #ef4444; }
    .tot   { color: #c9a84c; }

    /* Camera wrap */
    .camera-wrap {
      position: relative; width: 100%; aspect-ratio: 1;
      background: #0a0a0a; border-radius: 16px; overflow: hidden;
      border: 2px solid #2a2a2a; transition: border-color .3s;
    }
    .camera-wrap.state-VALID     { border-color: #22c55e; }
    .camera-wrap.state-DUPLICATE { border-color: #f59e0b; }
    .camera-wrap.state-EXPIRED,
    .camera-wrap.state-INVALID,
    .camera-wrap.state-error     { border-color: #ef4444; }

    .camera-video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .camera-video.hidden { display: none; }
    .camera-canvas { display: none; }

    /* Camera off */
    .camera-off {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: .75rem;
      color: #555; font-size: .85rem;
    }

    /* Viewfinder */
    .viewfinder {
      position: absolute; inset: 0; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
    }
    .vf-corner {
      position: absolute; width: 28px; height: 28px;
      border-color: #c9a84c; border-style: solid;
    }
    .tl { top: 20%; left: 15%; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
    .tr { top: 20%; right: 15%; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
    .bl { bottom: 20%; left: 15%; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
    .br { bottom: 20%; right: 15%; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
    .vf-line {
      position: absolute; left: 15%; right: 15%; height: 2px;
      background: linear-gradient(90deg, transparent, #c9a84c, transparent);
      animation: scan-line 2s ease-in-out infinite;
      top: 20%;
    }
    @keyframes scan-line {
      0%   { top: 20%; opacity: 1; }
      50%  { top: 80%; opacity: .8; }
      100% { top: 20%; opacity: 1; }
    }

    /* Feedback overlay */
    .feedback-overlay {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: .5rem;
      padding: 1.5rem; text-align: center; animation: fb-in .25s ease;
    }
    @keyframes fb-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }

    .fb-VALID     { background: rgba(34,197,94,.92); }
    .fb-DUPLICATE { background: rgba(245,158,11,.92); }
    .fb-EXPIRED,
    .fb-INVALID,
    .fb-error     { background: rgba(239,68,68,.92); }

    .fb-icon  { font-size: 3rem; line-height: 1; }
    .fb-title { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .fb-guest { font-size: 1rem; font-weight: 600; color: #fff; }
    .fb-event { font-size: .8rem; color: rgba(255,255,255,.8); }
    .fb-msg   { font-size: .78rem; color: rgba(255,255,255,.75); margin-top: .25rem; }

    /* Controls */
    .cam-controls {
      display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
    }
    .btn-cam {
      display: flex; align-items: center; gap: .4rem;
      padding: .55rem 1.25rem; border-radius: 8px; font-size: .85rem;
      font-weight: 600; cursor: pointer; border: 1px solid transparent;
      transition: opacity .15s;
    }
    .btn-cam.start {
      background: rgba(201,168,76,.15); border-color: rgba(201,168,76,.4); color: #c9a84c;
      &:hover { background: rgba(201,168,76,.25); }
    }
    .btn-cam.stop {
      background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.4); color: #ef4444;
      &:hover { background: rgba(239,68,68,.2); }
    }
    .cam-error { font-size: .78rem; color: #ef4444; }

    /* Manual */
    .manual-section {
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 1rem;
    }
    .manual-label { font-size: .75rem; color: #888; margin: 0 0 .6rem; text-transform: uppercase; letter-spacing: .05em; }
    .manual-row { display: flex; gap: .5rem; }
    .manual-input {
      flex: 1; background: #111; border: 1px solid #2a2a2a; border-radius: 8px;
      color: #e0e0e0; padding: .55rem .75rem; font-size: .875rem;
      &:focus { outline: none; border-color: #c9a84c; }
    }
    .btn-submit {
      padding: .55rem 1.1rem; background: #c9a84c; border: none; border-radius: 8px;
      color: #111; font-weight: 700; font-size: .85rem; cursor: pointer;
      transition: opacity .15s;
      &:disabled { opacity: .4; cursor: not-allowed; }
      &:hover:not(:disabled) { opacity: .85; }
    }
  `],
})
export class ScanComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly svc        = inject(CheckinService);
  private readonly zone       = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  cameraActive  = signal(false);
  cameraError   = signal<string | null>(null);
  state         = signal<FeedbackState>('idle');
  lastResult    = signal<ScanResponse | null>(null);
  counts        = signal({ valid: 0, duplicate: 0, invalid: 0, total: 0 });

  manualToken = '';

  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;
  private jsqr: ((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null = null;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      import('jsqr').then(m => { this.jsqr = m.default; });
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
    this.state.set('idle');
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

  private handleToken(token: string): void {
    this.processing = true;
    this.state.set('scanning');
    this.svc.scan(token).subscribe({
      next: (res) => this.zone.run(() => this.showResult(res.data!)),
      error: (err) => this.zone.run(() => {
        this.state.set('error');
        this.lastResult.set({ scanStatus: 'INVALID', message: err?.error?.message || 'Erreur réseau' });
        this.scheduleReset();
      }),
    });
  }

  private showResult(res: ScanResponse): void {
    this.lastResult.set(res);
    this.state.set(res.scanStatus as FeedbackState);
    this.counts.update(c => ({
      total:     c.total + 1,
      valid:     res.scanStatus === 'VALID'     ? c.valid + 1     : c.valid,
      duplicate: res.scanStatus === 'DUPLICATE' ? c.duplicate + 1 : c.duplicate,
      invalid:   (res.scanStatus === 'INVALID' || res.scanStatus === 'EXPIRED') ? c.invalid + 1 : c.invalid,
    }));
    this.scheduleReset();
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
