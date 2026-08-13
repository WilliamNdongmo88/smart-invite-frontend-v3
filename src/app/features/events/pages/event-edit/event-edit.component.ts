import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EventType } from '../../../../core/models/enums.model';

type CardMode = 'NONE' | 'CUSTOM' | 'UPLOAD';
interface TypeOption { key: EventType; label: string; icon: string; }

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: 'event-edit.component.html',
  styleUrl: 'event-edit.component.scss',
})
export class EventEditComponent implements OnInit {
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly fb        = inject(FormBuilder);
  private readonly svc       = inject(EventService);
  private readonly toast     = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  eventId     = signal(0);
  step        = signal(1);
  loading     = signal(false);
  loadingData = signal(true);
  cardMode    = signal<CardMode>('NONE');
  uploadFile  = signal<File | null>(null);
  uploadPreview   = signal<string | null>(null);
  uploadObjectUrl = signal<SafeResourceUrl | null>(null);

  readonly TOTAL_STEPS = 4;

  readonly typeOptions: TypeOption[] = [
    { key: 'MARIAGE',                 label: 'Mariage',                 icon: '💍' },
    { key: 'FIANCAILLES',             label: 'Fiançailles',             icon: '💒' },
    { key: 'ANNIVERSAIRE_MARIAGE',    label: 'Anniversaire de mariage', icon: '🥂' },
    { key: 'ANNIVERSAIRE',            label: 'Anniversaire',            icon: '🎂' },
    { key: 'EVENEMENT_PROFESSIONNEL', label: 'Événement professionnel', icon: '💼' },
  ];

  // ── Step 1 ──
  step1 = this.fb.group({ type: ['' as EventType, Validators.required] });

  // ── Step 2 ──
  step2 = this.fb.group({
    title:          ['', [Validators.required, Validators.minLength(3)]],
    concernedNames: [''],
    maxGuests:      [50, [Validators.required, Validators.min(1)]],
    description:    [''],
  });

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
    title:            [''],
    mainMessage:      [''],
    mainMessagePart1: [''],
    mainMessagePart2: [''],
    sousMainMessage:  [''],
    eventTheme:       [''],
    dressCodeMessage: [''],
    qrInstructions:   [''],
    thanksMessage1:   [''],
    closingMessage:   [''],
  });

  get isMariage(): boolean {
    const t = this.step1.value.type;
    return t === 'MARIAGE' || t === 'FIANCAILLES';
  }

  get progress(): number { return (this.step() / this.TOTAL_STEPS) * 100; }

  get computedBudget(): string {
    const n = Number(this.step2.value.maxGuests) || 0;
    return n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
  }

  selectType(type: EventType): void { this.step1.patchValue({ type }); }
  setCardMode(mode: CardMode): void { this.cardMode.set(mode); }

  isInvalid(form: any, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/events']); return; }
    this.eventId.set(id);

    forkJoin({
      event: this.svc.findById(id),
      card:  this.svc.getCard(id).pipe(catchError(() => of({ data: null }))),
    }).subscribe({
      next: ({ event, card }) => {
        const e = event.data!;
        this.step1.patchValue({ type: e.type });
        this.step2.patchValue({
          title:          e.title,
          concernedNames: e.concernedNames ?? '',
          maxGuests:      e.maxGuests,
          description:    e.description ?? '',
        });
        this.step3.patchValue({
          eventDate:         this.toLocalInput(e.eventDate),
          religiousLocation: e.religiousLocation ?? '',
          religiousDateTime: this.toLocalInput(e.religiousDateTime),
          civilLocation:     e.civilLocation ?? '',
          civilDateTime:     this.toLocalInput(e.civilDateTime),
          banquetLocation:   e.banquetLocation ?? '',
          banquetDateTime:   this.toLocalInput(e.banquetDateTime),
          showWeddingReligiousLocation: e.showWeddingReligiousLocation,
        });
        // Déterminer le mode carte selon importMyModelCard
        if (e.importMyModelCard) {
          this.cardMode.set('UPLOAD');
          // Pré-charger le PDF existant dans l'iframe via pdfUrl
          const pdfUrl = card.data?.card?.pdfUrl ?? card.data?.invitationNote?.pdfUrl;
          if (pdfUrl) {
            this.uploadPreview.set('Modèle importé (existant)');
            this.uploadObjectUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl));
          }
        } else {
          const c = card.data?.card ?? card.data?.invitationNote;
          if (c) {
            this.cardMode.set('CUSTOM');
            this.cardForm.patchValue({
              title:            c.title            ?? '',
              mainMessage:      c.mainMessage      ?? '',
              mainMessagePart1: c.mainMessagePart1 ?? '',
              mainMessagePart2: c.mainMessagePart2 ?? '',
              sousMainMessage:  c.sousMainMessage  ?? '',
              eventTheme:       c.eventTheme       ?? '',
              dressCodeMessage: c.dressCodeMessage ?? '',
              qrInstructions:   c.qrInstructions   ?? '',
              thanksMessage1:   c.thanksMessage1   ?? '',
              closingMessage:   c.closingMessage   ?? '',
            });
          }
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error("Impossible de charger l'événement");
        this.router.navigate(['/events']);
      },
    });
  }

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

    if (this.isMariage) {
      base.religiousLocation = v3.religiousLocation || undefined;
      base.religiousDateTime = v3.religiousDateTime || undefined;
      base.civilLocation     = v3.civilLocation     || undefined;
      base.civilDateTime     = v3.civilDateTime     || undefined;
      base.banquetLocation   = v3.banquetLocation   || undefined;
      base.banquetDateTime   = v3.banquetDateTime   || undefined;
    }

    const id = this.eventId();

    // ── Cas 1 : sans carte ──
    if (mode === 'NONE') {
      this.svc.update(id, base).subscribe({
        next: () => this.done(),
        error: () => this.fail(),
      });
      return;
    }

    // ── Cas 2 : carte personnalisée ──
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
      this.svc.updateWithCard(id, payload).subscribe({
        next: () => this.done(),
        error: () => this.fail(),
      });
      return;
    }

    // ── Cas 3 : upload PDF ──
    const file = this.uploadFile();
    if (!file) { this.toast.error('Veuillez sélectionner un fichier PDF'); this.loading.set(false); return; }

    this.svc.update(id, base).pipe(
      switchMap(() => this.svc.uploadCustomCard(id, file))
    ).subscribe({
      next: () => this.done(),
      error: () => this.fail(),
    });
  }

  formatPreviewDate(dt: string | null | undefined): string {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const days   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const h = d.getHours().toString().padStart(2,'0');
    const m = d.getMinutes().toString().padStart(2,'0');
    return `le ${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}:${m}`;
  }

  private toLocalInput(dt: string | null | undefined): string {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private done(): void {
    this.loading.set(false);
    this.toast.success('Événement mis à jour avec succès !');
    this.router.navigate(['/events', this.eventId()]);
  }

  private fail(): void {
    this.loading.set(false);
    this.toast.error('Erreur lors de la mise à jour');
  }
}
