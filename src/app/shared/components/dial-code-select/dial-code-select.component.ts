import {
  Component,
  forwardRef,
  HostListener,
  inject,
  input,
  signal,
  computed,
  ElementRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DIAL_CODES, DialCodeEntry } from '../../../core/data/dial-codes';

@Component({
  selector: 'app-dial-code-select',
  standalone: true,
  templateUrl: './dial-code-select.component.html',
  styleUrls: ['./dial-code-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DialCodeSelectComponent),
      multi: true,
    },
  ],
})
export class DialCodeSelectComponent implements ControlValueAccessor {
  /** Classe de thème transmise depuis le parent (ex: 'theme-mariage') */
  themeClass = input<string>('');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly elRef      = inject(ElementRef);

  readonly allCodes = DIAL_CODES;

  selectedCode = signal<string>('+237');
  isOpen       = signal(false);
  search       = signal('');
  disabled     = signal(false);

  selected = computed<DialCodeEntry>(() => {
    return this.allCodes.find(d => d.code === this.selectedCode())
      ?? { iso: 'CM', name: 'Cameroun', flag: '🇨🇲', code: '+237' };
  });

  filtered = computed<DialCodeEntry[]>(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.allCodes;
    return this.allCodes.filter(
      d => d.name.toLowerCase().includes(q) || d.code.includes(q)
    );
  });

  // ControlValueAccessor
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    if (value) this.selectedCode.set(value);
  }

  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void             { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void         { this.disabled.set(isDisabled); }

  toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
    if (!this.isOpen()) this.search.set('');
    this.onTouched();
  }

  select(code: string): void {
    this.selectedCode.set(code);
    this.onChange(code);
    this.isOpen.set(false);
    this.search.set('');
  }

  /** Ferme le dropdown en cliquant en dehors */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.search.set('');
    }
  }

  /** Ferme avec Escape */
  @HostListener('keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
    this.search.set('');
  }
}
