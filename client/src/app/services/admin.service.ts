import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard`);
  }

  // Sellers
  getAllSellers(status?: string): Observable<any> {
    const params = status ? `?status=${status}` : '';
    return this.http.get(`${this.apiUrl}/admin/sellers${params}`);
  }

  getPendingSellers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/sellers/pending`);
  }

  getSellerDetail(sellerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/sellers/${sellerId}`);
  }

  approveSeller(sellerId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/sellers/${sellerId}/approve`, {});
  }

  rejectSeller(sellerId: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/sellers/${sellerId}/reject`, { reason });
  }

  toggleSellerStatus(sellerId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/sellers/${sellerId}/toggle-status`, {});
  }

  // Hubs
  getHubs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/hubs`);
  }

  createHub(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/hubs`, data);
  }

  updateHub(hubId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/hubs/${hubId}`, data);
  }

  deleteHub(hubId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/hubs/${hubId}`);
  }

  // Drivers
  getDrivers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/drivers`);
  }

  createDriver(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/drivers`, data);
  }

  updateDriver(driverId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/drivers/${driverId}`, data);
  }

  deleteDriver(driverId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/drivers/${driverId}`);
  }

  // Deliveries
  getDeliveries(status?: string): Observable<any> {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    return this.http.get(`${this.apiUrl}/admin/deliveries${params}`);
  }

  assignDelivery(data: { orderId: string; driverId: string; hubId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/deliveries/assign`, data);
  }
}
