import { EventType, InvitationStatus, NotificationMode, RsvpStatus } from './enums.model';

export interface Invitation {
  id: number;
  guestId: number;
  guestName?: string;
  token: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  status: InvitationStatus;
  isInvitationSent: boolean;
  createdAt: string;
}

export interface PublicInvitation {
  token: string;
  guestName: string;
  eventTitle: string;
  eventType: EventType;
  eventDate?: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  rsvpStatus: RsvpStatus;
}

export interface CreateGuestRequest {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  notificationMode?: NotificationMode;
}

export interface RsvpRequest {
  status: 'CONFIRMED' | 'DECLINED';
}

export interface BulkGenerateRequest {
  eventId: number;
  guestIds: number[];
}

export interface BulkGenerateResponse {
  total: number;
  generated: number;
  skipped: number;
  skippedReasons: string[];
  invitations: Invitation[];
}
