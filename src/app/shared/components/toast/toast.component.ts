import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [ngClass]="toast.type" role="alert">
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Fermer">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 22rem;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      animation: slideIn .2s ease;
      color: #fff;
    }
    .toast.success  { background: #16a34a; }
    .toast.error    { background: #dc2626; }
    .toast.info     { background: #2563eb; }
    .toast.warning  { background: #d97706; }
    .toast-message  { flex: 1; }
    .toast-close    { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; padding: 0; opacity: .8; }
    .toast-close:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
  readonly icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
}
