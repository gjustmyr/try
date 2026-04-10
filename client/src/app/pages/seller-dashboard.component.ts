import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SellerService } from '../services/seller.service';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./seller-dashboard.component.css'],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="pi pi-shopping-bag"></i>
          <span>{{ shopName }}</span>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item active">
            <i class="pi pi-home"></i>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/products')">
            <i class="pi pi-box"></i>
            <span>Products</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/orders')">
            <i class="pi pi-shopping-cart"></i>
            <span>Orders</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/customers')">
            <i class="pi pi-users"></i>
            <span>Customers</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/reviews')">
            <i class="pi pi-star"></i>
            <span>Reviews</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/settings')">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="top-bar-left">
            <h1>Dashboard</h1>
            <p class="breadcrumb">Home / Dashboard</p>
          </div>
          <div class="top-bar-right">
            <button class="icon-btn">
              <i class="pi pi-bell"></i>
              <span class="badge">3</span>
            </button>
            <div class="user-profile" (click)="showProfileDropdown = !showProfileDropdown">
              <div class="avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="user-info">
                <span class="user-name">{{ shopName }}</span>
                <span class="user-role">Seller</span>
              </div>
              <i class="pi pi-angle-down dropdown-arrow" [class.open]="showProfileDropdown"></i>

              @if (showProfileDropdown) {
                <div class="profile-dropdown" (click)="$event.stopPropagation()">
                  <button class="dropdown-item" (click)="showProfileDropdown = false; showProfileModal = true; loadProfile()">
                    <i class="pi pi-user-edit"></i> Update Profile
                  </button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item logout" (click)="logout()">
                    <i class="pi pi-sign-out"></i> Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Dashboard Content -->
        <div class="dashboard-content">
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon blue">
                <i class="pi pi-dollar"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Total Revenue</span>
                <h3 class="stat-value">₱{{ stats.totalRevenue | number:'1.2-2' }}</h3>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon green">
                <i class="pi pi-shopping-cart"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Total Orders</span>
                <h3 class="stat-value">{{ stats.totalOrders }}</h3>
                @if (stats.pendingOrders > 0) {
                  <span class="stat-change warning"><i class="pi pi-clock"></i> {{ stats.pendingOrders }} pending</span>
                }
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon orange">
                <i class="pi pi-box"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Products</span>
                <h3 class="stat-value">{{ stats.productCount }}</h3>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon purple">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label">Customers</span>
                <h3 class="stat-value">{{ stats.uniqueCustomers }}</h3>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="content-grid">
            <!-- Recent Orders -->
            <div class="card full-width">
              <div class="card-header">
                <h2>Recent Orders</h2>
                <a class="view-all" (click)="navigate('/seller/orders')">View All</a>
              </div>
              <div class="card-body">
                @if (stats.recentOrders.length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-shopping-cart"></i>
                    <p>No orders yet</p>
                    <span>Orders will appear here once customers start purchasing</span>
                  </div>
                } @else {
                  <table class="recent-orders-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of stats.recentOrders; track order.id) {
                        <tr (click)="navigate('/seller/orders')" style="cursor:pointer">
                          <td class="order-num">{{ order.orderNumber }}</td>
                          <td>{{ order.user?.fullName || 'Customer' }}</td>
                          <td>{{ order.items?.length }}</td>
                          <td class="order-total">₱{{ getOrderSellerTotal(order) | number:'1.2-2' }}</td>
                          <td><span class="status-badge" [attr.data-status]="order.status">{{ order.status | titlecase }}</span></td>
                          <td class="order-date">{{ order.createdAt | date:'MMM d' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </div>
          </div>

          <!-- Top Products -->
          <div class="content-grid">
            <div class="card full-width">
              <div class="card-header">
                <h2>Top Products</h2>
                <a class="view-all" (click)="navigate('/seller/products')">View All</a>
              </div>
              <div class="card-body">
                @if (stats.topProducts.length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-box"></i>
                    <p>No products yet</p>
                    <span>Add products to see top performers</span>
                  </div>
                } @else {
                  <div class="top-products-list">
                    @for (product of stats.topProducts; track product.id; let i = $index) {
                      <div class="top-product-row">
                        <span class="rank">#{{ i + 1 }}</span>
                        <div class="tp-img">
                          @if (product.images?.length > 0) {
                            <img [src]="product.images[0].url" alt="" />
                          } @else {
                            <div class="tp-placeholder"><i class="pi pi-image"></i></div>
                          }
                        </div>
                        <div class="tp-info">
                          <span class="tp-name">{{ product.name }}</span>
                          <span class="tp-price">₱{{ product.price | number:'1.2-2' }}</span>
                        </div>
                        <div class="tp-stats">
                          <span class="tp-sales">{{ product.sales || 0 }} sold</span>
                          <span class="tp-stock" [class.low]="product.quantity < 10">{{ product.quantity }} in stock</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Update Profile Modal -->
    @if (showProfileModal) {
      <div class="modal-overlay" (click)="showProfileModal = false">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><i class="pi pi-user-edit"></i> Update Shop Profile</h2>
            <button class="close-btn" (click)="showProfileModal = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          @if (isLoadingProfile) {
            <div class="modal-body">
              <div class="profile-loading">
                <i class="pi pi-spin pi-spinner"></i>
                <p>Loading profile...</p>
              </div>
            </div>
          } @else {
            <div class="modal-body">
              <div class="form-group">
                <label>Shop Name</label>
                <input type="text" [(ngModel)]="profileForm.shopName" placeholder="Your shop name" />
              </div>
              <div class="form-group">
                <label>Shop Description</label>
                <textarea [(ngModel)]="profileForm.shopDescription" placeholder="Tell customers about your shop..." rows="4"></textarea>
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="text" [(ngModel)]="profileForm.phone" placeholder="Contact number" />
              </div>
              <div class="form-group">
                <label>Business Address</label>
                <textarea [(ngModel)]="profileForm.businessAddress" placeholder="Your business address" rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" (click)="showProfileModal = false">Cancel</button>
              <button class="save-btn" (click)="updateProfile()" [disabled]="isSavingProfile">
                @if (isSavingProfile) {
                  <i class="pi pi-spin pi-spinner"></i> Saving...
                } @else {
                  <i class="pi pi-check"></i> Save Changes
                }
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class SellerDashboardComponent implements OnInit {
  shopName = '';
  sellerId = '';
  userId = '';
  showProfileModal = false;
  showProfileDropdown = false;
  isLoadingProfile = false;
  isSavingProfile = false;

  stats = {
    totalRevenue: 0,
    totalOrders: 0,
    productCount: 0,
    uniqueCustomers: 0,
    pendingOrders: 0,
    recentOrders: [] as any[],
    topProducts: [] as any[],
  };

  profileForm = {
    shopName: '',
    shopDescription: '',
    phone: '',
    businessAddress: '',
  };

  constructor(
    private authService: AuthService,
    private sellerService: SellerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.seller) {
      this.shopName = user.seller.shopName;
      this.sellerId = user.seller.id;
      this.userId = user.id;
      this.loadDashboardStats();
    }
  }

  loadDashboardStats() {
    this.sellerService.getDashboardStats().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stats = { ...this.stats, ...res.data };
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  getOrderSellerTotal(order: any): number {
    return (order.items || []).reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);
  }

  loadProfile() {
    this.isLoadingProfile = true;
    this.sellerService.getSellerProfile(this.userId).subscribe({
      next: (response) => {
        this.isLoadingProfile = false;
        if (response.success && response.data) {
          this.profileForm = {
            shopName: response.data.shopName || '',
            shopDescription: response.data.shopDescription || '',
            phone: response.data.phone || '',
            businessAddress: response.data.businessAddress || '',
          };
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      },
    });
  }

  updateProfile() {
    this.isSavingProfile = true;
    this.sellerService.updateSellerProfile(this.sellerId, this.profileForm).subscribe({
      next: (response) => {
        this.isSavingProfile = false;
        if (response.success) {
          this.shopName = this.profileForm.shopName;
          // Update localStorage and auth state
          const stored = localStorage.getItem('currentUser');
          if (stored) {
            const user = JSON.parse(stored);
            if (user.seller) {
              user.seller.shopName = this.profileForm.shopName;
            }
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.authService.updateCurrentUser(user);
          }
          this.showProfileModal = false;
          alert('Profile updated successfully!');
        } else {
          alert(response.message || 'Failed to update profile.');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingProfile = false;
        alert(error.error?.message || 'Failed to update profile.');
        this.cdr.detectChanges();
      },
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
  }
}
