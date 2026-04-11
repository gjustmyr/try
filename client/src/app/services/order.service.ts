import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  placeOrder(data: {
    addressId: string;
    cartItemIds: string[];
    notes?: string;
    couponCode?: string | string[]; // Support both single code and array
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, data);
  }

  getOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`);
  }

  getOrder(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}`);
  }

  getSellerOrders(status?: string): Observable<any> {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    return this.http.get(`${this.apiUrl}/orders/seller${params}`);
  }

  updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Observable<any> {
    const body: any = { status };
    if (trackingNumber) body.trackingNumber = trackingNumber;
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, body);
  }

  getOrderTracking(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}/tracking`);
  }

  submitReview(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, formData);
  }
}
