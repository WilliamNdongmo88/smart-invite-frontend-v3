import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { InitPaymentRequest, Payment, PaymentPlan, ReviewPaymentRequest } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/payments`;

  getPlan(quota: number): Observable<ApiResponse<PaymentPlan>> {
    return this.http.get<ApiResponse<PaymentPlan>>(`${this.base}/plans`, {
      params: new HttpParams().set('quota', quota),
    });
  }

  subscribe(req: InitPaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${this.base}/subscribe`, req);
  }

  submitProof(id: number, file: File): Observable<ApiResponse<Payment>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<Payment>>(`${this.base}/${id}/proof`, form);
  }

  getHistory(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.base}/history`);
  }

  reviewPayment(id: number, req: ReviewPaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.patch<ApiResponse<Payment>>(`${this.base}/${id}/review`, req);
  }
}
