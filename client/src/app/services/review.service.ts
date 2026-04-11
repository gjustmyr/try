import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = environment.apiUrl;

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

  getProductReviews(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/product/${productId}`);
  }

  getSellerReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/seller`, {
      headers: this.getHeaders(),
    });
  }

  createReview(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
      }),
    });
  }
}
