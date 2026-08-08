import { Component, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgClass],
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button class="page-btn" [disabled]="currentPage() === 0" (click)="go(currentPage() - 1)">‹</button>
        @for (p of pages(); track p) {
          <button
            class="page-btn"
            [ngClass]="{ active: p === currentPage() }"
            (click)="go(p)"
          >{{ p + 1 }}</button>
        }
        <button class="page-btn" [disabled]="currentPage() === totalPages() - 1" (click)="go(currentPage() + 1)">›</button>
      </nav>
    }
  `,
  styles: [`
    .pagination { display: flex; align-items: center; gap: .375rem; justify-content: center; padding: 1rem 0; }
    .page-btn {
      min-width: 2rem; height: 2rem; padding: 0 .5rem;
      border-radius: .375rem; border: 1px solid #333;
      background: transparent; color: #ccc; cursor: pointer; font-size: .875rem;
    }
    .page-btn:hover:not(:disabled) { border-color: #c9a84c; color: #c9a84c; }
    .page-btn.active { background: #c9a84c; border-color: #c9a84c; color: #111; font-weight: 700; }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
  `],
})
export class PaginationComponent {
  currentPage  = input.required<number>();
  totalPages   = input.required<number>();
  pageChange   = output<number>();

  pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  go(page: number): void {
    if (page >= 0 && page < this.totalPages()) this.pageChange.emit(page);
  }
}
