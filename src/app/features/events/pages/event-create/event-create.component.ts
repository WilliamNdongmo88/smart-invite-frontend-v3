import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventType } from '../../../../core/models/enums.model';

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
  private readonly router = inject(Router);

  readonly typeOptions: TypeOption[] = [
    { key: 'MARIAGE',    label: 'Mariage',    icon: '💍' },
    { key: 'GALA',       label: 'Gala',       icon: '🎭' },
    { key: 'CONFERENCE', label: 'Conférence', icon: '🎤' },
    { key: 'CEREMONIE',  label: 'Autres Cérémonies',  icon: '🎗️' },
  ];

  form = this.fb.group({
    type: ['' as EventType, Validators.required],
  });

  get selectedType(): EventType | '' { return this.form.value.type ?? ''; }
  get isMariage():    boolean { return this.selectedType === 'MARIAGE'; }
  get isGala():       boolean { return this.selectedType === 'GALA'; }
  get isConference(): boolean { return this.selectedType === 'CONFERENCE'; }
  get isCeremonie():  boolean { return this.selectedType === 'CEREMONIE'; }
  get hasSelection(): boolean { return !!this.selectedType; }

  selectType(type: EventType): void { this.form.patchValue({ type }); }

  proceed(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const type = this.selectedType;
    const routes: Record<string, string[]> = {
      MARIAGE:    ['/events/wedding/new'],
      GALA:       ['/events/gala/new'],
      CONFERENCE: ['/events/conference/new'],
      CEREMONIE:  ['/events/ceremonie/new'],
    };
    if (type && routes[type]) {
      this.router.navigate(routes[type]);
    }
  }
}
