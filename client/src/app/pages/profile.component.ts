import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { AuthService } from '../services/auth.service';
import { AddressService } from '../services/address.service';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="profile-page">
      <div class="container">
        <div class="profile-layout">
          <!-- Sidebar -->
          <div class="profile-sidebar">
            <div class="avatar-section">
              <div class="avatar-circle">{{ getInitial() }}</div>
              <h3 class="user-name">{{ user?.fullName || 'User' }}</h3>
              <p class="user-email">{{ user?.email }}</p>
            </div>
            <nav class="sidebar-nav">
              <button [class.active]="activeTab === 'info'" (click)="activeTab = 'info'">
                <i class="pi pi-user"></i> My Information
              </button>
              <button [class.active]="activeTab === 'addresses'" (click)="activeTab = 'addresses'">
                <i class="pi pi-map-marker"></i> Addresses
              </button>
              <button [class.active]="activeTab === 'orders'" (click)="activeTab = 'orders'">
                <i class="pi pi-box"></i> My Orders
              </button>
              <button [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">
                <i class="pi pi-lock"></i> Security
              </button>
            </nav>
          </div>

          <!-- Content -->
          <div class="profile-content">
            <!-- My Information -->
            <div class="content-section" *ngIf="activeTab === 'info'">
              <div class="section-header">
                <h2><i class="pi pi-user"></i> My Information</h2>
              </div>
              <div class="info-card" *ngIf="!loading">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Full Name</label>
                    <p>{{ user?.fullName || '—' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Email Address</label>
                    <p>{{ user?.email || '—' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Account Type</label>
                    <p>{{ user?.userType | titlecase }}</p>
                  </div>
                  <div class="info-item">
                    <label>Email Verified</label>
                    <p>
                      <span class="status-badge" [class.verified]="user?.emailVerified" [class.unverified]="!user?.emailVerified">
                        <i [class]="user?.emailVerified ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                        {{ user?.emailVerified ? 'Verified' : 'Not Verified' }}
                      </span>
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Member Since</label>
                    <p>{{ user?.createdAt | date:'MMMM d, yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Last Login</label>
                    <p>{{ user?.lastLogin ? (user.lastLogin | date:'MMMM d, yyyy h:mm a') : 'N/A' }}</p>
                  </div>
                </div>
              </div>
              <div class="loading-state" *ngIf="loading">
                <i class="pi pi-spin pi-spinner"></i> Loading profile...
              </div>
            </div>

            <!-- Addresses -->
            <div class="content-section" *ngIf="activeTab === 'addresses'">
              <div class="section-header">
                <h2><i class="pi pi-map-marker"></i> My Addresses</h2>
              </div>
              <div class="loading-state" *ngIf="loadingAddresses">
                <i class="pi pi-spin pi-spinner"></i> Loading addresses...
              </div>
              <div *ngIf="!loadingAddresses">
                <div class="empty-state" *ngIf="addresses.length === 0">
                  <i class="pi pi-map-marker"></i>
                  <p>No addresses saved yet.</p>
                </div>
                <div class="address-grid">
                  <div class="address-card" *ngFor="let addr of addresses">
                    <div class="addr-header">
                      <span class="addr-label">{{ addr.label }}</span>
                      <span class="default-badge" *ngIf="addr.isDefault">Default</span>
                    </div>
                    <div class="addr-name">{{ addr.fullName }}</div>
                    <div class="addr-phone">{{ addr.phone }}</div>
                    <div class="addr-full">{{ addr.streetAddress }}, {{ addr.barangay }}, {{ addr.city }}, {{ addr.province }}, {{ addr.region }} {{ addr.postalCode }}</div>
                    <div class="addr-actions">
                      <button class="addr-delete-btn" (click)="deleteAddress(addr)" [disabled]="addr.isDefault" [title]="addr.isDefault ? 'Cannot delete default address' : 'Delete address'">
                        <i class="pi pi-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Orders -->
            <div class="content-section" *ngIf="activeTab === 'orders'">
              <div class="section-header">
                <h2><i class="pi pi-box"></i> My Orders</h2>
              </div>

              <!-- Status Tabs -->
              <div class="order-tabs">
                <button *ngFor="let tab of orderTabs" [class.active]="activeOrderTab === tab.key" (click)="activeOrderTab = tab.key">
                  {{ tab.label }}
                  <span class="tab-count" *ngIf="getOrderCountByStatus(tab.key) > 0">{{ getOrderCountByStatus(tab.key) }}</span>
                </button>
              </div>

              <div class="loading-state" *ngIf="loadingOrders">
                <i class="pi pi-spin pi-spinner"></i> Loading orders...
              </div>

              <div *ngIf="!loadingOrders">
                <div class="empty-state" *ngIf="filteredOrders.length === 0">
                  <i class="pi pi-inbox"></i>
                  <p>No {{ activeOrderTab === 'all' ? '' : activeOrderTab }} orders found.</p>
                </div>

                <div class="orders-list">
                  <div class="order-card" *ngFor="let order of filteredOrders">
                    <div class="order-top">
                      <div class="order-number">
                        <span class="on-label">Order</span>
                        <span class="on-value">{{ order.orderNumber }}</span>
                      </div>
                      <span class="order-status" [attr.data-status]="order.status">{{ order.status | titlecase }}</span>
                    </div>
                    <div class="order-items">
                      <div class="oi-header">
                        <span class="oi-h-product">Product</span>
                        <span class="oi-h-price">Price</span>
                        <span class="oi-h-qty">Qty</span>
                        <span class="oi-h-subtotal">Subtotal</span>
                      </div>
                      <div class="order-item" *ngFor="let item of order.items">
                        <div class="oi-img">
                          <img *ngIf="item.productImage?.url" [src]="item.productImage.url" />
                          <div *ngIf="!item.productImage?.url" class="oi-placeholder"><i class="pi pi-image"></i></div>
                        </div>
                        <div class="oi-details">
                          <div class="oi-name">{{ item.productName }}</div>
                          <div class="oi-shop" *ngIf="item.seller">{{ item.seller.shopName }}</div>
                        </div>
                        <div class="oi-unit-price">₱{{ item.price | number:'1.2-2' }}</div>
                        <div class="oi-qty">x{{ item.quantity }}</div>
                        <div class="oi-subtotal">₱{{ (item.price * item.quantity) | number:'1.2-2' }}</div>
                      </div>
                    </div>
                    <div class="order-footer">
                      <div class="order-date">{{ order.createdAt | date:'MMM d, yyyy h:mm a' }}</div>
                      <div class="order-tracking-info" *ngIf="order.trackingNumber">
                        <i class="pi pi-barcode"></i>
                        <span>Tracking: <strong>{{ order.trackingNumber }}</strong></span>
                      </div>
                      <div class="order-eta" *ngIf="order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled'">
                        <i class="pi pi-truck"></i>
                        <span>ETA: {{ order.estimatedDelivery | date:'MMM d, yyyy' }}</span>
                        <span class="eta-days">({{ getDaysUntil(order.estimatedDelivery) }})</span>
                      </div>
                      <div class="order-eta delivered" *ngIf="order.status === 'delivered'">
                        <i class="pi pi-check-circle"></i>
                        <span>Delivered</span>
                      </div>
                      <button class="track-btn" *ngIf="order.status === 'shipped' || order.status === 'processing' || order.status === 'confirmed'" (click)="trackOrder(order.id)">
                        <i class="pi pi-map-marker"></i> Track Order
                      </button>
                      <div class="order-total">Total: <strong>₱{{ order.total | number:'1.2-2' }}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security -->
            <div class="content-section" *ngIf="activeTab === 'security'">
              <div class="section-header">
                <h2><i class="pi pi-lock"></i> Security</h2>
              </div>
              <div class="security-card">
                <div class="security-item">
                  <div class="sec-info">
                    <h4>Change Password</h4>
                    <p>Update your password to keep your account secure.</p>
                  </div>
                  <button class="sec-btn" disabled>
                    <i class="pi pi-pencil"></i> Change Password
                  </button>
                </div>
                <div class="divider"></div>
                <div class="security-item">
                  <div class="sec-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account.</p>
                  </div>
                  <button class="sec-btn" disabled>
                    <i class="pi pi-shield"></i> Enable 2FA
                  </button>
                </div>
                <p class="coming-soon">These features are coming soon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .profile-page { min-height: calc(100vh - 120px); background: #f9fafb; padding: 32px 0; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

    .profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }

    /* Sidebar */
    .profile-sidebar {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;
      position: sticky; top: 24px;
    }
    .avatar-section { padding: 28px 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .avatar-circle {
      width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35, #ff9a76);
      color: white; font-size: 28px; font-weight: 700; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 12px;
    }
    .user-name { font-size: 17px; font-weight: 700; color: #1f2937; margin: 0; }
    .user-email { font-size: 13px; color: #6b7280; margin: 4px 0 10px; }
    .user-badge {
      display: inline-block; font-size: 11px; padding: 3px 10px; border-radius: 20px;
      background: #fef3c7; color: #92400e; font-weight: 600;
    }

    .sidebar-nav { padding: 8px 0; }
    .sidebar-nav button {
      width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 20px;
      background: none; border: none; font-size: 14px; color: #4b5563;
      cursor: pointer; transition: all 0.15s; text-align: left;
    }
    .sidebar-nav button:hover { background: #f9fafb; color: #1f2937; }
    .sidebar-nav button.active {
      background: #fff7f3; color: #ff6b35; font-weight: 600;
      border-right: 3px solid #ff6b35;
    }
    .sidebar-nav button i { font-size: 15px; width: 18px; text-align: center; }

    /* Content */
    .profile-content { min-height: 500px; }

    .content-section {}
    .section-header {
      margin-bottom: 20px;
    }
    .section-header h2 {
      font-size: 20px; font-weight: 700; color: #1f2937; margin: 0;
      display: flex; align-items: center; gap: 10px;
    }
    .section-header h2 i { color: #ff6b35; font-size: 20px; }

    .loading-state {
      text-align: center; padding: 40px; color: #6b7280; font-size: 14px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .loading-state i { font-size: 18px; color: #ff6b35; }

    .empty-state { text-align: center; padding: 50px 20px; color: #9ca3af; }
    .empty-state i { font-size: 42px; display: block; margin-bottom: 12px; }
    .empty-state p { font-size: 14px; margin: 0; }

    /* Info Card */
    .info-card {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item label {
      display: block; font-size: 12px; font-weight: 600; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
    }
    .info-item p { font-size: 15px; color: #1f2937; margin: 0; font-weight: 500; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px; font-size: 13px;
      padding: 3px 10px; border-radius: 20px; font-weight: 500;
    }
    .status-badge.verified { background: #dcfce7; color: #166534; }
    .status-badge.unverified { background: #fee2e2; color: #991b1b; }
    .status-badge i { font-size: 12px; }

    /* Address Grid */
    .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .address-card {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 18px;
    }
    .addr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .addr-label {
      font-size: 12px; padding: 2px 8px; border-radius: 4px;
      background: #f3f4f6; color: #6b7280; font-weight: 500;
    }
    .default-badge {
      font-size: 11px; padding: 2px 8px; border-radius: 4px;
      background: #fef3c7; color: #92400e; font-weight: 600;
    }
    .addr-name { font-size: 14px; font-weight: 600; color: #1f2937; }
    .addr-phone { font-size: 13px; color: #6b7280; margin: 2px 0 8px; }
    .addr-full { font-size: 13px; color: #4b5563; line-height: 1.5; }
    .addr-actions { margin-top: 12px; display: flex; gap: 8px; }
    .addr-delete-btn {
      padding: 5px 12px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626;
      border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;
      transition: all 0.2s;
    }
    .addr-delete-btn:hover:not(:disabled) { background: #fee2e2; border-color: #f87171; }
    .addr-delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Order Tabs */
    .order-tabs {
      display: flex; gap: 4px; margin-bottom: 20px; background: white;
      border-radius: 10px; padding: 4px; border: 1px solid #e5e7eb; flex-wrap: wrap;
    }
    .order-tabs button {
      padding: 9px 16px; border: none; background: none; font-size: 13px;
      color: #6b7280; border-radius: 7px; cursor: pointer; font-weight: 500;
      transition: all 0.15s; display: flex; align-items: center; gap: 6px;
    }
    .order-tabs button:hover { background: #f9fafb; }
    .order-tabs button.active { background: #ff6b35; color: white; }
    .tab-count {
      font-size: 11px; background: rgba(0,0,0,0.1); padding: 1px 7px;
      border-radius: 10px; min-width: 18px; text-align: center;
    }
    .order-tabs button.active .tab-count { background: rgba(255,255,255,0.25); }

    /* Order Cards */
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;
    }
    .order-top {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-bottom: 1px solid #f3f4f6;
    }
    .order-number { display: flex; align-items: center; gap: 8px; }
    .on-label { font-size: 13px; color: #6b7280; }
    .on-value { font-size: 14px; font-weight: 700; color: #1f2937; font-family: monospace; }
    .order-status {
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;
    }
    .order-status[data-status="pending"] { background: #fef3c7; color: #92400e; }
    .order-status[data-status="confirmed"] { background: #dbeafe; color: #1e40af; }
    .order-status[data-status="processing"] { background: #e0e7ff; color: #3730a3; }
    .order-status[data-status="shipped"] { background: #fce7f3; color: #9d174d; }
    .order-status[data-status="delivered"] { background: #dcfce7; color: #166534; }
    .order-status[data-status="cancelled"] { background: #fee2e2; color: #991b1b; }

    .order-items { padding: 12px 20px; }
    .oi-header {
      display: flex; align-items: center; gap: 12px; padding: 0 0 8px;
      border-bottom: 1px solid #e5e7eb; margin-bottom: 4px;
      font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .oi-h-product { flex: 1; padding-left: 60px; }
    .oi-h-price { width: 90px; text-align: right; }
    .oi-h-qty { width: 50px; text-align: center; }
    .oi-h-subtotal { width: 100px; text-align: right; }
    .order-item {
      display: flex; align-items: center; gap: 12px; padding: 8px 0;
      border-bottom: 1px solid #f9fafb;
    }
    .order-item:last-child { border-bottom: none; }
    .oi-img { width: 48px; height: 48px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
    .oi-img img { width: 100%; height: 100%; object-fit: cover; }
    .oi-placeholder {
      width: 100%; height: 100%; background: #f3f4f6;
      display: flex; align-items: center; justify-content: center; color: #d1d5db;
    }
    .oi-details { flex: 1; min-width: 0; }
    .oi-name {
      font-size: 14px; font-weight: 500; color: #1f2937;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .oi-shop { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .oi-unit-price { width: 90px; font-size: 13px; color: #6b7280; text-align: right; flex-shrink: 0; }
    .oi-qty { font-size: 13px; color: #6b7280; width: 50px; text-align: center; flex-shrink: 0; }
    .oi-subtotal { width: 100px; font-size: 14px; font-weight: 600; color: #ff6b35; text-align: right; flex-shrink: 0; }

    .order-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 20px; background: #f9fafb; border-top: 1px solid #f3f4f6;
      flex-wrap: wrap; gap: 8px;
    }
    .order-date { font-size: 13px; color: #6b7280; }
    .order-total { font-size: 14px; color: #4b5563; }
    .order-total strong { color: #1f2937; font-size: 16px; }
    .track-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #ff6b35; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .track-btn:hover { background: #e55a28; }

    .order-eta {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #d97706;
      background: #fffbeb; padding: 4px 12px; border-radius: 20px;
      border: 1px solid #fde68a;
    }
    .order-eta i { font-size: 14px; }
    .order-eta .eta-days { font-weight: 400; color: #92400e; font-size: 12px; }
    .order-eta.delivered {
      color: #059669; background: #ecfdf5; border-color: #a7f3d0;
    }

    .order-tracking-info {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #7c3aed;
      background: #f5f3ff; padding: 4px 12px; border-radius: 20px;
      border: 1px solid #ddd6fe;
    }
    .order-tracking-info i { font-size: 14px; }
    .order-tracking-info strong { font-family: monospace; letter-spacing: 0.5px; color: #5b21b6; }

    /* Security */
    .security-card {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px;
    }
    .security-item { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .sec-info h4 { font-size: 15px; font-weight: 600; color: #1f2937; margin: 0 0 4px; }
    .sec-info p { font-size: 13px; color: #6b7280; margin: 0; }
    .sec-btn {
      display: flex; align-items: center; gap: 6px; padding: 10px 18px;
      border: 1px solid #d1d5db; background: white; border-radius: 8px;
      font-size: 13px; color: #374151; cursor: pointer; font-weight: 500;
      white-space: nowrap; transition: all 0.15s;
    }
    .sec-btn:hover:not(:disabled) { border-color: #ff6b35; color: #ff6b35; }
    .sec-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .divider { height: 1px; background: #e5e7eb; margin: 18px 0; }
    .coming-soon {
      text-align: center; font-size: 13px; color: #9ca3af;
      margin: 20px 0 0; font-style: italic;
    }

    @media (max-width: 768px) {
      .profile-layout { grid-template-columns: 1fr; }
      .profile-sidebar { position: static; }
      .sidebar-nav { display: flex; overflow-x: auto; padding: 4px; }
      .sidebar-nav button {
        white-space: nowrap; border-right: none !important;
        border-radius: 6px; padding: 10px 16px; font-size: 13px;
      }
      .sidebar-nav button.active { border-bottom: 2px solid #ff6b35; }
      .info-grid { grid-template-columns: 1fr; }
      .address-grid { grid-template-columns: 1fr; }
      .security-item { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class ProfileComponent implements OnInit {
  user: any = null;
  addresses: any[] = [];
  orders: any[] = [];
  activeTab = 'info';
  activeOrderTab = 'all';
  loading = true;
  loadingAddresses = true;
  loadingOrders = true;

  orderTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private addressService: AddressService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab && ['info', 'addresses', 'orders', 'security'].includes(tab)) {
      this.activeTab = tab;
    }
    this.loadProfile();
    this.loadAddresses();
    this.loadOrders();
  }

  loadProfile() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.user = res.data;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadAddresses() {
    this.loadingAddresses = true;
    this.addressService.getAddresses().subscribe({
      next: (res: any) => {
        this.loadingAddresses = false;
        if (res.success) {
          this.addresses = res.data;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAddresses = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteAddress(addr: any) {
    if (addr.isDefault) return;
    if (!confirm('Are you sure you want to remove this address?')) return;
    this.addressService.deleteAddress(addr.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.addresses = this.addresses.filter((a: any) => a.id !== addr.id);
          this.cdr.detectChanges();
        }
      },
    });
  }

  loadOrders() {
    this.loadingOrders = true;
    this.orderService.getOrders().subscribe({
      next: (res: any) => {
        this.loadingOrders = false;
        if (res.success) {
          this.orders = res.data;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredOrders(): any[] {
    if (this.activeOrderTab === 'all') return this.orders;
    return this.orders.filter((o: any) => o.status === this.activeOrderTab);
  }

  getOrderCountByStatus(status: string): number {
    if (status === 'all') return this.orders.length;
    return this.orders.filter((o: any) => o.status === status).length;
  }

  getDaysUntil(dateStr: string): string {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'any time now';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
  }

  getInitial(): string {
    return (this.user?.fullName || this.user?.email || 'U').charAt(0).toUpperCase();
  }

  trackOrder(orderId: string) {
    this.router.navigate(['/track', orderId]);
  }
}
