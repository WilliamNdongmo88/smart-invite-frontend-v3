import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CheckinService } from '../../../../core/services/checkin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AgentResponse } from '../../../../core/models/checkin.model';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: 'agents.component.html',
  styleUrl: 'agents.component.scss',
})
export class AgentsComponent implements OnInit {
  private readonly svc   = inject(CheckinService);
  private readonly fb    = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  agents   = signal<AgentResponse[]>([]);
  loading  = signal(true);
  saving   = signal(false);
  showForm = signal(false);
  deleteId = signal<number | null>(null);
  deleting = signal(false);

  form = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(3)]],
    whatsapp: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAgents().subscribe({
      next: (res) => { this.agents.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void { this.form.reset(); this.showForm.set(true); }
  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    this.svc.createAgent({ userName: v.userName!, whatsapp: v.whatsapp! }).subscribe({
      next: () => {
        this.toast.success('Agent créé ! Les identifiants ont été envoyés par WhatsApp.');
        this.closeForm();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de la création');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(id: number): void { this.deleteId.set(id); }
  cancelDelete(): void { this.deleteId.set(null); }

  doDelete(): void {
    const id = this.deleteId();
    if (!id) return;
    this.deleting.set(true);
    this.svc.deleteAgent(id).subscribe({
      next: () => {
        this.toast.success('Agent supprimé');
        this.deleteId.set(null);
        this.deleting.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de la suppression');
        this.deleting.set(false);
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  /** Email de connexion de l'agent (format identique au backend). */
  agentEmail(userName: string): string {
    return userName.toLowerCase() + '@agent.smartinvite.local';
  }

  /** Mot de passe de l'agent = numéro WhatsApp sans le '+'. */
  agentPassword(whatsapp: string): string {
    return whatsapp.replace(/^\+/, '');
  }

  // ── Copie presse-papiers ──
  copiedId = signal<string | null>(null);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  copy(text: string, key: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId.set(key);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copiedId.set(null), 2000);
    }).catch(() => {});
  }
}
