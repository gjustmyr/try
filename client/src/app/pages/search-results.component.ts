import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { ProductCardComponent } from '../components/product-card.component';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ProductCardComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="search-page">
      <div class="container">
        <div class="search-header">
          <h2>
            Search results for "<span class="query-text">{{ query }}</span
            >"
          </h2>
          <p class="result-count" *ngIf="!loading">
            {{ products.length }} product{{ products.length !== 1 ? 's' : '' }} and
            {{ shops.length }} store{{ shops.length !== 1 ? 's' : '' }} found
          </p>
        </div>

        <div class="loading" *ngIf="loading">
          <i class="pi pi-spin pi-spinner"></i> Searching...
        </div>

        <!-- Shops Section -->
        <div class="section" *ngIf="!loading && shops.length > 0">
          <h3 class="section-title"><i class="pi pi-shop"></i> Stores</h3>
          <div class="shops-grid">
            <div class="shop-card" *ngFor="let shop of shops" (click)="goToShop(shop.id)">
              <div
                class="shop-banner"
                [style.backgroundImage]="
                  shop.shopBanner?.url ? 'url(' + shop.shopBanner.url + ')' : ''
                "
              >
                <div class="shop-logo-wrap">
                  <img *ngIf="shop.shopLogo?.url" [src]="shop.shopLogo.url" class="shop-logo" />
                  <div *ngIf="!shop.shopLogo?.url" class="shop-logo-fallback">
                    <i class="pi pi-shop"></i>
                  </div>
                </div>
              </div>
              <div class="shop-info">
                <h4 class="shop-name">{{ shop.shopName }}</h4>
                <p class="shop-desc" *ngIf="shop.shopDescription">{{ shop.shopDescription }}</p>
                <div class="shop-stats">
                  <span><i class="pi pi-star-fill"></i> {{ shop.rating || '0.0' }}</span>
                  <span><i class="pi pi-box"></i> {{ shop.productCount || 0 }} products</span>
                  <span class="badge" *ngIf="shop.businessType">{{ shop.businessType }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Products Section -->
        <div class="section" *ngIf="!loading && products.length > 0">
          <h3 class="section-title"><i class="pi pi-box"></i> Products</h3>
          <div class="products-grid">
            <app-product-card
              *ngFor="let product of products"
              [product]="product"
            ></app-product-card>
          </div>
        </div>

        <!-- No Results -->
        <div class="no-results" *ngIf="!loading && products.length === 0 && shops.length === 0">
          <i class="pi pi-search"></i>
          <h3>No results found</h3>
          <p>Try a different search term or browse our <a (click)="goToShops()">stores</a></p>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .search-page {
        padding: 30px 0;
        background: #f9fafb;
        min-height: calc(100vh - 120px);
      }
      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .search-header {
        margin-bottom: 28px;
      }
      .search-header h2 {
        font-size: 22px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 6px;
      }
      .query-text {
        color: #ff6b35;
      }
      .result-count {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }
      .loading {
        text-align: center;
        padding: 60px 0;
        font-size: 16px;
        color: #6b7280;
      }
      .loading i {
        margin-right: 8px;
      }

      .section {
        margin-bottom: 36px;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-title i {
        color: #ff6b35;
        font-size: 15px;
      }

      /* Shops Grid */
      .shops-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .shop-card {
        background: white;
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        border: 1px solid #e5e7eb;
        transition:
          box-shadow 0.2s,
          transform 0.2s;
      }
      .shop-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
      .shop-banner {
        height: 80px;
        background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
        background-size: cover;
        background-position: center;
        position: relative;
      }
      .shop-logo-wrap {
        position: absolute;
        bottom: -22px;
        left: 16px;
      }
      .shop-logo,
      .shop-logo-fallback {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid white;
        object-fit: cover;
        background: white;
      }
      .shop-logo-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        color: #9ca3af;
        font-size: 18px;
      }
      .shop-info {
        padding: 28px 16px 16px;
      }
      .shop-name {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px;
      }
      .shop-desc {
        font-size: 13px;
        color: #6b7280;
        margin: 0 0 10px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .shop-stats {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: #6b7280;
      }
      .shop-stats i {
        font-size: 11px;
        color: #f59e0b;
      }
      .badge {
        background: #f3f4f6;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        text-transform: capitalize;
      }

      /* Products Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
      }

      /* No Results */
      .no-results {
        text-align: center;
        padding: 80px 0;
        color: #6b7280;
      }
      .no-results i {
        font-size: 48px;
        color: #d1d5db;
        margin-bottom: 16px;
      }
      .no-results h3 {
        font-size: 18px;
        color: #374151;
        margin: 0 0 8px;
      }
      .no-results p {
        font-size: 14px;
        margin: 0;
      }
      .no-results a {
        color: #ff6b35;
        cursor: pointer;
        text-decoration: underline;
      }
    `,
  ],
})
export class SearchResultsComponent implements OnInit {
  query = '';
  products: any[] = [];
  shops: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.query = params['q'] || '';
      if (this.query) {
        this.performSearch();
      }
    });
  }

  performSearch() {
    this.loading = true;
    this.productService.search(this.query, 50).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.products = res.data.products;
          this.shops = res.data.shops;
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

  goToShop(id: string) {
    this.router.navigate(['/shop', id]);
  }

  goToShops() {
    this.router.navigate(['/shops']);
  }
}
