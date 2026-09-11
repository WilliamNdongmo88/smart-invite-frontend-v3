import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '../../../core/models/user.model';
import { NotificationMode, NOTIFICATION_MODE_LABELS } from '../../../core/models/enums.model';
import { DialCodeSelectComponent } from '../../../shared/components/dial-code-select/dial-code-select.component';
import { DIAL_CODES } from '../../../core/data/dial-codes';

type ActiveTab = 'info' | 'notifications' | 'security';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, DialCodeSelectComponent],
  templateUrl: 'profile.component.html',
  styleUrl: 'profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly profileSvc = inject(ProfileService);
  private readonly authSvc    = inject(AuthService);
  private readonly toast      = inject(ToastService);
  private readonly router     = inject(Router);

  user        = signal<User | null>(null);
  loading     = signal(true);
  saving      = signal(false);
  activeTab   = signal<ActiveTab>('info');

  // Info form
  name             = '';
  phoneDialCode    = '+237';
  phoneLocal       = '';
  notificationMode: NotificationMode = 'EMAIL';

  // Notifications form
  attendanceNotifications = false;
  thankNotifications      = false;
  eventReminders          = false;
  marketingEmails         = false;
  notifyMe                = false;

  // Password form
  currentPassword = '';
  newPassword     = '';
  confirmPassword = '';
  showCurrent     = false;
  showNew         = false;
  pwSaving        = false;

  // Delete modal
  deleteModal = signal(false);
  deleting    = signal(false);

  readonly notifModes: NotificationMode[] = ['EMAIL', 'WHATSAPP', 'BOTH'];
  readonly notifModeLabels = NOTIFICATION_MODE_LABELS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.profileSvc.getProfile().subscribe({
      next: (res) => {
        const u = res.data!;
        this.user.set(u as unknown as User);
        this.name   = u.name;
        // Décompose le numéro stocké (ex: "+237612345678") en indicatif + local
        const parsed = this.parsePhone(u.phone ?? '');
        this.phoneDialCode = parsed.dialCode;
        this.phoneLocal    = parsed.local;
        this.notificationMode = (u.notificationMode as NotificationMode) ?? 'EMAIL';
        this.attendanceNotifications = u.attendanceNotifications ?? false;
        this.thankNotifications      = u.thankNotifications ?? false;
        this.eventReminders          = u.eventReminders ?? false;
        this.marketingEmails         = u.marketingEmails ?? false;
        this.notifyMe                = u.notifyMe ?? false;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: ActiveTab): void { this.activeTab.set(tab); }

  saveInfo(): void {
    this.saving.set(true);
    // Compose le numéro complet : indicatif + local sans zéros de tête
    const local = this.phoneLocal.trim().replace(/^0+/, '');
    const fullPhone = local ? `${this.phoneDialCode}${local}` : undefined;
    const req: UpdateProfileRequest = {
      name:             this.name.trim() || undefined,
      phone:            fullPhone,
      notificationMode: this.notificationMode,
    };
    this.profileSvc.updateProfile(req).subscribe({
      next: (res) => {
        const u = res.data!;
        // Met à jour uniquement les champs modifiés dans le signal, sans recharger la page
        this.user.update(prev => prev ? {
          ...prev,
          name:             u.name,
          phone:            u.phone,
          notificationMode: u.notificationMode,
        } : prev);
        this.name = u.name ?? '';
        // Resynchronise les champs téléphone avec la valeur confirmée
        const parsed = this.parsePhone(u.phone ?? '');
        this.phoneDialCode = parsed.dialCode;
        this.phoneLocal    = parsed.local;
        this.toast.success('Profil mis à jour ✅');
        this.saving.set(false);
      },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.saving.set(false); },
    });
  }

  saveNotifications(): void {
    this.saving.set(true);
    const req: UpdateProfileRequest = {
      attendanceNotifications: this.attendanceNotifications,
      thankNotifications:      this.thankNotifications,
      eventReminders:          this.eventReminders,
      marketingEmails:         this.marketingEmails,
      notifyMe:                this.notifyMe,
    };
    this.profileSvc.updateProfile(req).subscribe({
      next: (res) => {
        const u = res.data!;
        // Met à jour uniquement les préférences dans le signal, sans recharger la page
        this.user.update(prev => prev ? {
          ...prev,
          attendanceNotifications: u.attendanceNotifications,
          thankNotifications:      u.thankNotifications,
          eventReminders:          u.eventReminders,
          marketingEmails:         u.marketingEmails,
          notifyMe:                u.notifyMe,
        } : prev);
        this.toast.success('Préférences sauvegardées ✅');
        this.saving.set(false);
      },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.saving.set(false); },
    });
  }

  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (this.newPassword.length < 6) {
      this.toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    this.pwSaving = true;
    const req: ChangePasswordRequest = { currentPassword: this.currentPassword, newPassword: this.newPassword };
    this.profileSvc.changePassword(req).subscribe({
      next: () => {
        this.toast.success('Mot de passe modifié ✅');
        this.currentPassword = '';
        this.newPassword     = '';
        this.confirmPassword = '';
        this.pwSaving = false;
      },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.pwSaving = false; },
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Prévisualisation optimiste : afficher la photo immédiatement sans attendre l'API
    const previousAvatarUrl = this.user()?.avatarUrl;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.user.update(u => u ? { ...u, avatarUrl: e.target!.result as string } : u);
    };
    reader.readAsDataURL(file);

    // Upload silencieux en arrière-plan
    this.profileSvc.uploadAvatar(file).subscribe({
      next: (res) => {
        // Remplace le blob local par l'URL Firebase définitive, sans rechargement
        const firebaseUrl = res.data;
        if (firebaseUrl) {
          this.user.update(u => u ? { ...u, avatarUrl: firebaseUrl } : u);
        }
      },
      error: (err) => {
        // Rollback : remettre l'ancienne photo + notifier l'échec
        this.user.update(u => u ? { ...u, avatarUrl: previousAvatarUrl } : u);
        this.toast.error(err?.error?.message || 'Erreur upload');
      },
    });
  }

  confirmDelete(): void {
    this.deleting.set(true);
    this.profileSvc.deleteAccount().subscribe({
      next: () => {
        this.authSvc.clearTokens();
        this.router.navigate(['/login']);
      },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur'); this.deleting.set(false); },
    });
  }

  /** Extrait l'indicatif et le numéro local depuis un numéro complet (ex: "+237612345678") */
  private parsePhone(fullPhone: string): { dialCode: string; local: string } {
    if (!fullPhone) return { dialCode: '+237', local: '' };
    // Cherche l'indicatif le plus long qui correspond au début du numéro
    const match = DIAL_CODES
      .filter(d => fullPhone.startsWith(d.code))
      .sort((a, b) => b.code.length - a.code.length)[0];
    if (match) {
      return { dialCode: match.code, local: fullPhone.slice(match.code.length) };
    }
    return { dialCode: '+237', local: fullPhone };
  }

  initials(): string {
    const n = this.user()?.name ?? '';
    return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
