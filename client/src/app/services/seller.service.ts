import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  registerSeller(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/sellers/register`, formData);
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sellers/verify-otp`, { email, otp });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sellers/resend-otp`, { email });
  }

  getSellerStatus(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/status?email=${email}`);
  }

  getSellerProfile(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/profile/${userId}`);
  }

  updateSellerProfile(sellerId: string, data: any): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.put(`${this.apiUrl}/sellers/profile/${sellerId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getAllShops(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/shops`);
  }

  getShopDetail(sellerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/shops/${sellerId}`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/dashboard/stats`);
  }

  getSellerCustomers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sellers/customers`);
  }

  getSellerReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/seller`);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/change-password`, data);
  }
}
