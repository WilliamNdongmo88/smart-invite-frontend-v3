import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'si_lang';

/**
 * Service global d'internationalisation.
 *
 * Usage dans un composant :
 *   private readonly lang = inject(LanguageService);
 *   // Dans le template :
 *   {{ 'nav.logout' | translate }}
 *   // Ou appel direct :
 *   {{ lang.t('nav.logout') }}
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly http = inject(HttpClient);

  /** Langue active — signal global réactif */
  readonly activeLang = signal<Lang>(this.loadSaved());

  /**
   * Compteur incrémenté à chaque chargement réussi du fichier JSON.
   * Le TranslatePipe le lit pour déclencher sa réévaluation après le chargement async.
   */
  readonly translationsVersion = signal<number>(0);

  /** Dictionnaire actif chargé en mémoire */
  private translations: Record<string, unknown> = {};

  constructor() {
    this.loadTranslations(this.activeLang());
  }

  // ── API publique ────────────────────────────────────────────────────────────

  /** Bascule entre FR et EN */
  toggle(): void {
    const next: Lang = this.activeLang() === 'fr' ? 'en' : 'fr';
    this.activeLang.set(next);
    localStorage.setItem(STORAGE_KEY, next);
    this.loadTranslations(next);
  }

  /** Traduit une clé pointée (ex : 'nav.logout', 'users.title') */
  t(key: string): string {
    const parts = key.split('.');
    let current: unknown = this.translations;

    for (const part of parts) {
      if (current == null || typeof current !== 'object') return key;
      current = (current as Record<string, unknown>)[part];
    }

    return typeof current === 'string' ? current : key;
  }

  /** Retourne un tableau depuis le dictionnaire (ex : 'home.chapters') */
  tArray<T = Record<string, unknown>>(key: string): T[] {
    const parts = key.split('.');
    let current: unknown = this.translations;

    for (const part of parts) {
      if (current == null || typeof current !== 'object') return [];
      current = (current as Record<string, unknown>)[part];
    }

    return Array.isArray(current) ? (current as T[]) : [];
  }

  // ── Chargement ──────────────────────────────────────────────────────────────

  private loadTranslations(lang: Lang): void {
    this.http.get<Record<string, unknown>>(`/assets/i18n/${lang}.json`)
      .subscribe({
        next: data => {
          this.translations = data;
          // Incrémenter le version signal pour forcer la réévaluation
          // du TranslatePipe (impure) après le chargement asynchrone
          this.translationsVersion.update(v => v + 1);
        },
        error: () => {
          console.warn(`[i18n] Impossible de charger /assets/i18n/${lang}.json`);
        },
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private loadSaved(): Lang {
    const saved = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    return (saved === 'en' || saved === 'fr') ? saved : 'fr';
  }
}
