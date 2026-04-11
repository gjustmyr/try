import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SellerService } from '../services/seller.service';

@Component({
  selector: 'app-seller-customers',
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
          <a class="nav-item active">
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
        <header class="top-bar">
          <div class="top-bar-left">
            <h1>Customers</h1>
            <p class="breadcrumb">Home / Customers</p>
          </div>
          <div class="top-bar-right">
            <span class="customer-count">{{ filteredCustomers.length }} customers</span>
          </div>
        </header>

        <div class="products-content">
          <!-- Search -->
          <div class="filters-bar">
            <div class="search-box">
              <i class="pi pi-search"></i>
              <input
                type="text"
                placeholder="Search customers..."
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
              />
            </div>
            <select class="filter-select" [(ngModel)]="sortBy" (change)="onSort()">
              <option value="spent">Top Spenders</option>
              <option value="orders">Most Orders</option>
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          @if (isLoading) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading customers...</p>
            </div>
          } @else if (filteredCustomers.length === 0) {
            <div class="empty-state">
              <i class="pi pi-users"></i>
              <h3>No customers yet</h3>
              <p>Customers will appear here once they purchase your products</p>
            </div>
          } @else {
            <div class="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Last Order</th>
                    <th>Member Since</th>
                  </tr>
                </thead>
                <tbody>
                  @for (customer of filteredCustomers; track customer.id) {
                    <tr>
                      <td>
                        <div class="product-cell">
                          <div class="customer-avatar">
                            <i class="pi pi-user"></i>
                          </div>
                          <div class="product-info">
                            <span class="product-name">{{ customer.fullName || 'Customer' }}</span>
                          </div>
                        </div>
                      </td>
                      <td>{{ customer.email }}</td>
                      <td>
                        <span class="order-count-badge">{{ customer.orderCount }}</span>
                      </td>
                      <td>
                        <span class="price">₱{{ customer.totalSpent | number: '1.2-2' }}</span>
                      </td>
                      <td>{{ customer.lastOrderDate | date: 'MMM d, yyyy' }}</td>
                      <td>{{ customer.memberSince | date: 'MMM d, yyyy' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class SellerCustomersComponent implements OnInit {
  shopName = '';
  customers: any[] = [];
  filteredCustomers: any[] = [];
  isLoading = false;
  searchQuery = '';
  sortBy = 'spent';

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
      this.loadCustomers();
    }
  }

  loadCustomers() {
    this.isLoading = true;
    this.sellerService.getSellerCustomers().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.customers = res.data || [];
          this.onSearch();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.customers = [];
        this.filteredCustomers = [];
        this.cdr.detectChanges();
      },
    });
  }

  onSearch() {
    let list = this.customers;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.fullName?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q),
      );
    }
    this.filteredCustomers = list;
    this.onSort();
  }

  onSort() {
    switch (this.sortBy) {
      case 'spent':
        this.filteredCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case 'orders':
        this.filteredCustomers.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case 'recent':
        this.filteredCustomers.sort(
          (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime(),
        );
        break;
      case 'name':
        this.filteredCustomers.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
        break;
    }
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
  }
}
