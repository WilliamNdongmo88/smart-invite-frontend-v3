import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GuestService } from '../../../core/services/guest.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { Guest } from '../../../core/models/guest.model';
import { Event } from '../../../core/models/event.model';
import { RsvpStatus, NotificationMode, RSVP_STATUS_LABELS, NOTIFICATION_MODE_LABELS } from '../../../core/models/enums.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type RsvpTab = 'ALL' | RsvpStatus;

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: 'guests.component.html',
  styleUrl: 'guests.component.scss',
})
export class GuestsComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly fb       = inject(FormBuilder);
  private readonly svc      = inject(GuestService);
  private readonly eventSvc = inject(EventService);
  private readonly toast    = inject(ToastService);

  // ── State ──
  eventId = 0;
  event   = signal<Event | null>(null);
  guests  = signal<Guest[]>([]);
  loading = signal(true);
  saving  = signal(false);
  reminderLoading = signal<number | null>(null);

  // ── Pagination ──
  page         = signal(0);
  totalPages   = signal(0);
  totalElements = signal(0);
  readonly PAGE_SIZE = 15;

  // ── Filters ──
  activeTab  = signal<RsvpTab>('ALL');
  searchTerm = signal('');
  private searchTimer: any;

  // ── Selection ──
  selected = signal<Set<number>>(new Set());

  // ── Export ──
  exportLoading = signal(false);
  showExportMenu = signal(false);

  // ── Modals ──
  showForm       = signal(false);
  editingGuest   = signal<Guest | null>(null);
  confirmDeleteId = signal<number | null>(null);
  confirmBulkDelete = signal(false);
  confirmReminderId = signal<number | null>(null);

  // ── Labels ──
  readonly rsvpLabels = RSVP_STATUS_LABELS;
  readonly notifLabels = NOTIFICATION_MODE_LABELS;

  readonly tabs: { key: RsvpTab; label: string }[] = [
    { key: 'ALL',       label: 'Tous' },
    { key: 'PENDING',   label: 'En attente' },
    { key: 'CONFIRMED', label: 'Confirmés' },
    { key: 'DECLINED',  label: 'Refusés' },
    { key: 'PRESENT',   label: 'Présents' },
  ];

  readonly notifOptions: { key: NotificationMode; label: string }[] = [
    { key: 'EMAIL',    label: 'Email' },
    { key: 'WHATSAPP', label: 'WhatsApp' },
    { key: 'BOTH',     label: 'Email & WhatsApp' },
  ];

  // ── Form ──
  form = this.fb.group({
    fullName:         ['', [Validators.required, Validators.minLength(2)]],
    email:            [''],
    phoneNumber:      [''],
    notificationMode: ['EMAIL' as NotificationMode],
    tableNumber:      [null as number | null],
  });

  // ── Computed ──
  allSelected = computed(() => {
    const g = this.guests();
    return g.length > 0 && g.every(x => this.selected().has(x.id));
  });

  selectedCount = computed(() => this.selected().size);

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId) { this.router.navigate(['/events']); return; }
    this.eventSvc.findById(this.eventId).subscribe({
      next: (res) => this.event.set(res.data!),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const tab = this.activeTab();
    this.svc.list(this.eventId, {
      page:   this.page(),
      size:   this.PAGE_SIZE,
      search: this.searchTerm() || undefined,
      rsvp:   tab !== 'ALL' ? tab : undefined,
    }).subscribe({
      next: (res) => {
        const p = res.data!;
        this.guests.set(p.content);
        this.totalPages.set(p.totalPages);
        this.totalElements.set(p.totalElements);
        this.selected.set(new Set());
        this.loading.set(false);
      },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur de chargement'); this.loading.set(false); },
    });
  }

  // ── Tabs & Search ──
  setTab(tab: RsvpTab): void {
    this.activeTab.set(tab);
    this.page.set(0);
    this.load();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 350);
  }

  // ── Pagination ──
  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages() - 1) { this.page.update(p => p + 1); this.load(); } }

  // ── Selection ──
  toggleAll(): void {
    const cur = this.selected();
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.guests().map(g => g.id)));
    }
  }

  toggleOne(id: number): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  isSelected(id: number): boolean { return this.selected().has(id); }

  // ── Add / Edit ──
  openAdd(): void {
    this.editingGuest.set(null);
    this.form.reset({ notificationMode: 'EMAIL' });
    this.showForm.set(true);
  }

  openEdit(g: Guest): void {
    this.editingGuest.set(g);
    this.form.patchValue({
      fullName:         g.fullName,
      email:            g.email ?? '',
      phoneNumber:      g.phoneNumber ?? '',
      notificationMode: g.notificationMode ?? 'EMAIL',
      tableNumber:      g.tableNumber ?? null,
    });
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  saveGuest(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const req: any = {
      fullName:         v.fullName!,
      email:            v.email      || undefined,
      phoneNumber:      v.phoneNumber || undefined,
      notificationMode: v.notificationMode ?? 'EMAIL',
      tableNumber:      v.tableNumber ?? undefined,
    };

    const editing = this.editingGuest();
    const obs = editing
      ? this.svc.update(editing.id, req)
      : this.svc.add(this.eventId, req);

    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Invité modifié' : 'Invité ajouté');
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || (editing ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout');
        this.toast.error(msg);
        this.saving.set(false);
      },
    });
  }

  // ── Delete ──
  askDelete(id: number): void { this.confirmDeleteId.set(id); }
  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.confirmDeleteId.set(null);
    this.svc.delete(id).subscribe({
      next: () => { this.toast.success('Invité supprimé'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message || 'Erreur lors de la suppression'),
    });
  }

  // ── Bulk delete ──
  askBulkDelete(): void { this.confirmBulkDelete.set(true); }
  cancelBulkDelete(): void { this.confirmBulkDelete.set(false); }

  confirmBulkDeleteAction(): void {
    const ids = Array.from(this.selected());
    this.confirmBulkDelete.set(false);
    this.svc.bulkDelete({ guestIds: ids }).subscribe({
      next: () => { this.toast.success(`${ids.length} invité(s) supprimé(s)`); this.load(); },
      error: (err) => this.toast.error(err?.error?.message || 'Erreur lors de la suppression'),
    });
  }

  // ── Reminder ──
  askReminder(id: number): void { this.confirmReminderId.set(id); }
  cancelReminder(): void { this.confirmReminderId.set(null); }

  confirmReminder(): void {
    const id = this.confirmReminderId();
    if (!id) return;
    this.confirmReminderId.set(null);
    this.reminderLoading.set(id);
    this.svc.sendReminder(id).subscribe({
      next: () => { this.toast.success('Rappel envoyé'); this.reminderLoading.set(null); },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur lors de l\'envoi du rappel'); this.reminderLoading.set(null); },
    });
  }

  // ── Export Excel / PDF ──
  toggleExportMenu(): void { this.showExportMenu.update(v => !v); }
  closeExportMenu(): void  { this.showExportMenu.set(false); }

  private getExportParams() {
    const tab = this.activeTab();
    return {
      search: this.searchTerm() || undefined,
      rsvp:   tab !== 'ALL' ? tab : undefined,
    };
  }

  private buildFileName(ext: string): string {
    const tab        = this.activeTab();
    const filterPart = tab !== 'ALL' ? `_${tab.toLowerCase()}` : '';
    const eventTitle = (this.event()?.title ?? 'invites').replace(/\s+/g, '_');
    return `${eventTitle}${filterPart}_invites.${ext}`;
  }

  private buildRows(guests: Guest[]): string[][] {
    return guests.map(g => [
      g.fullName,
      g.email        ?? '',
      g.phoneNumber  ?? '',
      g.notificationMode ? this.notifLabels[g.notificationMode] : '',
      g.tableNumber  ? String(g.tableNumber) : '',
      this.rsvpLabels[g.rsvpStatus],
      this.formatDate(g.createdAt),
    ]);
  }

  exportExcel(): void {
    if (this.exportLoading()) return;
    this.exportLoading.set(true);
    this.showExportMenu.set(false);
    this.svc.exportAll(this.eventId, this.getExportParams()).subscribe({
      next: (res) => {
        const guests = res.data!.content;
        if (!guests.length) {
          this.toast.error('Aucun invité à exporter pour ce filtre.');
          this.exportLoading.set(false);
          return;
        }
        const headers = ['Nom', 'Email', 'Téléphone', 'Notification', 'Table', 'Statut RSVP', 'Ajouté le'];
        const wsData  = [headers, ...this.buildRows(guests)];
        const ws      = XLSX.utils.aoa_to_sheet(wsData);

        // Largeurs de colonnes automatiques
        ws['!cols'] = [20, 28, 18, 18, 8, 14, 14].map(wch => ({ wch }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invités');
        XLSX.writeFile(wb, this.buildFileName('xlsx'));
        this.exportLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de l\'export Excel');
        this.exportLoading.set(false);
      },
    });
  }

  exportPdf(): void {
    if (this.exportLoading()) return;
    this.exportLoading.set(true);
    this.showExportMenu.set(false);
    this.svc.exportAll(this.eventId, this.getExportParams()).subscribe({
      next: async (res) => {
        const guests = res.data!.content;
        if (!guests.length) {
          this.toast.error('Aucun invité à exporter pour ce filtre.');
          this.exportLoading.set(false);
          return;
        }

        const doc        = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW      = doc.internal.pageSize.getWidth();   // 297 mm
        const gold       = [193, 156, 58]  as [number, number, number];
        const darkText   = [30,  30,  30]  as [number, number, number];
        const grayText   = [130, 130, 130] as [number, number, number];
        const eventTitle = this.event()?.title ?? 'Liste des invités';
        const tab        = this.activeTab();
        const filterLabel = tab !== 'ALL' ? ` — ${this.tabs.find(t => t.key === tab)?.label ?? ''}` : '';
        const dateStr    = new Date().toLocaleDateString('fr-FR');

        // ── 1. Logo centré ──
        const logoW  = 50;   // largeur mm  — logo quasi carré, on lui donne de la place
        const logoH  = 40;   // hauteur mm
        const logoX  = (pageW - logoW) / 2;
        const logoY  = 6;    // petite marge depuis le haut

        try {
          const logoBase64 = await this.loadImageAsBase64('/img/logo.png');
          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoW, logoH);
        } catch { /* logo optionnel */ }

        // ── 2. Ligne séparatrice dorée ──
        const lineY = logoY + logoH + 5;  // 5mm sous le logo
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.4);
        doc.line(14, lineY, pageW - 14, lineY);

        // ── 3. Titre événement (grand, doré, serif) ──
        doc.setFont('times', 'italic');
        doc.setFontSize(28);
        doc.setTextColor(...gold);
        doc.text(`${eventTitle}${filterLabel}`, 14, lineY + 14);

        // ── 4. Sous-titre gris ──
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...grayText);
        doc.text(`${guests.length} invité(s)  —  Exporté le ${dateStr}`, 14, lineY + 22);

        // ── 5. Tableau ──
        // Largeur utile = pageW - marges (14mm de chaque côté)
        const margin   = 14;
        const tableW   = pageW - margin * 2; // 269 mm en A4 paysage

        // Proportions relatives : Nom(16) Email(20) Tel(13) Notif(11) Table(6) RSVP(11) Date(11) → total 88
        const ratios   = [16, 20, 13, 11, 6, 11, 11];
        const total    = ratios.reduce((a, b) => a + b, 0);
        const colW     = ratios.map(r => parseFloat(((r / total) * tableW).toFixed(2)));

        autoTable(doc, {
          startY: lineY + 30,
          margin: { left: margin, right: margin },
          tableWidth: tableW,
          head: [['Nom', 'Email', 'Téléphone', 'Notification', 'Table', 'Statut RSVP', 'Ajouté le']],
          body: this.buildRows(guests),
          styles: {
            fontSize: 9,
            cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
            textColor: darkText,
            lineColor: [220, 220, 220],
            lineWidth: 0.3,
            font: 'helvetica',
            overflow: 'ellipsize',
          },
          headStyles: {
            fillColor: [160, 120, 40] as [number, number, number],
            textColor: [255, 255, 255] as [number, number, number],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248] as [number, number, number],
          },
          bodyStyles: {
            fillColor: [255, 255, 255] as [number, number, number],
          },
          columnStyles: {
            0: { cellWidth: colW[0] },
            1: { cellWidth: colW[1] },
            2: { cellWidth: colW[2] },
            3: { cellWidth: colW[3] },
            4: { cellWidth: colW[4], halign: 'center' },
            5: { cellWidth: colW[5] },
            6: { cellWidth: colW[6] },
          },
          tableLineColor: [220, 220, 220],
          tableLineWidth: 0.3,
          // Numéro de page en pied
          didDrawPage: (data) => {
            const pageCount = (doc.internal as any).getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(...grayText);
            doc.text(
              `Page ${data.pageNumber} / ${pageCount}`,
              pageW / 2,
              doc.internal.pageSize.getHeight() - 8,
              { align: 'center' }
            );
          },
        });

        doc.save(this.buildFileName('pdf'));
        this.exportLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de l\'export PDF');
        this.exportLoading.set(false);
      },
    });
  }

  /** Charge une image depuis les assets publics et retourne son data URL base64. */
  private loadImageAsBase64(path: string): Promise<string> {
    return fetch(path)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }

  // ── Helpers ──
  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  rsvpClass(status: RsvpStatus): string {
    const map: Record<string, string> = {
      PENDING: 'rsvp-pending', CONFIRMED: 'rsvp-confirmed',
      DECLINED: 'rsvp-declined', PRESENT: 'rsvp-present',
    };
    return map[status] ?? '';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
