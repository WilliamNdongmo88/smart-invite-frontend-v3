import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <span class="empty-icon">{{ icon() }}</span>
      <p class="empty-title">{{ title() }}</p>
      @if (subtitle()) {
        <p class="empty-subtitle">{{ subtitle() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 3rem 1rem; text-align: center; gap: .75rem;
    }
    .empty-icon    { font-size: 3rem; }
    .empty-title   { color: #e8e8e8; font-size: 1rem; font-weight: 600; margin: 0; }
    .empty-subtitle{ color: #888; font-size: .875rem; margin: 0; }
  `],
})
export class EmptyStateComponent {
  icon     = input<string>('📭');
  title    = input<string>('Aucun élément');
  subtitle = input<string>('');
}
