import { Component, Input, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { WishlistService } from '../services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-card" (click)="goToProduct()">
      <div class="product-image-wrapper">
        @if (product.images && product.images.length > 0) {
          <img [src]="product.images[0].url" [alt]="product.name" class="product-image" />
        } @else {
          <div class="no-image">
            <i class="pi pi-image"></i>
          </div>
        }
        <button
          class="wishlist-btn"
          [class.active]="isInWishlist"
          (click)="toggleWishlist($event)"
          title="Add to wishlist"
        >
          <i class="pi" [class.pi-heart]="!isInWishlist" [class.pi-heart-fill]="isInWishlist"></i>
        </button>
        @if (product.compareAtPrice && product.compareAtPrice > product.price) {
          <span class="badge badge-sale">sale</span>
        }
        @if (product.quantity <= 0) {
          <div class="out-of-stock-overlay">Out of Stock</div>
        }
      </div>

      <div class="product-info">
        @if (product.seller) {
          <div class="shop-info" (click)="goToShop($event)">
            <span class="shop-logo">🏪</span>
            <span class="shop-name">{{ product.seller.shopName }}</span>
          </div>
        }

        <h3 class="product-name">{{ product.name }}</h3>

        @if (product.category) {
          <span class="product-category">{{ product.category }}</span>
        }

        @if (product.avgRating > 0 || product.totalReviews > 0) {
          <div class="rating">
            <div class="stars">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                @if (star <= product.avgRating) {
                  <i class="pi pi-star-fill"></i>
                } @else if (star - 0.5 <= product.avgRating) {
                  <i class="pi pi-star-half-fill"></i>
                } @else {
                  <i class="pi pi-star"></i>
                }
              }
            </div>
            <span class="rating-text">{{ product.avgRating }} ({{ product.totalReviews }})</span>
          </div>
        }

        <div class="price-section">
          <span class="price">₱{{ product.price }}</span>
          @if (product.compareAtPrice && product.compareAtPrice > product.price) {
            <span class="original-price">₱{{ product.compareAtPrice }}</span>
          }
        </div>

        <button
          class="add-to-cart"
          [disabled]="product.quantity <= 0 || addingToCart"
          (click)="addToCart($event)"
        >
          @if (addingToCart) {
            <i class="pi pi-spinner pi-spin"></i>
            Adding...
          } @else if (cartAdded) {
            <i class="pi pi-check"></i>
            Added!
          } @else {
            <i
              class="pi"
              [class.pi-shopping-cart]="product.quantity > 0"
              [class.pi-times-circle]="product.quantity <= 0"
            ></i>
            {{ product.quantity > 0 ? 'Add to Cart' : 'Out of Stock' }}
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .product-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 1px solid #e5e7eb;
        cursor: pointer;
      }

      .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #ff6b35;
      }

      .product-image-wrapper {
        position: relative;
        padding-top: 100%;
        overflow: hidden;
        background: #f9fafb;
      }

      .wishlist-btn {
        position: absolute;
        top: 12px;
        left: 12px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .wishlist-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .wishlist-btn i {
        font-size: 18px;
        color: #6b7280;
        transition: color 0.2s;
      }

      .wishlist-btn:hover i {
        color: #ff6b35;
      }

      .wishlist-btn.active i {
        color: #ff6b35;
      }

      .product-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
      }

      .no-image i {
        font-size: 48px;
        color: #d1d5db;
      }

      .product-category {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge-sale {
        background: #ff6b35;
        color: white;
      }
      .badge-new {
        background: #1f2937;
        color: white;
      }
      .badge-hot {
        background: #ff6b35;
        color: white;
      }

      .out-of-stock-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(31, 41, 55, 0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
      }

      .product-info {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .shop-info {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #6b7280;
        cursor: pointer;
      }

      .shop-info:hover .shop-name {
        color: #ff6b35;
        text-decoration: underline;
      }

      .shop-logo {
        font-size: 14px;
      }

      .shop-name {
        font-weight: 500;
        transition: color 0.15s;
      }

      .verified-icon {
        color: #ff6b35;
        font-size: 12px;
      }

      .product-name {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #1f2937;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 13px;
      }

      .stars {
        display: flex;
        gap: 2px;
        color: #ff6b35;
      }

      .stars i {
        font-size: 13px;
      }

      .rating-text {
        color: #6b7280;
        font-size: 12px;
      }

      .price-section {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        margin-top: auto;
      }

      .price {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
      }

      .original-price {
        font-size: 14px;
        color: #9ca3af;
        text-decoration: line-through;
      }

      .add-to-cart {
        width: 100%;
        padding: 10px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
      }

      .add-to-cart i {
        font-size: 14px;
      }

      .add-to-cart:hover:not(:disabled) {
        background: #e55a28;
      }

      .add-to-cart:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ProductCardComponent implements OnInit {
  @Input() product: any;
  addingToCart = false;
  cartAdded = false;
  isInWishlist = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Check if product is in wishlist
    if (this.product?.id) {
      this.isInWishlist = this.wishlistService.isInWishlist(this.product.id);
    }

    // Subscribe to wishlist changes
    this.wishlistService.wishlistIds$.subscribe(() => {
      if (this.product?.id) {
        this.isInWishlist = this.wishlistService.isInWishlist(this.product.id);
        this.cdr.detectChanges();
      }
    });
  }

  toggleWishlist(event: Event) {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isInWishlist) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(this.product.id).subscribe({
        next: () => {
          this.isInWishlist = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Remove from wishlist failed:', err);
        },
      });
    } else {
      // Add to wishlist
      this.wishlistService.addToWishlist(this.product.id).subscribe({
        next: () => {
          this.isInWishlist = true;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Add to wishlist failed:', err);
        },
      });
    }
  }

  goToProduct() {
    if (this.product?.id) {
      this.router.navigate(['/product', this.product.id]);
    }
  }

  goToShop(event: Event) {
    event.stopPropagation();
    if (this.product?.seller?.id) {
      this.router.navigate(['/shop', this.product.seller.id]);
    }
  }

  addToCart(event: Event) {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.addingToCart = true;
    this.cartService.addToCart(this.product.id).subscribe({
      next: () => {
        this.addingToCart = false;
        this.cartAdded = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cartAdded = false;
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err: any) => {
        this.addingToCart = false;
        this.cdr.detectChanges();
        console.error('Add to cart failed:', err);
        alert(err.error?.message || 'Failed to add to cart');
      },
    });
  }
}
