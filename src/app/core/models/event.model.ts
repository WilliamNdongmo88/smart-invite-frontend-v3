import { EventStatus, EventType } from './enums.model';

export interface Event {
  id: number;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  budget?: string;
  maxGuests: number;
  concernedNames?: string;
  eventDate?: string;
  dateLabel?: string;
  venueName?: string;
  venueCity?: string;
  religiousLocation?: string;
  religiousDateTime?: string;
  civilLocation?: string;
  civilDateTime?: string;
  banquetLocation?: string;
  banquetDateTime?: string;
  couplePhotoUrl?: string;
  showWeddingReligiousLocation?: boolean;
  importMyModelCard?: boolean;
  detailsContent?: any;
  weddingDetailsContent?: any;
  conferenceDetailsContent?: any;
  galaDetailsContent?: any;
  ceremonieDetailsContent?: any;
  createdAt: string;
  updatedAt: string;
}

export type EventPayloadRequest = {
  eventType: EventType;
  hero?: any;
  [key: string]: any;
};

export type CreateEventRequest = EventPayloadRequest | Record<string, any>;
export type UpdateEventRequest = EventPayloadRequest | Record<string, any>;

export interface EventStats {
  id: number;
  title: string;
  maxGuests: number;
  totalGuests: number;
  confirmed: number;
  pending: number;
  declined: number;
  occupancyRate: number;
}

export interface InvitationCard {
  id?: number;
  title?: string;
  mainMessage?: string;
  mainMessagePart1?: string;
  mainMessagePart2?: string;
  sousMainMessage?: string;
  eventTheme?: string;
  civilNote?: string;
  qrInstructions?: string;
  dressCodeMessage?: string;
  thanksMessage1?: string;
  closingMessage?: string;
  titleColor?: string;
  topBandColor?: string;
  bottomBandColor?: string;
  textColor?: string;
  logoUrl?: string;
  heartIconUrl?: string;
  pdfUrl?: string;
  hasInvitationModelCard?: boolean;
  code?: string;
}

export interface EventWithCard {
  event: Event;
  card?: InvitationCard;        // GET /api/events/{id}/card
  invitationNote?: InvitationCard; // POST/PUT /api/events/with-card
}

export interface CreateEventWithCardRequest {
  event: CreateEventRequest;
  invitationNote: InvitationCard;
}

export interface UpdateEventWithCardRequest {
  event: UpdateEventRequest;
  invitationNote: InvitationCard;
}

export interface ThankYouTemplate {
  accroche?: string;
  corpsLigne1?: string;
  corpsLigne2?: string;
  conclusion?: string;
  isCustom?: boolean;
}
