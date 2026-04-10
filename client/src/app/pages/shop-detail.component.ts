import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { ProductCardComponent } from '../components/product-card.component';
import { SellerService } from '../services/seller.service';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ProductCardComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>

      @if (isLoading) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading store...</p>
        </div>
      } @else if (!shop) {
        <div class="error-state">
          <i class="pi pi-exclamation-circle"></i>
          <h3>Store not found</h3>
          <p>This store may no longer exist.</p>
          <button class="back-btn" (click)="goBack()">
            <i class="pi pi-arrow-left"></i> Back to Stores
          </button>
        </div>
      } @else {
        <!-- Shop Banner -->
        <div class="shop-banner-section">
          @if (shop.shopBanner) {
            <img [src]="shop.shopBanner" alt="Banner" class="shop-banner-img" />
          } @else {
            <div class="shop-banner-placeholder"></div>
          }
          <div class="shop-banner-overlay"></div>
        </div>

        <!-- Shop Info -->
        <section class="shop-info-section">
          <div class="container">
            <div class="shop-info-card">
              <div class="shop-logo-lg">
                @if (shop.shopLogo) {
                  <img [src]="shop.shopLogo" [alt]="shop.shopName" />
                } @else {
                  <div class="logo-placeholder-lg">
                    <span>{{ shop.shopName?.charAt(0)?.toUpperCase() }}</span>
                  </div>
                }
              </div>
              <div class="shop-details">
                <div class="shop-name-row">
                  <h1>{{ shop.shopName }}</h1>
                  <span class="verified-badge">
                    <i class="pi pi-verified"></i> Verified Seller
                  </span>
                </div>
                @if (shop.shopDescription) {
                  <p class="shop-description">{{ shop.shopDescription }}</p>
                }
                <div class="shop-stats">
                  <div class="stat">
                    <span class="stat-value">{{ shop.productCount }}</span>
                    <span class="stat-label">Products</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat">
                    <span class="stat-value">
                      @if (shop.rating > 0) {
                        <i class="pi pi-star-fill star-icon"></i> {{ shop.rating }}
                      } @else {
                        New
                      }
                    </span>
                    <span class="stat-label">Rating</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat">
                    <span class="stat-value">{{ shop.totalSales }}</span>
                    <span class="stat-label">Total Sales</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat">
                    <span class="stat-value capitalize">{{ shop.businessType }}</span>
                    <span class="stat-label">Business Type</span>
                  </div>
                </div>
                <div class="shop-info-footer">
                  <div class="address-block">
                    <i class="pi pi-map-marker"></i>
                    @if (shop.businessAddress) {
                      <span>{{ shop.businessAddress }}</span>
                    } @else {
                      <span class="no-address">No address provided</span>
                    }
                  </div>
                  <div class="joined-block">
                    <i class="pi pi-calendar"></i>
                    <span>Joined {{ formatDate(shop.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Products -->
        <section class="products-section">
          <div class="container">
            <!-- Category Tabs -->
            <div class="category-bar">
              <button
                class="category-tab"
                [class.active]="selectedCategory === 'all'"
                (click)="selectCategory('all')"
              >
                <i class="pi pi-th-large"></i> All
                <span class="cat-count">{{ products.length }}</span>
              </button>
              @for (cat of productCategories; track cat) {
                <button
                  class="category-tab"
                  [class.active]="selectedCategory === cat"
                  (click)="selectCategory(cat)"
                >
                  {{ getCategoryName(cat) }}
                  <span class="cat-count">{{ getCategoryCount(cat) }}</span>
                </button>
              }
            </div>

            <!-- Sort + Count Bar -->
            <div class="toolbar">
              <span class="result-count">
                {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'item' : 'items' }}
              </span>
              <div class="sort-wrapper">
                <label>Sort by:</label>
                <select [value]="sortBy" (change)="onSortChange($event)">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="best-selling">Best Selling</option>
                  <option value="name-az">Name: A-Z</option>
                  <option value="name-za">Name: Z-A</option>
                </select>
              </div>
            </div>

            @if (filteredProducts.length === 0) {
              <div class="empty-products">
                <i class="pi pi-box"></i>
                <h3>No products found</h3>
                @if (selectedCategory !== 'all') {
                  <p>No products in this category.</p>
                  <button class="clear-filter-btn" (click)="selectCategory('all')">View All Products</button>
                } @else {
                  <p>This store hasn't listed any products yet.</p>
                }
              </div>
            } @else {
              <div class="products-grid">
                @for (product of filteredProducts; track product.id) {
                  <app-product-card [product]="product" />
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .app-container { background: #f3f4f6; min-height: 100vh; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

    .loading-state, .error-state {
      text-align: center; padding: 120px 0; color: #9ca3af;
    }
    .loading-state i, .error-state i {
      font-size: 48px; margin-bottom: 16px; display: block;
    }
    .error-state h3 { font-size: 20px; color: #374151; margin-bottom: 8px; }
    .back-btn {
      margin-top: 16px; padding: 10px 24px; background: #ff6b35; color: white;
      border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px; font-size: 14px;
    }
    .back-btn:hover { background: #e55a28; }

    /* Banner */
    .shop-banner-section { position: relative; height: 240px; overflow: hidden; }
    .shop-banner-img { width: 100%; height: 100%; object-fit: cover; }
    .shop-banner-placeholder {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1f2937 0%, #374151 50%, #ff6b35 100%);
    }
    .shop-banner-overlay {
      position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
      background: linear-gradient(transparent, rgba(0,0,0,0.3));
    }

    /* Shop Info */
    .shop-info-section { margin-top: -40px; position: relative; z-index: 1; padding-bottom: 32px; }
    .shop-info-card {
      background: white; border-radius: 12px; padding: 24px 32px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08); display: flex; gap: 24px;
      border: 1px solid #e5e7eb;
    }
    .shop-logo-lg {
      width: 96px; height: 96px; border-radius: 16px; overflow: hidden;
      flex-shrink: 0; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .shop-logo-lg img { width: 100%; height: 100%; object-fit: cover; }
    .logo-placeholder-lg {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #ff6b35; color: white; font-size: 36px; font-weight: 700;
    }
    .shop-details { flex: 1; }
    .shop-name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .shop-name-row h1 { font-size: 24px; font-weight: 700; color: #1f2937; }
    .verified-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; background: #ecfdf5; color: #059669;
      border-radius: 20px; font-size: 13px; font-weight: 600;
    }
    .verified-badge i { font-size: 14px; }
    .shop-description { margin-top: 8px; font-size: 15px; color: #6b7280; line-height: 1.6; }

    .shop-stats {
      display: flex; align-items: center; gap: 24px; margin-top: 16px;
      padding: 16px 0; border-top: 1px solid #f3f4f6;
    }
    .stat { text-align: center; }
    .stat-value {
      font-size: 18px; font-weight: 700; color: #1f2937;
      display: flex; align-items: center; justify-content: center; gap: 4px;
    }
    .star-icon { color: #f59e0b; font-size: 16px; }
    .stat-label { font-size: 13px; color: #9ca3af; display: block; margin-top: 2px; }
    .stat-divider { width: 1px; height: 32px; background: #e5e7eb; }
    .capitalize { text-transform: capitalize; }

    .shop-info-footer {
      display: flex; gap: 24px; margin-top: 12px; flex-wrap: wrap;
      padding-top: 12px; border-top: 1px solid #f3f4f6;
    }
    .address-block, .joined-block {
      display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #6b7280;
    }
    .address-block i, .joined-block i { font-size: 14px; color: #9ca3af; margin-top: 2px; }
    .no-address { font-style: italic; color: #d1d5db; }

    /* Category Bar */
    .category-bar {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
      padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;
    }
    .category-tab {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px;
      background: white; color: #6b7280; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .category-tab:hover { border-color: #ff6b35; color: #ff6b35; }
    .category-tab.active {
      background: #ff6b35; color: white; border-color: #ff6b35;
    }
    .category-tab.active .cat-count { background: rgba(255,255,255,0.25); color: white; }
    .cat-count {
      background: #f3f4f6; padding: 1px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 600; color: #9ca3af;
    }

    /* Toolbar */
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .result-count { font-size: 14px; color: #6b7280; }
    .sort-wrapper { display: flex; align-items: center; gap: 8px; }
    .sort-wrapper label { font-size: 13px; color: #6b7280; }
    .sort-wrapper select {
      padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
      font-size: 13px; color: #374151; background: white; cursor: pointer;
      outline: none;
    }
    .sort-wrapper select:focus { border-color: #ff6b35; }

    /* Products */
    .products-section { padding: 0 0 64px; }
    .empty-products { text-align: center; padding: 80px 0; color: #9ca3af; }
    .empty-products i { font-size: 48px; margin-bottom: 16px; display: block; }
    .empty-products h3 { font-size: 18px; color: #374151; margin-bottom: 8px; }
    .clear-filter-btn {
      margin-top: 12px; padding: 8px 20px; background: #ff6b35; color: white;
      border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;
    }
    .clear-filter-btn:hover { background: #e55a28; }

    .products-grid {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px;
    }

    @media (max-width: 1100px) {
      .products-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .products-grid { grid-template-columns: repeat(2, 1fr); }
      .shop-info-card { flex-direction: column; align-items: center; text-align: center; }
      .shop-stats { justify-content: center; flex-wrap: wrap; }
      .shop-info-footer { justify-content: center; }
      .shop-name-row { justify-content: center; }
      .shop-banner-section { height: 180px; }
      .toolbar { flex-direction: column; gap: 12px; align-items: flex-start; }
    }
    @media (max-width: 500px) {
      .products-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ShopDetailComponent implements OnInit {
  shop: any = null;
  products: any[] = [];
  isLoading = false;
  selectedCategory = 'all';
  sortBy = 'newest';
  productCategories: string[] = [];

  private categoryMap: Record<string, string> = {
    electronics: 'Electronics',
    fashion: 'Fashion',
    home: 'Home',
    beauty: 'Beauty',
    sports: 'Sports',
    books: 'Books',
    food: 'Food & Grocery',
    toys: 'Toys & Games',
    automotive: 'Automotive',
    others: 'Others',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (sellerId) {
      this.loadShop(sellerId);
    }
  }

  loadShop(sellerId: string) {
    this.isLoading = true;
    this.sellerService.getShopDetail(sellerId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.shop = res.data.shop;
          this.products = res.data.products || [];
          this.extractCategories();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  extractCategories() {
    const cats = new Set<string>();
    this.products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    this.productCategories = Array.from(cats).sort();
  }

  get filteredProducts(): any[] {
    let result = this.products;

    if (this.selectedCategory !== 'all') {
      result = result.filter((p) => p.category === this.selectedCategory);
    }

    switch (this.sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'best-selling':
        result = [...result].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
        break;
      case 'name-az':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
  }

  onSortChange(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value;
  }

  getCategoryName(cat: string): string {
    return this.categoryMap[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  getCategoryCount(cat: string): number {
    return this.products.filter((p) => p.category === cat).length;
  }

  goBack() {
    this.router.navigate(['/shops']);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }
}
