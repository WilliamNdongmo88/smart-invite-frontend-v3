import { NotificationMode, RsvpStatus } from './enums.model';

export interface Guest {
  id: number;
  eventId: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  rsvpStatus: RsvpStatus;
  tableNumber?: number;
  notificationMode?: NotificationMode;
  createdAt: string;
}

export interface AddGuestRequest {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  notificationMode?: NotificationMode;
  tableNumber?: number;
}

export type UpdateGuestRequest = AddGuestRequest;

export interface BulkDeleteRequest {
  guestIds: number[];
}
