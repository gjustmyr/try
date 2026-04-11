import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TaxService {
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

  getActiveTax(region?: string): Observable<any> {
    let params: any = {};
    if (region) {
      params.region = region;
    }
    return this.http.get(`${this.apiUrl}/tax/active`, { params });
  }

  // Admin endpoints
  getAllTaxConfigs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tax`, {
      headers: this.getHeaders(),
    });
  }

  createTaxConfig(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tax`, data, {
      headers: this.getHeaders(),
    });
  }

  updateTaxConfig(taxId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tax/${taxId}`, data, {
      headers: this.getHeaders(),
    });
  }

  deleteTaxConfig(taxId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tax/${taxId}`, {
      headers: this.getHeaders(),
    });
  }
}
