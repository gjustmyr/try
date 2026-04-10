import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getTracking(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/deliveries/track?orderId=${orderId}`);
  }

  getTrackingByNumber(trackingNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/deliveries/track?trackingNumber=${trackingNumber}`);
  }
}
