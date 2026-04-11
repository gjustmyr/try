import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DriverService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/driver/profile`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/driver/stats`);
  }

  getDeliveries(status?: string): Observable<any> {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    return this.http.get(`${this.apiUrl}/driver/deliveries${params}`);
  }

  updateDeliveryStatus(deliveryId: string, status: string, notes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/driver/deliveries/${deliveryId}/status`, {
      status,
      notes,
    });
  }

  scanDelivery(qrData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/driver/scan-delivery`, { qrData });
  }

  updateLocation(latitude: number, longitude: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/driver/location`, { latitude, longitude });
  }

  toggleAvailability(): Observable<any> {
    return this.http.put(`${this.apiUrl}/driver/availability`, {});
  }
}
