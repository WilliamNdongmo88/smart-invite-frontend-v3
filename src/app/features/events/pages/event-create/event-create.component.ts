import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { switchMap } from 'rxjs/operators';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EventType } from '../../../../core/models/enums.model';

type CardMode = 'NONE' | 'CUSTOM' | 'UPLOAD';
interface TypeOption { key: EventType; label: string; icon: string; }

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: 'event-create.component.html',
  styleUrl: 'event-create.component.scss',
})
export class EventCreateComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly svc    = inject(EventService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

  private readonly sanitizer = inject(DomSanitizer);

  step    = signal(1);
  loading = signal(false);
  cardMode = signal<CardMode>('NONE');
  uploadFile = signal<File | null>(null);
  uploadPreview = signal<string | null>(null);
  uploadObjectUrl = signal<SafeResourceUrl | null>(null);

  // Photo couple
  couplePhotoFile   = signal<File | null>(null);
  couplePhotoPreview = signal<string | null>(null);

  readonly TOTAL_STEPS = 4;

  readonly typeOptions: TypeOption[] = [
    { key: 'MARIAGE',                 label: 'Mariage',                 icon: '💍' },
    { key: 'FIANCAILLES',             label: 'Fiançailles',             icon: '💒' },
    { key: 'ANNIVERSAIRE_MARIAGE',    label: 'Anniversaire de mariage', icon: '🥂' },
    { key: 'ANNIVERSAIRE',            label: 'Anniversaire',            icon: '🎂' },
    { key: 'EVENEMENT_PROFESSIONNEL', label: 'Événement professionnel', icon: '💼' },
  ];

  // ── Step 1 ──
  step1 = this.fb.group({
    type: ['' as EventType, Validators.required],
  });

  // ── Step 2 ──
  step2 = this.fb.group({
    title:          ['', [Validators.required, Validators.minLength(3)]],
    concernedNames: [''],
    maxGuests:      [50, [Validators.required, Validators.min(1)]],
    description:    [''],
  });

  get computedBudget(): string {
    const n = Number(this.step2.value.maxGuests) || 0;
    return n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
  }

  // ── Step 3 ──
  step3 = this.fb.group({
    eventDate:         [''],
    religiousLocation: [''],
    religiousDateTime: [''],
    civilLocation:     [''],
    civilDateTime:     [''],
    banquetLocation:   [''],
    banquetDateTime:   [''],
    showWeddingReligiousLocation: [true],
  });

  // ── Step 4 : card fields ──
  cardForm = this.fb.group({
    title:            ["Vous êtes cordialement invités à notre mariage"],
    mainMessage:      ["C'est avec une immense joie que nous vous invitons à célébrer notre union."],
    mainMessagePart1: ['Votre présence à nos côtés sera pour nous un immense bonheur.'],
    mainMessagePart2: ["Nous espérons partager avec vous des moments de joie, d'amour et de convivialité."],
    sousMainMessage:  ['Merci de confirmer votre présence avant le 25 juillet 2026.'],
    eventTheme:       ['Chic & Glamour'],
    dressCodeMessage: ['Tenue de soirée élégante souhaitée.'],
    qrInstructions:   ["Présentez ce QR Code à l'entrée de la réception pour faciliter votre accueil."],
    thanksMessage1:   ['Merci de partager ce moment unique avec nous.'],
    closingMessage:   ["Au plaisir de vous accueillir pour célébrer ensemble cette journée inoubliable."],
  });

  get isMariage(): boolean {
    const t = this.step1.value.type;
    return t === 'MARIAGE' || t === 'FIANCAILLES';
  }

  get progress(): number { return (this.step() / this.TOTAL_STEPS) * 100; }

  selectType(type: EventType): void { this.step1.patchValue({ type }); }
  setCardMode(mode: CardMode): void { this.cardMode.set(mode); }

  isInvalid(form: any, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onCouplePhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.toast.error('Seules les images sont acceptées'); return; }
    this.couplePhotoFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.couplePhotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { this.toast.error('Seuls les fichiers PDF sont acceptés'); return; }
    if (this.uploadObjectUrl()) URL.revokeObjectURL(this.uploadObjectUrl() as string);
    this.uploadFile.set(file);
    this.uploadPreview.set(file.name);
    this.uploadObjectUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file)));
  }

  next(): void {
    const current = this.step();
    if (current === 1 && this.step1.invalid) { this.step1.markAllAsTouched(); return; }
    if (current === 2 && this.step2.invalid) { this.step2.markAllAsTouched(); return; }
    if (current < this.TOTAL_STEPS) this.step.set(current + 1);
  }

  prev(): void { if (this.step() > 1) this.step.set(this.step() - 1); }

  onSubmit(): void {
    this.loading.set(true);
    const mode = this.cardMode();
    const v1 = this.step1.value;
    const v2 = this.step2.value;
    const v3 = this.step3.value;

    const base: any = {
      title:          v2.title,
      type:           v1.type,
      description:    v2.description    || undefined,
      concernedNames: v2.concernedNames || undefined,
      maxGuests:      v2.maxGuests,
      budget:         this.computedBudget || undefined,
      eventDate:      this.isMariage ? (v3.civilDateTime || undefined) : (v3.eventDate || undefined),
      showWeddingReligiousLocation: this.isMariage ? v3.showWeddingReligiousLocation : false,
      importMyModelCard: mode === 'UPLOAD',
    };

    console.log('Submitting event with data:', base, 'Card mode:', mode, 'Upload file:', this.uploadFile());

    if (this.isMariage) {
      base.religiousLocation = v3.religiousLocation || undefined;
      base.religiousDateTime = v3.religiousDateTime || undefined;
      base.civilLocation     = v3.civilLocation     || undefined;
      base.civilDateTime     = v3.civilDateTime     || undefined;
      base.banquetLocation   = v3.banquetLocation   || undefined;
      base.banquetDateTime   = v3.banquetDateTime   || undefined;
    }

    // ── Cas 1 : sans carte ──
    if (mode === 'NONE') {
      this.svc.create(base).subscribe({
        next: (res) => this.doneWithPhoto(res.data!.id),
        error: () => this.fail(),
      });
      return;
    }

    // ── Cas 2 : avec carte personnalisée ──
    if (mode === 'CUSTOM') {
      const cv = this.cardForm.value;
      const payload = {
        event: { ...base, importMyModelCard: false },
        invitationNote: {
          title:            cv.title            || undefined,
          mainMessage:      cv.mainMessage      || undefined,
          mainMessagePart1: cv.mainMessagePart1 || undefined,
          mainMessagePart2: cv.mainMessagePart2 || undefined,
          sousMainMessage:  cv.sousMainMessage  || undefined,
          eventTheme:       cv.eventTheme       || undefined,
          dressCodeMessage: cv.dressCodeMessage || undefined,
          qrInstructions:   cv.qrInstructions   || undefined,
          thanksMessage1:   cv.thanksMessage1   || undefined,
          closingMessage:   cv.closingMessage   || undefined,
          hasInvitationModelCard: false,
        },
      };
      this.svc.createWithCard(payload).subscribe({
        next: (res) => this.doneWithPhoto(res.data!.event.id),
        error: () => this.fail(),
      });
      return;
    }

    // ── Cas 3 : upload PDF ──
    const file = this.uploadFile();
    if (!file) { this.toast.error('Veuillez sélectionner un fichier PDF'); this.loading.set(false); return; }

    this.svc.create(base).pipe(
      switchMap((res) => this.svc.uploadCustomCard(res.data!.id, file))
    ).subscribe({
      next: (res) => this.doneWithPhoto(undefined as any),
      error: () => this.fail(),
    });
  }

  formatPreviewDate(dt: string | null | undefined): string {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const h = d.getHours().toString().padStart(2,'0');
    const m = d.getMinutes().toString().padStart(2,'0');
    return `le ${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }

  private done(id?: number): void {
    this.loading.set(false);
    this.toast.success('Événement créé avec succès !');
    this.router.navigate(id ? ['/events', id] : ['/events']);
  }

  private doneWithPhoto(id: number): void {
    const photo = this.couplePhotoFile();
    if (photo && id) {
      this.svc.uploadCouplePhoto(id, photo).subscribe({
        next: () => this.done(id),
        error: () => { this.toast.error('Photo non uploadée'); this.done(id); },
      });
    } else {
      this.done(id);
    }
  }

  private fail(): void {
    this.loading.set(false);
    this.toast.error('Erreur lors de la création');
  }
}
