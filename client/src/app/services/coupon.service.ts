import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CouponService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getActiveCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons/active`);
  }

  validateCoupon(code: string, cartTotal: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/coupons/validate`,
      { code, cartTotal },
      { headers: this.getHeaders() },
    );
  }

  // Admin endpoints
  getAllCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons`, {
      headers: this.getHeaders(),
    });
  }

  createCoupon(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupons`, data, {
      headers: this.getHeaders(),
    });
  }

  updateCoupon(couponId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/coupons/${couponId}`, data, {
      headers: this.getHeaders(),
    });
  }

  deleteCoupon(couponId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/coupons/${couponId}`, {
      headers: this.getHeaders(),
    });
  }
}
