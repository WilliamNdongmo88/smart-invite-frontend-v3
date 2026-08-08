import { Component, inject } from '@angular/core';
import { LoaderService } from '../../../shared/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    @if (loaderService.loading()) {
      <div class="loader-overlay" role="status" aria-label="Chargement">
        <div class="spinner"></div>
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.35);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .spinner {
      width: 2.5rem; height: 2.5rem;
      border: 3px solid rgba(255,255,255,.3);
      border-top-color: #c9a84c;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoaderComponent {
  readonly loaderService = inject(LoaderService);
}
