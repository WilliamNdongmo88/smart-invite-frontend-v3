import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventService } from '../../../../core/services/event.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EventType } from '../../../../core/models/enums.model';

interface TypeOption { key: EventType; label: string; icon: string; }

@Component({
  selector: 'app-event-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: 'event-edit.component.html',
  styleUrl: 'event-edit.component.scss',
})
export class EventEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(EventService);
  private readonly toast = inject(ToastService);

  eventId     = signal(0);
  loadingData = signal(true);

  readonly typeOptions: TypeOption[] = [
    { key: 'MARIAGE',    label: 'Mariage',    icon: '💍' },
    { key: 'GALA',       label: 'Gala',       icon: '🎭' },
    { key: 'CONFERENCE', label: 'Conférence', icon: '🎤' },
    { key: 'CEREMONIE',  label: 'Autres Cérémonies',  icon: '🎗️' },
  ];

  form = this.fb.group({ type: ['' as EventType, Validators.required] });

  get selectedType(): EventType | '' { return this.form.value.type ?? ''; }
  get isMariage():    boolean { return this.selectedType === 'MARIAGE'; }
  get isGala():       boolean { return this.selectedType === 'GALA'; }
  get isConference(): boolean { return this.selectedType === 'CONFERENCE'; }
  get isCeremonie():  boolean { return this.selectedType === 'CEREMONIE'; }
  get hasSelection(): boolean { return !!this.selectedType; }

  selectType(type: EventType): void { this.form.patchValue({ type }); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/events']); return; }
    this.eventId.set(id);

    this.svc.findById(id).subscribe({
      next: (res) => {
        const e = res.data!;
        this.form.patchValue({ type: e.type });
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error("Impossible de charger l'événement");
        this.router.navigate(['/events']);
      },
    });
  }

  proceed(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const id   = this.eventId();
    const type = this.selectedType;
    const routes: Record<string, string[]> = {
      MARIAGE:    ['/events', String(id), 'wedding'],
      GALA:       ['/events', String(id), 'gala'],
      CONFERENCE: ['/events', String(id), 'conference'],
      CEREMONIE:  ['/events', String(id), 'ceremonie'],
    };
    if (type && routes[type]) {
      this.router.navigate(routes[type]);
    }
  }
}
