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
  religiousLocation?: string;
  religiousDateTime?: string;
  civilLocation?: string;
  civilDateTime?: string;
  banquetLocation?: string;
  banquetDateTime?: string;
  showWeddingReligiousLocation: boolean;
  importMyModelCard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  type: EventType;
  budget?: string;
  maxGuests: number;
  concernedNames?: string;
  eventDate?: string;
  religiousLocation?: string;
  religiousDateTime?: string;
  civilLocation?: string;
  civilDateTime?: string;
  banquetLocation?: string;
  banquetDateTime?: string;
  showWeddingReligiousLocation?: boolean;
  importMyModelCard?: boolean;
}

export type UpdateEventRequest = CreateEventRequest;

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
  card: InvitationCard;
}

export interface CreateEventWithCardRequest extends CreateEventRequest {
  card: InvitationCard;
}

export interface UpdateEventWithCardRequest extends UpdateEventRequest {
  card: InvitationCard;
}

export interface ThankYouTemplate {
  accroche?: string;
  corpsLigne1?: string;
  corpsLigne2?: string;
  conclusion?: string;
  isCustom?: boolean;
}
