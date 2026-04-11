import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = environment.apiUrl;

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

  assignDelivery(data: { orderId: string; hubId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/hub/${data.hubId}/receive-order`, {
      orderId: data.orderId,
    });
  }

  searchOrders(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/orders/search?q=${encodeURIComponent(query)}`);
  }

  // Coupons
  getAllCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons`);
  }

  createCoupon(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupons`, data);
  }

  updateCoupon(couponId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/coupons/${couponId}`, data);
  }

  deleteCoupon(couponId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/coupons/${couponId}`);
  }

  // Tax
  getAllTaxConfigs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tax`);
  }

  createTaxConfig(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tax`, data);
  }

  updateTaxConfig(taxId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tax/${taxId}`, data);
  }

  deleteTaxConfig(taxId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tax/${taxId}`);
  }
}
