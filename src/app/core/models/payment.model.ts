import { PaymentStatus } from './enums.model';

export interface Payment {
  id: number;
  eventId: number;
  eventTitle?: string;
  quota: number;
  paidQuota?: number;
  sentInvitations: number;
  amount: number;
  status: PaymentStatus;
  proofUrl?: string;
  proofCode?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface InitPaymentRequest {
  eventId: number;
  quota: number;
}

export interface ReviewPaymentRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface PaymentPlan {
  quota: number;
  unitPrice: number;
  totalAmount: number;
}
