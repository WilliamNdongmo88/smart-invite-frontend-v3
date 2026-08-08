import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="overlay" (click)="onCancel()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h3 class="modal-title">{{ title() }}</h3>
          <p class="modal-message">{{ message() }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">Annuler</button>
            <button class="btn-confirm" [class.danger]="danger()" (click)="onConfirm()">
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 9000;
    }
    .modal {
      background: #1a1a1a; border: 1px solid #c9a84c;
      border-radius: .75rem; padding: 1.75rem;
      width: 100%; max-width: 26rem;
    }
    .modal-title   { color: #c9a84c; font-size: 1.1rem; margin: 0 0 .75rem; }
    .modal-message { color: #ccc; font-size: .9rem; margin: 0 0 1.5rem; line-height: 1.6; }
    .modal-actions { display: flex; justify-content: flex-end; gap: .75rem; }
    .btn-cancel  { padding: .5rem 1.25rem; border-radius: .375rem; border: 1px solid #444; background: transparent; color: #aaa; cursor: pointer; }
    .btn-cancel:hover { border-color: #666; color: #fff; }
    .btn-confirm { padding: .5rem 1.25rem; border-radius: .375rem; border: none; background: #c9a84c; color: #111; font-weight: 600; cursor: pointer; }
    .btn-confirm.danger { background: #dc2626; color: #fff; }
    .btn-confirm:hover { opacity: .9; }
  `],
})
export class ConfirmModalComponent {
  open         = input.required<boolean>();
  title        = input<string>('Confirmation');
  message      = input<string>('Êtes-vous sûr de vouloir continuer ?');
  confirmLabel = input<string>('Confirmer');
  danger       = input<boolean>(false);

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel():  void { this.cancelled.emit(); }
}
