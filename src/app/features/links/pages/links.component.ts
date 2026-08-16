import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LinkService } from '../../../core/services/link.service';
import { ToastService } from '../../../core/services/toast.service';
import { Link, CreateLinkRequest, UpdateLinkRequest } from '../../../core/models/checkin.model';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [FormsModule],
  templateUrl: 'links.component.html',
  styleUrl: 'links.component.scss',
})
export class LinksComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly linkSvc  = inject(LinkService);
  private readonly toast    = inject(ToastService);

  eventId  = 0;
  links    = signal<Link[]>([]);
  loading  = signal(true);
  deleting = signal<number | null>(null);
  saving   = signal(false);

  // Create modal
  createModal = signal(false);
  newLimit    = '';
  newExpiry   = '';

  // Edit modal
  editLink    = signal<Link | null>(null);
  editLimit   = '';
  editExpiry  = '';

  // Delete confirm
  deleteLink  = signal<Link | null>(null);

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.linkSvc.getByEvent(this.eventId).subscribe({
      next: (res) => { this.links.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.newLimit  = '';
    this.newExpiry = '';
    this.createModal.set(true);
  }

  create(): void {
    this.saving.set(true);
    const req: CreateLinkRequest = {
      eventId:      this.eventId,
      limitCount:   this.newLimit  ? Number(this.newLimit)  : undefined,
      dateLimitLink: this.newExpiry ? this.newExpiry + ':00' : undefined,
    };
    this.linkSvc.create(req).subscribe({
      next: () => { this.toast.success('Lien créé ✅'); this.createModal.set(false); this.load(); this.saving.set(false); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.saving.set(false); },
    });
  }

  openEdit(link: Link): void {
    this.editLink.set(link);
    this.editLimit  = link.limitCount != null ? String(link.limitCount) : '';
    this.editExpiry = link.dateLimitLink ? link.dateLimitLink.slice(0, 16) : '';
  }

  saveEdit(): void {
    const link = this.editLink();
    if (!link) return;
    this.saving.set(true);
    const req: UpdateLinkRequest = {
      limitCount:    this.editLimit  ? Number(this.editLimit)  : undefined,
      dateLimitLink: this.editExpiry ? this.editExpiry + ':00' : undefined,
    };
    this.linkSvc.update(link.id, req).subscribe({
      next: () => { this.toast.success('Lien mis à jour ✅'); this.editLink.set(null); this.load(); this.saving.set(false); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.saving.set(false); },
    });
  }

  confirmDelete(): void {
    const link = this.deleteLink();
    if (!link) return;
    this.deleting.set(link.id);
    this.linkSvc.delete(link.id).subscribe({
      next: () => { this.toast.success('Lien supprimé'); this.deleteLink.set(null); this.load(); this.deleting.set(null); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.deleting.set(null); },
    });
  }

  copy(url: string): void {
    navigator.clipboard.writeText(url).then(() => this.toast.success('Lien copié !'));
  }

  statusLabel(link: Link): string {
    if (link.expired) return 'Expiré';
    if (link.full)    return 'Complet';
    return 'Actif';
  }

  statusClass(link: Link): string {
    if (link.expired) return 'badge-expired';
    if (link.full)    return 'badge-full';
    return 'badge-active';
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  joinUrl(link: Link): string {
    // Remplace l'URL backend par l'URL frontend pour le partage
    return `${window.location.origin}/join/${link.token}`;
  }
}
