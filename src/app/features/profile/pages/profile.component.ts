import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '../../../core/models/user.model';
import { NotificationMode, NOTIFICATION_MODE_LABELS } from '../../../core/models/enums.model';

type ActiveTab = 'info' | 'notifications' | 'security';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
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
  name   = '';
  phone  = '';
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

  // Avatar
  avatarUploading = false;

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
        this.phone  = u.phone ?? '';
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
    const req: UpdateProfileRequest = {
      name: this.name.trim() || undefined,
      phone: this.phone.trim() || undefined,
      notificationMode: this.notificationMode,
    };
    this.profileSvc.updateProfile(req).subscribe({
      next: () => { this.toast.success('Profil mis à jour ✅'); this.saving.set(false); this.load(); },
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
      next: () => { this.toast.success('Préférences sauvegardées ✅'); this.saving.set(false); },
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
    this.avatarUploading = true;
    this.profileSvc.uploadAvatar(file).subscribe({
      next: () => { this.toast.success('Avatar mis à jour ✅'); this.load(); this.avatarUploading = false; },
      error: (err) => { this.toast.error(err?.error?.message || 'Erreur upload'); this.avatarUploading = false; },
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

  initials(): string {
    const n = this.user()?.name ?? '';
    return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
