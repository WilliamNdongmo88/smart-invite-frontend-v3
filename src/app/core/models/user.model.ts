import { NotificationMode, UserRole } from './enums.model';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  notificationMode?: NotificationMode;
  avatarUrl?: string;
  isActive: boolean;
  isBlocked: boolean;
  attendanceNotifications: boolean;
  thankNotifications: boolean;
  eventReminders: boolean;
  marketingEmails: boolean;
  notifyMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  notificationMode?: NotificationMode;
  attendanceNotifications?: boolean;
  thankNotifications?: boolean;
  eventReminders?: boolean;
  marketingEmails?: boolean;
  notifyMe?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface OrganizerSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isBlocked: boolean;
  events: EventSummary[];
}

export interface EventSummary {
  id: number;
  title: string;
  paymentStatus?: string;
}
