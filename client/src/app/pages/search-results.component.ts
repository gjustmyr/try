import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { ProductCardComponent } from '../components/product-card.component';
import { ProductService } from '../services/product.service';
import { CATEGORIES } from '../data/categories';

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

        <!-- Filters Bar -->
        <div class="filters-bar" *ngIf="!loading && (products.length > 0 || shops.length > 0)">
          <div class="view-filters">
            <button
              class="filter-btn"
              [class.active]="viewFilter === 'all'"
              (click)="setViewFilter('all')"
            >
              <i class="pi pi-th-large"></i> All Results
            </button>
            <button
              class="filter-btn"
              [class.active]="viewFilter === 'products'"
              (click)="setViewFilter('products')"
            >
              <i class="pi pi-box"></i> Products ({{ products.length }})
            </button>
            <button
              class="filter-btn"
              [class.active]="viewFilter === 'shops'"
              (click)="setViewFilter('shops')"
            >
              <i class="pi pi-shop"></i> Stores ({{ shops.length }})
            </button>
          </div>

          <div class="sort-controls" *ngIf="showProducts && products.length > 0">
            <label for="sort-select">Sort by:</label>
            <select id="sort-select" [value]="sortBy" (change)="onSortChange($event)">
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="best-selling">Best Selling</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        <div class="loading" *ngIf="loading">
          <i class="pi pi-spin pi-spinner"></i> Searching...
        </div>

        <!-- Shops Section -->
        <div class="section" *ngIf="!loading && shops.length > 0 && showShops">
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
                  <span>
                    <i class="pi pi-star-fill"></i>
                    @if (shop.avgRating > 0) {
                      {{ shop.avgRating }} ({{ shop.totalReviews }})
                    } @else {
                      New
                    }
                  </span>
                  <span><i class="pi pi-box"></i> {{ shop.productCount || 0 }} products</span>
                  <span class="badge" *ngIf="shop.businessType">{{ shop.businessType }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Products Section -->
        <div class="section" *ngIf="!loading && products.length > 0 && showProducts">
          <h3 class="section-title"><i class="pi pi-box"></i> Products</h3>

          <div class="products-layout">
            <!-- Category Filter Sidebar -->
            <div class="category-filter">
              <h4 class="filter-title">Categories</h4>
              <div class="category-list">
                <button
                  class="category-item"
                  [class.active]="selectedCategory === 'all'"
                  (click)="filterByCategory('all')"
                >
                  <i class="pi pi-th-large"></i>
                  <span>All</span>
                  <span class="count">({{ allProducts.length }})</span>
                </button>
                <button
                  *ngFor="let cat of categoriesWithProducts"
                  class="category-item"
                  [class.active]="selectedCategory === cat.id"
                  (click)="filterByCategory(cat.id)"
                >
                  <i [class]="cat.icon"></i>
                  <span>{{ cat.name }}</span>
                  <span class="count">({{ getCategoryCount(cat.id) }})</span>
                </button>
              </div>
            </div>

            <!-- Products Grid -->
            <div class="products-grid">
              <app-product-card
                *ngFor="let product of sortedProducts"
                [product]="product"
              ></app-product-card>
            </div>
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

      /* Filters Bar */
      .filters-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background: white;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        flex-wrap: wrap;
      }

      .view-filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 8px;
        font-size: 14px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }

      .filter-btn:hover {
        border-color: #ff6b35;
        color: #ff6b35;
      }

      .filter-btn.active {
        background: #ff6b35;
        color: white;
        border-color: #ff6b35;
      }

      .filter-btn i {
        font-size: 14px;
      }

      .sort-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sort-controls label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .sort-controls select {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        color: #374151;
        background: white;
        cursor: pointer;
        outline: none;
        min-width: 180px;
      }

      .sort-controls select:focus {
        border-color: #ff6b35;
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
      .products-layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 24px;
      }

      .category-filter {
        background: white;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        padding: 20px;
        height: fit-content;
        position: sticky;
        top: 100px;
      }

      .filter-title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 16px;
      }

      .category-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .category-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: none;
        background: transparent;
        border-radius: 8px;
        font-size: 14px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        width: 100%;
      }

      .category-item:hover {
        background: #f9fafb;
        color: #1f2937;
      }

      .category-item.active {
        background: #fff5f2;
        color: #ff6b35;
        font-weight: 600;
      }

      .category-item i {
        font-size: 16px;
        width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .category-item span:first-of-type {
        flex: 1;
      }

      .category-item .count {
        font-size: 12px;
        color: #9ca3af;
        font-weight: 500;
      }

      .category-item.active .count {
        color: #ff6b35;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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

      /* Responsive */
      @media (max-width: 768px) {
        .filters-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .view-filters {
          width: 100%;
        }

        .filter-btn {
          flex: 1;
          justify-content: center;
        }

        .sort-controls {
          width: 100%;
        }

        .sort-controls select {
          flex: 1;
        }

        .products-layout {
          grid-template-columns: 1fr;
        }

        .category-filter {
          position: static;
        }

        .products-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 500px) {
        .products-grid {
          grid-template-columns: 1fr;
        }

        .view-filters {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SearchResultsComponent implements OnInit {
  query = '';
  products: any[] = [];
  allProducts: any[] = []; // Store all products for filtering
  shops: any[] = [];
  loading = false;
  viewFilter: 'all' | 'products' | 'shops' = 'all';
  sortBy: string = 'relevance';
  selectedCategory: string = 'all';
  categories = CATEGORIES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.query = params['q'] || '';
      const category = params['category'];
      const deals = params['deals'];

      if (category) {
        // Load all products and filter by category
        this.loadProductsByCategory(category);
      } else if (deals) {
        // Load products with deals/discounts
        this.loadDeals();
      } else if (this.query) {
        this.performSearch();
      } else {
        // No query - show all products
        this.loadAllProducts();
      }
    });
  }

  loadAllProducts() {
    this.loading = true;
    this.query = 'All Products';
    this.productService.getAllProducts().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allProducts = res.data || [];
          this.products = this.allProducts;
          this.shops = [];
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

  loadProductsByCategory(category: string) {
    this.loading = true;
    this.query = category === 'all' ? 'All Products' : category;
    this.selectedCategory = category;
    this.productService.getAllProducts().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allProducts = res.data || [];
          if (category === 'all') {
            this.products = this.allProducts;
          } else {
            this.products = this.allProducts.filter((p: any) => p.category === category);
          }
          this.shops = [];
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

  loadDeals() {
    this.loading = true;
    this.query = 'Flash Deals';
    this.productService.getAllProducts().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allProducts = res.data || [];
          // Filter products that have discounts or special pricing
          this.products = this.allProducts.filter((p: any) => {
            return p.discount > 0 || p.isOnSale || p.specialPrice;
          });
          this.shops = [];
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

  filterByCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    if (categoryId === 'all') {
      this.products = this.allProducts;
    } else {
      this.products = this.allProducts.filter((p: any) => p.category === categoryId);
    }
    this.cdr.detectChanges();
  }

  getCategoryCount(categoryId: string): number {
    return this.allProducts.filter((p: any) => p.category === categoryId).length;
  }

  get categoriesWithProducts() {
    return this.categories.filter((cat) => this.getCategoryCount(cat.id) > 0);
  }

  goToShop(id: string) {
    this.router.navigate(['/shop', id]);
  }

  goToShops() {
    this.router.navigate(['/shops']);
  }

  setViewFilter(filter: 'all' | 'products' | 'shops') {
    this.viewFilter = filter;
  }

  get showProducts(): boolean {
    return this.viewFilter === 'all' || this.viewFilter === 'products';
  }

  get showShops(): boolean {
    return this.viewFilter === 'all' || this.viewFilter === 'shops';
  }

  get sortedProducts(): any[] {
    let sorted = [...this.products];

    switch (this.sortBy) {
      case 'price-low':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'best-selling':
        sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'relevance':
      default:
        // Keep original order (relevance from search)
        break;
    }

    return sorted;
  }

  onSortChange(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value;
  }
}
