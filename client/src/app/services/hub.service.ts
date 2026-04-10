import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HubService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getAvailableHubs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/hub/available`);
  }

  sellerDropOff(orderId: string, hubId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/hub/drop-off`, { orderId, hubId });
  }

  getHubParcels(hubId: string, status?: string): Observable<any> {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    return this.http.get(`${this.apiUrl}/hub/${hubId}/parcels${params}`);
  }

  receiveParcel(deliveryId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/hub/parcels/${deliveryId}/receive`, {});
  }

  dispatchToHub(deliveryId: string, driverId?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/hub/parcels/${deliveryId}/dispatch`, { driverId });
  }

  arriveAtHub(deliveryId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/hub/parcels/${deliveryId}/arrive`, {});
  }

  assignRider(deliveryId: string, driverId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/hub/parcels/${deliveryId}/assign-rider`, { driverId });
  }

  getDeliveryQR(deliveryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/hub/parcels/${deliveryId}/qr`);
  }
}
