import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { EventType, EVENT_TYPE_LABELS } from '../../../core/models/enums.model';

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="edit-page">

      <!-- Header -->
      <div class="page-header">
        <a [routerLink]="['/events', eventId()]" class="back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Retour à l'événement
        </a>
        <h1 class="page-title">Modifier l'événement</h1>
      </div>

      @if (loadingData()) {
        <div class="loader-wrap"><div class="spinner-lg"></div></div>
      } @else {

        <!-- Infos générales -->
        <div class="section-card">
          <h2 class="section-title">Informations générales</h2>
          <form [formGroup]="form">
            <div class="fields-grid">

              <div class="field full">
                <label class="label">Titre <span class="req">*</span></label>
                <input formControlName="title" type="text" class="input" [class.error]="isInvalid('title')"
                  placeholder="Ex : Mariage de Sophie & Thomas" />
                @if (isInvalid('title')) { <p class="field-error">Requis, minimum 3 caractères</p> }
              </div>

              <div class="field full">
                <label class="label">Type</label>
                <div class="type-grid">
                  @for (opt of typeOptions; track opt.key) {
                    <button type="button" class="type-card" [class.selected]="form.value.type === opt.key"
                      (click)="form.patchValue({ type: opt.key })">
                      <span class="type-icon">{{ opt.icon }}</span>
                      <span class="type-label">{{ opt.label }}</span>
                    </button>
                  }
                </div>
              </div>

              @if (isMariage) {
                <div class="field full">
                  <label class="label">Noms des mariés / fiancés</label>
                  <input formControlName="concernedNames" type="text" class="input" placeholder="Sophie & Thomas" />
                </div>
              }

              <div class="field">
                <label class="label">Invités maximum <span class="req">*</span></label>
                <input formControlName="maxGuests" type="number" class="input" [class.error]="isInvalid('maxGuests')" min="1" />
                @if (isInvalid('maxGuests')) { <p class="field-error">Minimum 1 invité</p> }
              </div>

              <div class="field">
                <label class="label">Montant à payer</label>
                <div class="budget-display">
                  💳 {{ computedBudget || '—' }}
                  @if (form.value.maxGuests && form.value.maxGuests > 0) {
                    <span class="budget-detail">({{ form.value.maxGuests }} invités × 52 XAF)</span>
                  }
                </div>
              </div>

              <div class="field full">
                <label class="label">Description</label>
                <textarea formControlName="description" class="input textarea" rows="3"
                  placeholder="Décrivez votre événement..."></textarea>
              </div>

            </div>
          </form>
        </div>

        <!-- Dates & Lieux -->
        <div class="section-card">
          <h2 class="section-title">{{ isMariage ? 'Lieux & dates' : 'Date & lieu' }}</h2>
          <form [formGroup]="form">

            @if (!isMariage) {
              <div class="fields-grid">
                <div class="field">
                  <label class="label">Date & heure</label>
                  <input formControlName="eventDate" type="datetime-local" class="input" />
                </div>
              </div>
            } @else {
              <div class="wedding-sections">

                <div class="wedding-block">
                  <div class="wedding-block-header">
                    <span class="wb-icon">⛪</span>
                    <h3 class="wb-title">Cérémonie religieuse</h3>
                    <label class="toggle-label">
                      <input type="checkbox" formControlName="showWeddingReligiousLocation" class="toggle-input" />
                      <span class="toggle-track"><span class="toggle-thumb"></span></span>
                      <span class="toggle-text">Sur l'invitation</span>
                    </label>
                  </div>
                  <div class="fields-grid">
                    <div class="field">
                      <label class="label">Lieu</label>
                      <input formControlName="religiousLocation" type="text" class="input" placeholder="Église Saint-Pierre" />
                    </div>
                    <div class="field">
                      <label class="label">Date & heure</label>
                      <input formControlName="religiousDateTime" type="datetime-local" class="input" />
                    </div>
                  </div>
                </div>

                <div class="wedding-block">
                  <div class="wedding-block-header">
                    <span class="wb-icon">🏛️</span>
                    <h3 class="wb-title">Cérémonie civile</h3>
                  </div>
                  <div class="fields-grid">
                    <div class="field">
                      <label class="label">Lieu</label>
                      <input formControlName="civilLocation" type="text" class="input" placeholder="Mairie centrale" />
                    </div>
                    <div class="field">
                      <label class="label">Date & heure</label>
                      <input formControlName="civilDateTime" type="datetime-local" class="input" />
                    </div>
                  </div>
                </div>

                <div class="wedding-block">
                  <div class="wedding-block-header">
                    <span class="wb-icon">🥂</span>
                    <h3 class="wb-title">Réception / Banquet</h3>
                  </div>
                  <div class="fields-grid">
                    <div class="field">
                      <label class="label">Lieu</label>
                      <input formControlName="banquetLocation" type="text" class="input" placeholder="Palais des fêtes" />
                    </div>
                    <div class="field">
                      <label class="label">Date & heure</label>
                      <input formControlName="banquetDateTime" type="datetime-local" class="input" />
                    </div>
                  </div>
                </div>

              </div>
            }
          </form>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <a [routerLink]="['/events', eventId()]" class="btn-cancel">Annuler</a>
          <button type="button" class="btn-save" [disabled]="loading()" (click)="onSubmit()">
            @if (loading()) {
              <span class="spinner"></span> Enregistrement...
            } @else {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Enregistrer les modifications
            }
          </button>
        </div>

      }
    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; }

    .edit-page {
      display: flex; flex-direction: column; gap: 1.5rem;
      width: 100%; max-width: 720px; min-width: 0;
    }

    .page-header { display: flex; flex-direction: column; gap: 0.5rem; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 0.35rem;
      color: #666; font-size: 0.8rem; text-decoration: none; width: fit-content;
      transition: color 0.2s;
      &:hover { color: #c9a84c; }
    }

    .page-title { font-size: clamp(1.2rem,4vw,1.6rem); font-weight: 800; color: #fff; margin: 0; }

    .loader-wrap { display: flex; justify-content: center; padding: 4rem; }
    .spinner-lg {
      width: 36px; height: 36px; border: 3px solid #2a2a2a;
      border-top-color: #c9a84c; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .section-card {
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 14px;
      padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;
    }

    .section-title { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }

    .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; &.full { grid-column: 1 / -1; } }
    .label { font-size: 0.78rem; font-weight: 600; color: #aaa; }
    .req { color: #c9a84c; }

    .input {
      background: #141414; border: 1px solid #2a2a2a; border-radius: 8px;
      color: #e5e5e5; font-size: 0.875rem; padding: 0.6rem 0.875rem;
      outline: none; width: 100%; transition: border-color 0.2s; font-family: inherit;
      &::placeholder { color: #444; }
      &:focus { border-color: #c9a84c; }
      &.error { border-color: #f87171; }
      &[type="datetime-local"] { color-scheme: dark; }
    }
    .textarea { resize: vertical; min-height: 80px; }
    .field-error { font-size: 0.72rem; color: #f87171; margin: 0; }

    .budget-display {
      background: #141414; border: 1px solid #2a2a2a; border-radius: 8px;
      color: #c9a84c; font-size: 0.875rem; font-weight: 600;
      padding: 0.6rem 0.875rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
    }
    .budget-detail { font-size: 0.75rem; font-weight: 400; color: #666; }

    /* Type grid */
    .type-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 0.6rem; }
    .type-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
      padding: 0.875rem 0.4rem; background: #141414; border: 1px solid #2a2a2a;
      border-radius: 10px; cursor: pointer; transition: border-color 0.2s, background 0.2s;
      &:hover { border-color: #444; background: #1e1e1e; }
      &.selected { border-color: #c9a84c; background: rgba(201,168,76,0.08); }
    }
    .type-icon  { font-size: 1.5rem; line-height: 1; }
    .type-label {
      font-size: 0.62rem; font-weight: 600; color: #888; text-align: center; line-height: 1.3;
      .type-card.selected & { color: #c9a84c; }
    }

    /* Wedding blocks */
    .wedding-sections { display: flex; flex-direction: column; gap: 1rem; }
    .wedding-block {
      background: #141414; border: 1px solid #242424; border-radius: 10px;
      padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.875rem;
    }
    .wedding-block-header { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .wb-icon { font-size: 1.1rem; }
    .wb-title { font-size: 0.875rem; font-weight: 700; color: #e5e5e5; margin: 0; flex: 1; }

    /* Toggle */
    .toggle-label { display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-left: auto; }
    .toggle-input { display: none; }
    .toggle-track {
      width: 36px; height: 20px; background: #2a2a2a; border-radius: 20px;
      position: relative; transition: background 0.2s; flex-shrink: 0;
    }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
      background: #fff; border-radius: 50%; transition: transform 0.2s;
    }
    .toggle-input:checked + .toggle-track { background: #c9a84c; }
    .toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(16px); }
    .toggle-text { font-size: 0.7rem; color: #666; white-space: nowrap; }

    /* Actions */
    .form-actions {
      display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
    }
    .btn-cancel {
      display: inline-flex; align-items: center; padding: 0.6rem 1.25rem;
      background: none; border: 1px solid #333; border-radius: 8px;
      color: #888; font-size: 0.875rem; font-weight: 600; text-decoration: none;
      transition: border-color 0.2s, color 0.2s;
      &:hover { border-color: #555; color: #ccc; }
    }
    .btn-save {
      display: inline-flex; align-items: center; gap: 0.45rem;
      background: #c9a84c; color: #111; font-weight: 700; font-size: 0.875rem;
      padding: 0.65rem 1.5rem; border-radius: 8px; border: none; cursor: pointer;
      transition: background 0.2s;
      &:hover:not(:disabled) { background: #b8943e; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.3);
      border-top-color: #111; border-radius: 50%; animation: spin 0.7s linear infinite;
    }

    @media (max-width: 640px) {
      .section-card { padding: 1.25rem; }
      .fields-grid  { grid-template-columns: 1fr; }
      .field.full   { grid-column: 1; }
      .type-grid    { grid-template-columns: repeat(3,1fr); }
      .wedding-block { padding: 0.875rem; }
      .form-actions { flex-direction: column; }
      .btn-cancel, .btn-save { width: 100%; justify-content: center; }
    }
    @media (max-width: 400px) {
      .type-grid { grid-template-columns: repeat(2,1fr); }
    }
  `],
})
export class EventEditComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);
  private readonly svc    = inject(EventService);
  private readonly toast  = inject(ToastService);

  eventId     = signal(0);
  loading     = signal(false);
  loadingData = signal(true);

  readonly typeOptions = [
    { key: 'MARIAGE'                 as EventType, label: 'Mariage',                 icon: '💍' },
    { key: 'FIANCAILLES'             as EventType, label: 'Fiançailles',             icon: '💒' },
    { key: 'ANNIVERSAIRE_MARIAGE'    as EventType, label: 'Anniversaire de mariage', icon: '🥂' },
    { key: 'ANNIVERSAIRE'            as EventType, label: 'Anniversaire',            icon: '🎂' },
    { key: 'EVENEMENT_PROFESSIONNEL' as EventType, label: 'Événement professionnel', icon: '💼' },
  ];

  form = this.fb.group({
    title:          ['', [Validators.required, Validators.minLength(3)]],
    type:           ['' as EventType, Validators.required],
    concernedNames: [''],
    maxGuests:      [1, [Validators.required, Validators.min(1)]],
    description:    [''],
    eventDate:      [''],
    religiousLocation:            [''],
    religiousDateTime:            [''],
    civilLocation:                [''],
    civilDateTime:                [''],
    banquetLocation:              [''],
    banquetDateTime:              [''],
    showWeddingReligiousLocation: [true],
  });

  get isMariage(): boolean {
    const t = this.form.value.type;
    return t === 'MARIAGE' || t === 'FIANCAILLES';
  }

  get computedBudget(): string {
    const n = Number(this.form.value.maxGuests) || 0;
    return n > 0 ? `${(n * 52).toLocaleString('fr-FR')} XAF` : '';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/events']); return; }
    this.eventId.set(id);

    this.svc.findById(id).subscribe({
      next: ({ data }) => {
        if (!data) { this.router.navigate(['/events']); return; }
        this.form.patchValue({
          title:          data.title,
          type:           data.type,
          concernedNames: data.concernedNames ?? '',
          maxGuests:      data.maxGuests,
          description:    data.description ?? '',
          eventDate:      this.toLocalInput(data.eventDate),
          religiousLocation: data.religiousLocation ?? '',
          religiousDateTime: this.toLocalInput(data.religiousDateTime),
          civilLocation:     data.civilLocation ?? '',
          civilDateTime:     this.toLocalInput(data.civilDateTime),
          banquetLocation:   data.banquetLocation ?? '',
          banquetDateTime:   this.toLocalInput(data.banquetDateTime),
          showWeddingReligiousLocation: data.showWeddingReligiousLocation,
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error('Impossible de charger l\'événement');
        this.router.navigate(['/events']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;

    const payload: any = {
      title:          v.title,
      type:           v.type,
      description:    v.description    || undefined,
      concernedNames: v.concernedNames || undefined,
      maxGuests:      v.maxGuests,
      budget:         this.computedBudget || undefined,
      eventDate:      this.isMariage ? (v.civilDateTime || undefined) : (v.eventDate || undefined),
      showWeddingReligiousLocation: this.isMariage ? v.showWeddingReligiousLocation : false,
      importMyModelCard: false,
    };

    if (this.isMariage) {
      payload.religiousLocation = v.religiousLocation || undefined;
      payload.religiousDateTime = v.religiousDateTime || undefined;
      payload.civilLocation     = v.civilLocation     || undefined;
      payload.civilDateTime     = v.civilDateTime     || undefined;
      payload.banquetLocation   = v.banquetLocation   || undefined;
      payload.banquetDateTime   = v.banquetDateTime   || undefined;
    }

    this.svc.update(this.eventId(), payload).subscribe({
      next: () => {
        this.toast.success('Événement mis à jour avec succès !');
        this.router.navigate(['/events', this.eventId()]);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Erreur lors de la mise à jour');
      },
    });
  }

  private toLocalInput(dt: string | null | undefined): string {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    // Format: YYYY-MM-DDTHH:mm (required by datetime-local input)
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
