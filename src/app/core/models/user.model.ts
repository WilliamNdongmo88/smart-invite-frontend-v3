import { EventStatus, EventType, NotificationMode, PaymentStatus, UserRole } from './enums.model';

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



export interface EventSummary {
  id: number;
  title: string;
  eventDate?: string;
  paymentStatus?: string;
}

/** Détail complet d'un événement (vue admin, sans restriction propriétaire) */
export interface AdminEventDetail {
  eventId: number;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  budget?: string;
  maxGuests?: number;
  concernedNames?: string;
  eventDate?: string;
  dateLabel?: string;
  venueName?: string;
  venueCity?: string;
  couplePhotoUrl?: string;
  referralCode?: string;
  createdAt: string;
  organizerId: number;
  organizerName: string;
  organizerEmail?: string;
  organizerPhone?: string;
  payment?: {
    status?: PaymentStatus;
    quota?: number;
    paidQuota?: number;
    amount?: number;
    rejectionReason?: string;
    proofUrl?: string;
    referralCode?: string;
    createdAt?: string;
  } | null;
  stats?: {
    totalGuests: number;
    confirmedGuests: number;
    pendingGuests: number;
    declinedGuests: number;
    occupancyRate: number;
  } | null;
}

export interface OrganizerSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  events: EventSummary[];
}

/** Message de contact reçu via le formulaire public (table usernews) */
export interface UserNewsMessage {
  id: number;
  name:         string;
  email?:       string;
  phone?:       string;
  message:      string;
  replyChannel: 'WHATSAPP' | 'EMAIL';
  replyContact: string;
  userId?:      number;
  isRead:       boolean;
  createdAt:    string;
}
