import { Pipe, PipeTransform } from '@angular/core';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  NOTIFICATION_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
  RSVP_STATUS_LABELS,
} from '../../core/models/enums.model';

@Pipe({ name: 'eventTypeFr', standalone: true })
export class EventTypeFrPipe implements PipeTransform {
  transform(value: string): string {
    return EVENT_TYPE_LABELS[value as keyof typeof EVENT_TYPE_LABELS] ?? value;
  }
}

@Pipe({ name: 'eventStatusFr', standalone: true })
export class EventStatusFrPipe implements PipeTransform {
  transform(value: string): string {
    return EVENT_STATUS_LABELS[value as keyof typeof EVENT_STATUS_LABELS] ?? value;
  }
}

@Pipe({ name: 'rsvpStatusFr', standalone: true })
export class RsvpStatusFrPipe implements PipeTransform {
  transform(value: string): string {
    return RSVP_STATUS_LABELS[value as keyof typeof RSVP_STATUS_LABELS] ?? value;
  }
}

@Pipe({ name: 'paymentStatusFr', standalone: true })
export class PaymentStatusFrPipe implements PipeTransform {
  transform(value: string): string {
    return PAYMENT_STATUS_LABELS[value as keyof typeof PAYMENT_STATUS_LABELS] ?? value;
  }
}

@Pipe({ name: 'notificationModeFr', standalone: true })
export class NotificationModeFrPipe implements PipeTransform {
  transform(value: string): string {
    return NOTIFICATION_MODE_LABELS[value as keyof typeof NOTIFICATION_MODE_LABELS] ?? value;
  }
}

@Pipe({ name: 'dateTimeFr', standalone: true })
export class DateTimeFrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
  }
}
