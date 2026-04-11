import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api';
  private wishlistIds = new BehaviorSubject<Set<string>>(new Set());
  public wishlistIds$ = this.wishlistIds.asObservable();

  constructor(private http: HttpClient) {
    this.loadWishlistIds();
  }

  private loadWishlistIds() {
    this.getWishlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          const ids = new Set<string>(res.data.map((item: any) => item.productId));
          this.wishlistIds.next(ids);
        }
      },
      error: () => {
        // User not logged in or error - reset wishlist
        this.wishlistIds.next(new Set<string>());
      },
    });
  }

  getWishlist(): Observable<any> {
    return this.http.get(`${this.apiUrl}/wishlist`);
  }

  addToWishlist(productId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wishlist`, { productId }).pipe(
      tap(() => {
        const current = new Set(this.wishlistIds.value);
        current.add(productId);
        this.wishlistIds.next(current);
      }),
    );
  }

  removeFromWishlist(productId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/wishlist/${productId}`).pipe(
      tap(() => {
        const current = new Set(this.wishlistIds.value);
        current.delete(productId);
        this.wishlistIds.next(current);
      }),
    );
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistIds.value.has(productId);
  }

  refreshWishlist() {
    this.loadWishlistIds();
  }
}
