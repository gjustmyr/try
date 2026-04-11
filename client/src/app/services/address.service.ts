import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAddresses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/addresses`);
  }

  addAddress(address: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addresses`, address);
  }

  updateAddress(addressId: string, address: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/addresses/${addressId}`, address);
  }

  deleteAddress(addressId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/addresses/${addressId}`);
  }

  setDefault(addressId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/addresses/${addressId}/default`, {});
  }
}
