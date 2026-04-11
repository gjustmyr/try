import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
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

  getAllProducts(category?: string): Observable<any> {
    let params: any = {};
    if (category) {
      params.category = category;
    }
    return this.http.get(`${this.apiUrl}/products`, { params });
  }

  search(query: string, limit: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/search`, {
      params: { q: query, limit: limit.toString() },
    });
  }

  getProductPublic(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/view/${productId}`);
  }

  getSellerProducts(sellerId: string, status?: string): Observable<any> {
    let params: any = {};
    if (status) {
      params.status = status;
    }
    return this.http.get(`${this.apiUrl}/products/seller/${sellerId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getProduct(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${productId}`, {
      headers: this.getHeaders(),
    });
  }

  createProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
      }),
    });
  }

  updateProduct(productId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${productId}`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
      }),
    });
  }

  deleteProduct(productId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${productId}`, {
      headers: this.getHeaders(),
    });
  }

  togglePublish(productId: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/products/${productId}/publish`,
      {},
      {
        headers: this.getHeaders(),
      },
    );
  }
}
