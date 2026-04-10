import { Component, OnInit, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-left">
          <span><i class="pi pi-phone"></i> +1-202-555-0156</span>
          <span><i class="pi pi-envelope"></i> support&#64;multishop.com</span>
        </div>
        <div class="top-bar-right">
          <button class="seller-top-btn" (click)="navigate('/seller-register')">
            <i class="pi pi-briefcase"></i>
            <span>Become a Seller</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo" (click)="navigate('/')">
            <i class="pi pi-shopping-bag logo-icon"></i>
            <div>
              <h1>MultiShop</h1>
            </div>
          </div>

          <div class="search-bar">
            <div class="search-wrapper">
              <input
                type="text"
                placeholder="Search for products and stores..."
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                (keydown.enter)="goToSearchPage()"
                (focus)="showSearchDropdown = searchQuery.length >= 2"
              />
              <button class="search-btn" (click)="goToSearchPage()">
                <i class="pi pi-search"></i>
              </button>
              <div class="search-dropdown" *ngIf="showSearchDropdown && (searchProducts.length > 0 || searchShops.length > 0)">
                <div class="search-section" *ngIf="searchShops.length > 0">
                  <div class="search-section-title"><i class="pi pi-shop"></i> Stores</div>
                  <div class="search-item shop-item" *ngFor="let shop of searchShops" (mousedown)="goToShop(shop.id)">
                    <img *ngIf="shop.shopLogo?.url" [src]="shop.shopLogo.url" class="search-shop-logo" />
                    <div *ngIf="!shop.shopLogo?.url" class="search-shop-logo-placeholder"><i class="pi pi-shop"></i></div>
                    <div class="search-item-info">
                      <div class="search-item-name">{{ shop.shopName }}</div>
                      <div class="search-item-meta">{{ shop.productCount || 0 }} products</div>
                    </div>
                  </div>
                </div>
                <div class="search-section" *ngIf="searchProducts.length > 0">
                  <div class="search-section-title"><i class="pi pi-box"></i> Products</div>
                  <div class="search-item product-item" *ngFor="let product of searchProducts" (mousedown)="goToProduct(product.id)">
                    <img *ngIf="product.images?.length" [src]="product.images[0].url" class="search-product-img" />
                    <div *ngIf="!product.images?.length" class="search-product-img-placeholder"><i class="pi pi-image"></i></div>
                    <div class="search-item-info">
                      <div class="search-item-name">{{ product.name }}</div>
                      <div class="search-item-meta">₱{{ product.price | number:'1.2-2' }}<span *ngIf="product.seller"> · {{ product.seller.shopName }}</span></div>
                    </div>
                  </div>
                </div>
                <div class="search-view-all" *ngIf="searchQuery.length >= 2" (mousedown)="goToSearchPage()">
                  View all results for "{{ searchQuery }}"
                </div>
              </div>
              <div class="search-dropdown" *ngIf="showSearchDropdown && searchQuery.length >= 2 && searchProducts.length === 0 && searchShops.length === 0 && !searchLoading">
                <div class="search-no-results">No results found for "{{ searchQuery }}"</div>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button class="icon-btn">
              <i class="pi pi-heart"></i>
              <span class="badge">0</span>
            </button>
            <button class="icon-btn cart-btn" (click)="navigate('/cart')">
              <i class="pi pi-shopping-cart"></i>
              <span class="badge">{{ cartCount }}</span>
            </button>

            <!-- Not logged in -->
            <button class="user-btn" *ngIf="!currentUser" (click)="navigate('/login')">
              <i class="pi pi-user"></i>
              <span>Sign In</span>
            </button>

            <!-- Logged in -->
            <div class="profile-wrapper" *ngIf="currentUser">
              <button class="profile-btn" (click)="toggleProfileDropdown($event)">
                <div class="profile-avatar">{{ getInitial() }}</div>
                <span class="profile-name">{{ getFirstName() }}</span>
                <i class="pi pi-chevron-down"></i>
              </button>
              <div class="profile-dropdown" *ngIf="showProfileDropdown">
                <div class="dropdown-header">
                  <div class="dropdown-avatar">{{ getInitial() }}</div>
                  <div>
                    <div class="dropdown-name">{{ currentUser.fullName || 'User' }}</div>
                    <div class="dropdown-email">{{ currentUser.email }}</div>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" (click)="navigate('/profile')">
                  <i class="pi pi-user"></i> My Account
                </button>
                <button class="dropdown-item" *ngIf="currentUser.userType === 'seller'" (click)="navigate('/seller/dashboard')">
                  <i class="pi pi-th-large"></i> Seller Dashboard
                </button>
                <button class="dropdown-item logout-item" (click)="logout()">
                  <i class="pi pi-sign-out"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-bar {
      background: #1f2937;
      color: white;
      padding: 8px 0;
      font-size: 13px;
    }
    .top-bar .container { display: flex; justify-content: space-between; align-items: center; }
    .top-bar-left { display: flex; gap: 24px; }
    .top-bar-right { display: flex; align-items: center; }
    .top-bar-left span { display: flex; align-items: center; gap: 6px; color: #d1d5db; }
    .top-bar i { font-size: 12px; }
    .seller-top-btn {
      display: flex; align-items: center; gap: 6px; padding: 6px 16px;
      background: #ff6b35; color: white; border: none; border-radius: 4px;
      cursor: pointer; font-weight: 500; font-size: 13px; transition: background 0.2s;
    }
    .seller-top-btn:hover { background: #e55a28; }
    .seller-top-btn i { font-size: 13px; }

    .header { background: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
    .header-content { display: flex; align-items: center; justify-content: space-between; gap: 32px; }
    .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .logo-icon { font-size: 28px; color: #1f2937; }
    .logo h1 { font-size: 20px; color: #1f2937; font-weight: 700; }

    .search-bar {
      flex: 1; max-width: 500px; display: flex; position: relative;
    }
    .search-wrapper {
      flex: 1; display: flex; position: relative;
      border: 1px solid #d1d5db; border-radius: 6px; overflow: visible;
    }
    .search-wrapper:focus-within { border-color: #ff6b35; box-shadow: 0 0 0 2px rgba(255,107,53,0.15); }
    .search-bar input {
      flex: 1; padding: 10px 16px; border: none; font-size: 14px;
      outline: none; background: #ffffff; color: #1f2937; border-radius: 6px 0 0 6px;
    }
    .search-bar input::placeholder { color: #9ca3af; }
    .search-btn {
      padding: 10px 20px; background: #ff6b35; color: white;
      border: none; cursor: pointer; transition: background 0.2s; border-radius: 0 6px 6px 0;
    }
    .search-btn:hover { background: #e55a28; }

    /* Search Dropdown */
    .search-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px;
      background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 1px solid #e5e7eb; z-index: 1000; max-height: 420px; overflow-y: auto;
    }
    .search-section { padding: 6px 0; }
    .search-section-title {
      padding: 8px 14px 6px; font-size: 11px; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;
    }
    .search-section-title i { font-size: 12px; }
    .search-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 14px;
      cursor: pointer; transition: background 0.15s;
    }
    .search-item:hover { background: #f3f4f6; }
    .search-product-img, .search-product-img-placeholder {
      width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0;
    }
    .search-product-img-placeholder, .search-shop-logo-placeholder {
      background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af;
    }
    .search-shop-logo, .search-shop-logo-placeholder {
      width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
    }
    .search-item-info { flex: 1; min-width: 0; }
    .search-item-name {
      font-size: 13px; font-weight: 500; color: #1f2937;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .search-item-meta { font-size: 12px; color: #6b7280; margin-top: 1px; }
    .search-view-all {
      padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 500;
      color: #ff6b35; cursor: pointer; border-top: 1px solid #e5e7eb;
    }
    .search-view-all:hover { background: #fff7f3; }
    .search-no-results {
      padding: 20px 14px; text-align: center; font-size: 13px; color: #6b7280;
    }

    .header-actions { display: flex; gap: 8px; align-items: center; }
    .icon-btn {
      width: 40px; height: 40px; border: none; background: transparent;
      border-radius: 6px; cursor: pointer; font-size: 18px; transition: background 0.2s;
      position: relative; display: flex; align-items: center; justify-content: center; color: #6b7280;
    }
    .icon-btn:hover { background: #f9fafb; color: #1f2937; }
    .icon-btn .badge {
      position: absolute; top: -4px; right: -4px; background: #ff6b35;
      color: white; border-radius: 10px; padding: 2px 6px; font-size: 10px; font-weight: 600;
    }

    .user-btn {
      display: flex; align-items: center; gap: 6px; padding: 10px 16px;
      background: #ff6b35; color: white; border: none; border-radius: 6px;
      cursor: pointer; font-weight: 500; font-size: 14px; transition: background 0.2s;
    }
    .user-btn:hover { background: #e55a28; }

    /* Profile Dropdown */
    .profile-wrapper { position: relative; }
    .profile-btn {
      display: flex; align-items: center; gap: 8px; padding: 6px 12px;
      background: transparent; border: 1px solid #e5e7eb; border-radius: 8px;
      cursor: pointer; transition: background 0.2s;
    }
    .profile-btn:hover { background: #f3f4f6; }
    .profile-avatar, .dropdown-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #ff6b35;
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
    }
    .dropdown-avatar { width: 36px; height: 36px; font-size: 15px; }
    .profile-name {
      font-size: 14px; font-weight: 500; color: #1f2937;
      max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .profile-btn .pi-chevron-down { font-size: 10px; color: #6b7280; }
    .profile-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0; width: 260px;
      background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      border: 1px solid #e5e7eb; z-index: 1000; overflow: hidden;
    }
    .dropdown-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
    .dropdown-name { font-size: 14px; font-weight: 600; color: #1f2937; }
    .dropdown-email { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .dropdown-divider { height: 1px; background: #e5e7eb; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 11px 16px; background: none; border: none; font-size: 14px;
      color: #374151; cursor: pointer; transition: background 0.15s;
    }
    .dropdown-item:hover { background: #f3f4f6; }
    .dropdown-item i { font-size: 15px; color: #6b7280; }
    .logout-item { color: #dc2626; }
    .logout-item i { color: #dc2626; }
  `],
})
export class NavbarComponent implements OnInit {
  currentUser: any = null;
  showProfileDropdown = false;
  cartCount = 0;

  searchQuery = '';
  searchProducts: any[] = [];
  searchShops: any[] = [];
  showSearchDropdown = false;
  searchLoading = false;
  private searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private productService: ProductService,
    private elRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.cartService.refreshCartCount();
      } else {
        this.cartCount = 0;
      }
    });
    this.cartService.cartCount$.subscribe((count) => {
      this.cartCount = count;
      this.cdr.detectChanges();
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((query) => {
      if (query.length < 2) {
        this.searchProducts = [];
        this.searchShops = [];
        this.showSearchDropdown = false;
        return;
      }
      this.searchLoading = true;
      this.productService.search(query, 5).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.searchProducts = res.data.products;
            this.searchShops = res.data.shops;
            this.showSearchDropdown = true;
          }
          this.searchLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.searchLoading = false;
          this.cdr.detectChanges();
        },
      });
    });
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  goToProduct(id: string) {
    this.showSearchDropdown = false;
    this.searchQuery = '';
    this.router.navigate(['/product', id]);
  }

  goToShop(id: string) {
    this.showSearchDropdown = false;
    this.searchQuery = '';
    this.router.navigate(['/shop', id]);
  }

  goToSearchPage() {
    if (this.searchQuery.trim().length > 0) {
      this.showSearchDropdown = false;
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  getInitial(): string {
    if (this.currentUser?.fullName) {
      return this.currentUser.fullName.charAt(0).toUpperCase();
    }
    return this.currentUser?.email?.charAt(0).toUpperCase() || 'U';
  }

  getFirstName(): string {
    if (this.currentUser?.fullName) {
      return this.currentUser.fullName.split(' ')[0];
    }
    return this.currentUser?.email || 'User';
  }

  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showProfileDropdown = false;
    if (!this.elRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchDropdown = false;
    }
  }

  navigate(path: string) {
    this.showProfileDropdown = false;
    this.router.navigate([path]);
  }

  logout() {
    this.showProfileDropdown = false;
    this.authService.logout();
  }
}
