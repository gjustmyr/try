import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SellerService } from '../services/seller.service';

@Component({
  selector: 'app-seller-reviews',
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
          <a class="nav-item" (click)="navigate('/seller/dashboard')">
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
          <a class="nav-item active">
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
        <header class="top-bar">
          <div class="top-bar-left">
            <h1>Reviews</h1>
            <p class="breadcrumb">Home / Reviews</p>
          </div>
        </header>

        <div class="dashboard-content">
          @if (isLoading) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading reviews...</p>
            </div>
          } @else {
            <!-- Summary -->
            @if (reviewData.total > 0) {
              <div class="reviews-summary">
                <div class="reviews-average">
                  <div class="big-number">{{ reviewData.avgRating }}</div>
                  <div class="stars">
                    @for (s of [1,2,3,4,5]; track s) {
                      <i class="pi" [class.pi-star-fill]="s <= reviewData.avgRating" [class.pi-star]="s > reviewData.avgRating"></i>
                    }
                  </div>
                  <div class="total">{{ reviewData.total }} reviews</div>
                </div>
                <div class="rating-bars">
                  @for (d of reviewData.distribution; track d.star) {
                    <div class="rating-bar">
                      <span class="label">{{ d.star }}</span>
                      <i class="pi pi-star-fill" style="color: #f59e0b; font-size: 12px;"></i>
                      <div class="bar">
                        <div class="fill" [style.width.%]="reviewData.total > 0 ? (d.count / reviewData.total * 100) : 0"></div>
                      </div>
                      <span class="count">{{ d.count }}</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Filter -->
            <div class="filters-bar" style="margin-bottom: 16px;">
              <div class="search-box">
                <i class="pi pi-search"></i>
                <input type="text" placeholder="Search reviews..." [(ngModel)]="searchQuery" (input)="onFilter()" />
              </div>
              <select class="filter-select" [(ngModel)]="ratingFilter" (change)="onFilter()">
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            @if (filteredReviews.length === 0 && reviewData.total === 0) {
              <div class="empty-state">
                <i class="pi pi-star"></i>
                <h3>No reviews yet</h3>
                <p>Reviews will appear here when customers review your products</p>
              </div>
            } @else if (filteredReviews.length === 0) {
              <div class="empty-state">
                <i class="pi pi-filter"></i>
                <h3>No matching reviews</h3>
                <p>Try adjusting your search or filter</p>
              </div>
            } @else {
              @for (review of filteredReviews; track review.id) {
                <div class="review-card">
                  <div class="review-header">
                    <div class="review-customer">
                      <div class="customer-avatar"><i class="pi pi-user"></i></div>
                      <div>
                        <div class="name">{{ review.user?.fullName || 'Customer' }}</div>
                        <div class="date">{{ review.createdAt | date:'MMM d, yyyy' }}</div>
                      </div>
                    </div>
                    <div class="review-stars">
                      @for (s of [1,2,3,4,5]; track s) {
                        <i class="pi" [class.pi-star-fill]="s <= review.rating" [class.pi-star]="s > review.rating" [class.empty]="s > review.rating"></i>
                      }
                    </div>
                  </div>
                  <div class="review-product">
                    Product: <strong>{{ review.product?.name || 'Unknown' }}</strong>
                  </div>
                  @if (review.comment) {
                    <div class="review-comment">{{ review.comment }}</div>
                  }
                </div>
              }
            }
          }
        </div>
      </main>
    </div>
  `,
})
export class SellerReviewsComponent implements OnInit {
  shopName = '';
  isLoading = false;
  searchQuery = '';
  ratingFilter = '';

  reviewData: any = {
    reviews: [],
    avgRating: 0,
    total: 0,
    distribution: [],
  };
  filteredReviews: any[] = [];

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
      this.loadReviews();
    }
  }

  loadReviews() {
    this.isLoading = true;
    this.sellerService.getSellerReviews().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.reviewData = res.data;
          this.filteredReviews = this.reviewData.reviews || [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onFilter() {
    let list = this.reviewData.reviews || [];
    if (this.ratingFilter) {
      const r = parseInt(this.ratingFilter);
      list = list.filter((rev: any) => rev.rating === r);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (rev: any) =>
          rev.user?.fullName?.toLowerCase().includes(q) ||
          rev.product?.name?.toLowerCase().includes(q) ||
          rev.comment?.toLowerCase().includes(q),
      );
    }
    this.filteredReviews = list;
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
  }
}
