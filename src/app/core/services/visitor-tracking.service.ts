import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { catchError, EMPTY, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── DTOs ──────────────────────────────────────────────────────────────────────

interface TrackResponse {
  sessionId: number;
  message: string;
}

interface ApiTrackResponse {
  data: TrackResponse;
}

// ── Clé de stockage session ───────────────────────────────────────────────────
const SESSION_KEY = 'si_visitor_session_id';

/**
 * Service de tracking côté navigateur.
 *
 * Responsabilités :
 * - Envoyer un pageview (POST /api/track/pageview) à chaque navigation.
 * - Maintenir le sessionId en sessionStorage pour regrouper les pageviews.
 * - Envoyer un heartbeat toutes les 2 minutes pour les sessions longues.
 * - Envoyer une fin de session (POST /api/track/end) sur beforeunload.
 *
 * Aucune donnée personnelle n'est envoyée : l'IP et le User-Agent sont lus
 * côté serveur via HttpServletRequest. Le front envoie uniquement l'URL.
 */
@Injectable({ providedIn: 'root' })
export class VisitorTrackingService {

  private readonly http        = inject(HttpClient);
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly base        = `${environment.apiUrl}/api/track`;

  /** ID de la session courante, persisté en sessionStorage */
  private sessionId: number | null = null;

  /** Référence au setInterval du heartbeat */
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // ── Initialisation ──────────────────────────────────────────────────────────

  /**
   * À appeler une seule fois depuis AppComponent.ngOnInit().
   * Charge le sessionId existant, enregistre le premier pageview,
   * démarre le heartbeat et lie beforeunload.
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) { return; }

    // Récupérer la session existante s'il en existe une
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      this.sessionId = Number(stored);
    }

    // Enregistrer le premier pageview
    this.trackPageView(window.location.pathname);

    // Heartbeat toutes les 2 minutes
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 2 * 60 * 1000);

    // Fin de session quand l'onglet se ferme
    window.addEventListener('beforeunload', () => this.endSession());
  }

  // ── Tracking d'une page ─────────────────────────────────────────────────────

  /**
   * Enregistre un pageview pour l'URL donnée.
   * Si aucune session n'existe encore, le serveur en crée une nouvelle
   * et retourne le sessionId dans la réponse.
   *
   * @param pageUrl URL de la page (ex. '/events', '/dashboard')
   */
  trackPageView(pageUrl: string): void {
    if (!isPlatformBrowser(this.platformId)) { return; }

    const body = { pageUrl, sessionId: this.sessionId };

    this.http.post<ApiTrackResponse>(`${this.base}/pageview`, body)
      .pipe(catchError(() => EMPTY))
      .subscribe(res => {
        if (res?.data?.sessionId) {
          this.sessionId = res.data.sessionId;
          sessionStorage.setItem(SESSION_KEY, String(this.sessionId));
        }
      });
  }

  // ── Heartbeat ───────────────────────────────────────────────────────────────

  private sendHeartbeat(): void {
    if (!this.sessionId) { return; }

    this.http.post(`${this.base}/heartbeat`, { sessionId: this.sessionId })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  // ── Fin de session ──────────────────────────────────────────────────────────

  private endSession(): void {
    if (!this.sessionId) { return; }

    // sendBeacon est préféré pour les requêtes on-unload car il ne bloque pas
    // la fermeture de l'onglet et fonctionne même si la page se décharge.
    const url  = `${this.base}/end`;
    const body = JSON.stringify({ sessionId: this.sessionId });
    const sent = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));

    // Fallback synchrone si sendBeacon n'est pas disponible (rare)
    if (!sent) {
      this.http.post(url, { sessionId: this.sessionId })
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }

    // Nettoyage local
    this.sessionId = null;
    sessionStorage.removeItem(SESSION_KEY);
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
