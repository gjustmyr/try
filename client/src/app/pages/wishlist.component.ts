import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { ProductCardComponent } from '../components/product-card.component';
import { WishlistService } from '../services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, ProductCardComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="wishlist-page">
      <div class="container">
        <div class="page-header">
          <h1><i class="pi pi-heart"></i> My Wishlist</h1>
          <p *ngIf="!loading">
            {{ wishlistItems.length }} item{{ wishlistItems.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div class="loading" *ngIf="loading">
          <i class="pi pi-spin pi-spinner"></i> Loading your wishlist...
        </div>

        <div class="wishlist-grid" *ngIf="!loading && wishlistItems.length > 0">
          <app-product-card
            *ngFor="let item of wishlistItems"
            [product]="item.product"
          ></app-product-card>
        </div>

        <div class="empty-wishlist" *ngIf="!loading && wishlistItems.length === 0">
          <i class="pi pi-heart"></i>
          <h3>Your wishlist is empty</h3>
          <p>Save items you love to your wishlist and shop them later!</p>
          <button class="browse-btn" (click)="goToShop()">
            <span>Browse Products</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .wishlist-page {
        min-height: calc(100vh - 120px);
        background: #f9fafb;
        padding: 40px 0;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .page-header h1 {
        font-size: 28px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 8px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .page-header h1 i {
        color: #ff6b35;
        font-size: 26px;
      }

      .page-header p {
        font-size: 15px;
        color: #6b7280;
        margin: 0;
      }

      .loading {
        text-align: center;
        padding: 80px 0;
        font-size: 16px;
        color: #6b7280;
      }

      .loading i {
        margin-right: 8px;
        font-size: 20px;
      }

      .wishlist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
      }

      .empty-wishlist {
        text-align: center;
        padding: 100px 20px;
        background: white;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
      }

      .empty-wishlist i {
        font-size: 64px;
        color: #d1d5db;
        margin-bottom: 24px;
      }

      .empty-wishlist h3 {
        font-size: 22px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 12px;
      }

      .empty-wishlist p {
        font-size: 15px;
        color: #6b7280;
        margin: 0 0 32px;
      }

      .browse-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 32px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .browse-btn:hover {
        background: #e55a28;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      }

      .browse-btn i {
        font-size: 14px;
      }

      @media (max-width: 768px) {
        .wishlist-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .page-header h1 {
          font-size: 24px;
        }
      }

      @media (max-width: 500px) {
        .wishlist-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];
  loading = false;

  constructor(
    private router: Router,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    this.loading = true;
    this.wishlistService.getWishlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.wishlistItems = res.data;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  goToShop() {
    this.router.navigate(['/search']);
  }
}
