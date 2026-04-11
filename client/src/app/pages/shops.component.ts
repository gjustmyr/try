import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { SellerService } from '../services/seller.service';

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>

      <section class="shops-hero">
        <div class="container">
          <h1>Browse Stores</h1>
          <p>Discover verified sellers and their unique products</p>
        </div>
      </section>

      <section class="shops-section">
        <div class="container">
          <div class="shops-header">
            <span class="shop-count"
              >{{ shops.length }} {{ shops.length === 1 ? 'Store' : 'Stores' }}</span
            >
            <div class="sort-wrapper">
              <label>Sort by:</label>
              <select [value]="sortBy" (change)="onSortChange($event)">
                <option value="best-selling">Best Selling</option>
                <option value="rating">Highest Rated</option>
                <option value="products">Most Products</option>
                <option value="name-az">Name: A-Z</option>
                <option value="name-za">Name: Z-A</option>
              </select>
            </div>
          </div>

          @if (isLoading) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading stores...</p>
            </div>
          } @else if (shops.length === 0) {
            <div class="empty-state">
              <i class="pi pi-building"></i>
              <h3>No stores available</h3>
              <p>Check back later for new sellers</p>
            </div>
          } @else {
            <div class="shops-grid">
              @for (shop of sortedShops; track shop.id) {
                <div class="shop-card" (click)="goToShop(shop.id)">
                  <div class="shop-banner">
                    @if (shop.shopBanner) {
                      <img [src]="shop.shopBanner" alt="Banner" class="banner-img" />
                    } @else {
                      <div class="banner-placeholder">
                        <i class="pi pi-image"></i>
                      </div>
                    }
                  </div>
                  <div class="shop-body">
                    <div class="shop-logo-wrapper">
                      @if (shop.shopLogo) {
                        <img [src]="shop.shopLogo" alt="Logo" class="shop-logo" />
                      } @else {
                        <div class="logo-placeholder">
                          <span>{{ getInitial(shop.shopName) }}</span>
                        </div>
                      }
                    </div>
                    <h3 class="shop-name">{{ shop.shopName }}</h3>
                    @if (shop.shopDescription) {
                      <p class="shop-desc">{{ shop.shopDescription }}</p>
                    } @else {
                      <p class="shop-desc no-desc">No description yet</p>
                    }
                    <div class="shop-meta">
                      <span class="meta-item">
                        <i class="pi pi-box"></i>
                        {{ shop.productCount }}
                        {{ shop.productCount === 1 ? 'Product' : 'Products' }}
                      </span>
                      <span class="meta-item">
                        <i class="pi pi-star-fill"></i>
                        @if (shop.avgRating > 0) {
                          {{ shop.avgRating }} ({{ shop.totalReviews }})
                        } @else {
                          New
                        }
                      </span>
                      <span class="meta-item">
                        <i class="pi pi-shopping-cart"></i>
                        {{ shop.totalSales }} sold
                      </span>
                    </div>
                    <div class="shop-badges">
                      <span class="badge badge-verified">
                        <i class="pi pi-verified"></i> Verified
                      </span>
                      <span class="badge badge-type">{{ shop.businessType }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .app-container {
        background: #f3f4f6;
        min-height: 100vh;
      }

      .shops-hero {
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        padding: 48px 0;
        text-align: center;
        color: white;
      }
      .shops-hero h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .shops-hero p {
        font-size: 16px;
        color: #d1d5db;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .shops-section {
        padding: 32px 0 64px;
      }
      .shops-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .shop-count {
        font-size: 15px;
        color: #6b7280;
        font-weight: 500;
      }

      .sort-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sort-wrapper label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .sort-wrapper select {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        color: #374151;
        background: white;
        cursor: pointer;
        outline: none;
      }

      .sort-wrapper select:focus {
        border-color: #ff6b35;
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 80px 0;
        color: #9ca3af;
      }
      .loading-state i,
      .empty-state i {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
      }
      .empty-state h3 {
        font-size: 20px;
        color: #374151;
        margin-bottom: 8px;
      }

      .shops-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }

      .shop-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        cursor: pointer;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }
      .shop-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      .shop-banner {
        height: 140px;
        overflow: hidden;
        background: #f9fafb;
      }
      .banner-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .banner-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #ff6b35 0%, #ff8f65 100%);
        color: rgba(255, 255, 255, 0.4);
        font-size: 32px;
      }

      .shop-body {
        padding: 20px;
        position: relative;
      }
      .shop-logo-wrapper {
        position: absolute;
        top: -32px;
        left: 20px;
        width: 64px;
        height: 64px;
        border-radius: 12px;
        overflow: hidden;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .shop-logo {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .logo-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ff6b35;
        color: white;
        font-size: 24px;
        font-weight: 700;
      }

      .shop-name {
        margin-top: 28px;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }
      .shop-desc {
        font-size: 14px;
        color: #6b7280;
        margin-top: 6px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.5;
      }
      .shop-desc.no-desc {
        font-style: italic;
        color: #9ca3af;
      }

      .shop-meta {
        display: flex;
        gap: 16px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #6b7280;
      }
      .meta-item i {
        font-size: 13px;
      }
      .meta-item .pi-star-fill {
        color: #f59e0b;
      }

      .shop-badges {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-verified {
        background: #ecfdf5;
        color: #059669;
      }
      .badge-verified i {
        font-size: 12px;
      }
      .badge-type {
        background: #eff6ff;
        color: #2563eb;
        text-transform: capitalize;
      }

      @media (max-width: 900px) {
        .shops-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .shops-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
      }
      @media (max-width: 600px) {
        .shops-grid {
          grid-template-columns: 1fr;
        }
        .shops-hero h1 {
          font-size: 24px;
        }
        .sort-wrapper {
          width: 100%;
        }
        .sort-wrapper select {
          flex: 1;
        }
      }
    `,
  ],
})
export class ShopsComponent implements OnInit {
  shops: any[] = [];
  isLoading = false;
  sortBy: string = 'best-selling';

  constructor(
    private router: Router,
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadShops();
  }

  loadShops() {
    this.isLoading = true;
    this.sellerService.getAllShops().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.shops = res.data || [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.shops = [];
        this.cdr.detectChanges();
      },
    });
  }

  goToShop(sellerId: string) {
    this.router.navigate(['/shop', sellerId]);
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'S';
  }

  get sortedShops(): any[] {
    let sorted = [...this.shops];

    switch (this.sortBy) {
      case 'best-selling':
        sorted.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'products':
        sorted.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
        break;
      case 'name-az':
        sorted.sort((a, b) => a.shopName.localeCompare(b.shopName));
        break;
      case 'name-za':
        sorted.sort((a, b) => b.shopName.localeCompare(a.shopName));
        break;
      default:
        break;
    }

    return sorted;
  }

  onSortChange(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value;
  }
}
