import { NotificationMode } from './enums.model';

export interface Referrer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  code: string;
  notificationMode: NotificationMode;
  active: boolean;
  createdAt: string;
  registrations: number;
  events: number;
  approvedAmount: number;
}

export interface ReferrerRequest {
  name: string;
  phone?: string;
  email?: string;
  notificationMode: NotificationMode;
}

export interface ReferralCheck {
  valid: boolean;
  referrerName?: string;
}