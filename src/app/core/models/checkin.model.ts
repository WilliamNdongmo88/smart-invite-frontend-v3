export interface Link {
  id: number;
  eventId: number;
  token: string;
  url: string;
  usedCount: number;
  limitCount?: number;
  dateLimitLink?: string;
  expired: boolean;
  full: boolean;
}

export interface CreateLinkRequest {
  eventId: number;
  limitCount?: number;
  dateLimitLink?: string;
}

export interface UpdateLinkRequest {
  limitCount?: number;
  dateLimitLink?: string;
}

export interface ScanResponse {
  result: 'VALID' | 'DUPLICATE' | 'EXPIRED' | 'INVALID';
  guestName?: string;
  eventTitle?: string;
  tableNumber?: number;
  message: string;
  eventId?: number;
}

export interface CheckinParameters {
  eventId: number;
  confirmationSound: boolean;
  totalScans: number;
  validScans: number;
  duplicateScans: number;
  invalidScans: number;
}

export interface CreateAgentRequest {
  userName: string;
  whatsapp: string;
}

export interface AgentResponse {
  id: number;
  userName: string;
  whatsapp: string;
}

export interface EventSummary {
  id: number;
  title: string;
  type: string;
  dateLabel?: string;
  venueName?: string;
  venueCity?: string;
}
