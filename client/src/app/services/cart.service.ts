import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cart`);
  }

  addToCart(productId: string, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/add`, { productId, quantity }).pipe(
      tap(() => this.refreshCartCount()),
    );
  }

  updateCartItem(itemId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/cart/item/${itemId}`, { quantity }).pipe(
      tap(() => this.refreshCartCount()),
    );
  }

  removeFromCart(itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/item/${itemId}`).pipe(
      tap(() => this.refreshCartCount()),
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/clear`).pipe(
      tap(() => this.cartCountSubject.next(0)),
    );
  }

  getCartCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cart/count`);
  }

  refreshCartCount() {
    this.getCartCount().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.cartCountSubject.next(res.data.count);
        }
      },
      error: () => {},
    });
  }

  resetCount() {
    this.cartCountSubject.next(0);
  }
}
