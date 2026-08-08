export type EventType =
  | 'MARIAGE'
  | 'FIANCAILLES'
  | 'ANNIVERSAIRE_MARIAGE'
  | 'ANNIVERSAIRE'
  | 'EVENEMENT_PROFESSIONNEL';

export type EventStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'PRESENT';

export type PaymentStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type InvitationStatus = 'ACTIVE' | 'REVOKED' | 'USED';

export type ScanResult = 'VALID' | 'DUPLICATE' | 'EXPIRED' | 'INVALID';

export type NotificationMode = 'EMAIL' | 'WHATSAPP' | 'BOTH';

export type UserRole = 'ADMIN' | 'USER' | 'AGENT';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  MARIAGE: 'Mariage',
  FIANCAILLES: 'Fiançailles',
  ANNIVERSAIRE_MARIAGE: 'Anniversaire de mariage',
  ANNIVERSAIRE: 'Anniversaire',
  EVENEMENT_PROFESSIONNEL: 'Événement professionnel',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  PLANNED: 'Planifié',
  ACTIVE: 'Actif',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  DECLINED: 'Décliné',
  PRESENT: 'Présent',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  UNDER_REVIEW: 'En vérification',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

export const NOTIFICATION_MODE_LABELS: Record<NotificationMode, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  BOTH: 'Email & WhatsApp',
};
