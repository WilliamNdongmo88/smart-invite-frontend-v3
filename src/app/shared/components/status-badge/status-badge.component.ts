import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'blue';

const STATUS_MAP: Record<string, BadgeVariant> = {
  // RsvpStatus
  PENDING:      'neutral',
  CONFIRMED:    'success',
  DECLINED:     'error',
  PRESENT:      'blue',
  // PaymentStatus
  UNDER_REVIEW: 'warning',
  APPROVED:     'success',
  REJECTED:     'error',
  // EventStatus
  PLANNED:      'info',
  ACTIVE:       'success',
  COMPLETED:    'neutral',
  CANCELLED:    'error',
  // InvitationStatus
  ACTIVE:       'success',
  REVOKED:      'error',
  USED:         'blue',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:      'En attente',
  CONFIRMED:    'Confirmé',
  DECLINED:     'Décliné',
  PRESENT:      'Présent',
  UNDER_REVIEW: 'En vérification',
  APPROVED:     'Approuvé',
  REJECTED:     'Rejeté',
  PLANNED:      'Planifié',
  ACTIVE:       'Actif',
  COMPLETED:    'Terminé',
  CANCELLED:    'Annulé',
  REVOKED:      'Révoqué',
  USED:         'Utilisé',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="variant">
      {{ label() || STATUS_LABELS[status()] || status() }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex; align-items: center;
      padding: .2rem .65rem; border-radius: 9999px;
      font-size: .75rem; font-weight: 600; white-space: nowrap;
    }
    .success { background: #dcfce7; color: #15803d; }
    .error   { background: #fee2e2; color: #b91c1c; }
    .warning { background: #fef3c7; color: #b45309; }
    .info    { background: #dbeafe; color: #1d4ed8; }
    .neutral { background: #f3f4f6; color: #4b5563; }
    .blue    { background: #e0f2fe; color: #0369a1; }
  `],
})
export class StatusBadgeComponent {
  status = input.required<string>();
  label  = input<string>('');
  readonly STATUS_LABELS = STATUS_LABELS;
  get variant(): BadgeVariant { return STATUS_MAP[this.status()] ?? 'neutral'; }
}
