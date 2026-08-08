export interface Link {
  id: number;
  eventId: number;
  token: string;
  usedCount: number;
  limitCount?: number;
  dateLimitLink?: string;
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
  scanStatus: 'VALID' | 'DUPLICATE' | 'EXPIRED' | 'INVALID';
  guestName?: string;
  eventTitle?: string;
  message: string;
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
