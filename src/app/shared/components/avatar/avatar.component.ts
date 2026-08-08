import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="name()" class="avatar" [style.width.px]="size()" [style.height.px]="size()" />
    } @else {
      <div class="avatar initials" [style.width.px]="size()" [style.height.px]="size()" [style.font-size.px]="size() * 0.38">
        {{ initials() }}
      </div>
    }
  `,
  styles: [`
    .avatar {
      border-radius: 50%; object-fit: cover;
      border: 2px solid #c9a84c; flex-shrink: 0;
    }
    .initials {
      border-radius: 50%; background: #2a2a2a;
      border: 2px solid #c9a84c; color: #c9a84c;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; flex-shrink: 0;
    }
  `],
})
export class AvatarComponent {
  src  = input<string | null | undefined>(null);
  name = input<string>('');
  size = input<number>(40);

  initials = computed(() => {
    return this.name()
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  });
}
