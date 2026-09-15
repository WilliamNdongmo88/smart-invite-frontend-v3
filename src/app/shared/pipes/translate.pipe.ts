import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

/**
 * Pipe de traduction.
 *
 * Utilisation dans un template Angular :
 *   {{ 'nav.logout' | translate }}
 *   {{ 'users.title' | translate }}
 *
 * Le pipe est impure et lit deux signaux :
 *  - activeLang     → se réévalue quand la langue bascule
 *  - translationsVersion → se réévalue quand le fichier JSON est chargé (async)
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,   // impure → réévalué à chaque détection de changement
})
export class TranslatePipe implements PipeTransform {

  private readonly langSvc = inject(LanguageService);

  transform(key: string): string {
    // Lire les deux signaux pour déclencher la réactivité Angular :
    // 1. activeLang  — changement de langue via toggle()
    // 2. translationsVersion — fichier JSON chargé après appel HTTP async
    this.langSvc.activeLang();
    this.langSvc.translationsVersion();
    return this.langSvc.t(key);
  }
}
