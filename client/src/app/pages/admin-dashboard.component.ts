import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./seller-dashboard.component.css'],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="pi pi-shield"></i>
          <span>Admin Panel</span>
        </div>
        <nav class="sidebar-nav">
          <a
            class="nav-item"
            [class.active]="activeTab === 'dashboard'"
            (click)="activeTab = 'dashboard'"
          >
            <i class="pi pi-home"></i><span>Dashboard</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'sellers'"
            (click)="activeTab = 'sellers'; loadSellers()"
          >
            <i class="pi pi-shop"></i><span>Sellers</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'hubs'"
            (click)="activeTab = 'hubs'; loadHubs()"
          >
            <i class="pi pi-building"></i><span>Delivery Hubs</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'drivers'"
            (click)="activeTab = 'drivers'; loadDrivers()"
          >
            <i class="pi pi-car"></i><span>Drivers</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'deliveries'"
            (click)="activeTab = 'deliveries'; loadDeliveries()"
          >
            <i class="pi pi-truck"></i><span>Deliveries</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'coupons'"
            (click)="activeTab = 'coupons'; loadCoupons()"
          >
            <i class="pi pi-ticket"></i><span>Coupons & Vouchers</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'tax'"
            (click)="activeTab = 'tax'; loadTaxConfigs()"
          >
            <i class="pi pi-percentage"></i><span>Tax Settings</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i><span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <main class="main-content">
        <!-- ============ DASHBOARD TAB ============ -->
        <div *ngIf="activeTab === 'dashboard'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Dashboard</h1>
              <p class="breadcrumb">Admin / Dashboard</p>
            </div>
          </header>
          <div class="dash-content">
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-icon sellers"><i class="pi pi-shop"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ stats.totalSellers }}</span
                  ><span class="stat-label">Active Sellers</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon pending"><i class="pi pi-clock"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ stats.pendingSellers }}</span
                  ><span class="stat-label">Pending Sellers</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon orders"><i class="pi pi-shopping-cart"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ stats.totalOrders }}</span
                  ><span class="stat-label">Total Orders</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon drivers"><i class="pi pi-car"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ stats.totalDrivers }}</span
                  ><span class="stat-label">Active Drivers</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon deliveries"><i class="pi pi-truck"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ stats.activeDeliveries }}</span
                  ><span class="stat-label">Active Deliveries</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon hubs"><i class="pi pi-building"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ stats.totalHubs }}</span
                  ><span class="stat-label">Delivery Hubs</span>
                </div>
              </div>
            </div>
            <div class="recent-section" *ngIf="recentOrders.length > 0">
              <h3>Recent Orders</h3>
              <div class="recent-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Driver</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let o of recentOrders">
                      <td class="mono">{{ o.orderNumber }}</td>
                      <td>{{ o.user?.fullName || o.user?.email }}</td>
                      <td>
                        <span class="status-chip" [attr.data-status]="o.status">{{
                          o.status | titlecase
                        }}</span>
                      </td>
                      <td>{{ o.delivery?.driver?.fullName || '—' }}</td>
                      <td class="date-cell">{{ o.createdAt | date: 'MMM d, h:mm a' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ SELLERS TAB ============ -->
        <div *ngIf="activeTab === 'sellers'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Seller Management</h1>
              <p class="breadcrumb">Admin / Sellers</p>
            </div>
          </header>
          <div class="tab-content">
            <div class="filter-bar">
              <button
                *ngFor="let f of sellerFilters"
                [class.active]="sellerFilter === f.key"
                (click)="sellerFilter = f.key"
              >
                {{ f.label }}
                <span class="badge" *ngIf="getSellerCount(f.key)">{{ getSellerCount(f.key) }}</span>
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Store Name</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of filteredSellers">
                    <td class="bold">{{ s.shopName }}</td>
                    <td>{{ s.fullName }}</td>
                    <td>{{ s.user?.email }}</td>
                    <td>
                      <span class="status-chip" [attr.data-status]="s.approvalStatus">{{
                        s.approvalStatus | titlecase
                      }}</span>
                    </td>
                    <td class="date-cell">{{ s.createdAt | date: 'MMM d, yyyy' }}</td>
                    <td class="actions-cell">
                      <button
                        class="act-btn approve"
                        *ngIf="s.approvalStatus === 'pending'"
                        (click)="approveSeller(s)"
                      >
                        <i class="pi pi-check"></i>
                      </button>
                      <button
                        class="act-btn reject"
                        *ngIf="s.approvalStatus === 'pending'"
                        (click)="openRejectModal(s)"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                      <button
                        class="act-btn toggle"
                        (click)="toggleSeller(s)"
                        [title]="s.user?.isActive ? 'Deactivate' : 'Activate'"
                      >
                        <i [class]="s.user?.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="empty-state" *ngIf="filteredSellers.length === 0">
                <i class="pi pi-inbox"></i>
                <p>No sellers found</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ HUBS TAB ============ -->
        <div *ngIf="activeTab === 'hubs'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Delivery Hubs</h1>
              <p class="breadcrumb">Admin / Hubs</p>
            </div>
            <div class="top-bar-right">
              <button class="primary-btn" (click)="showHubModal = true; resetHubForm()">
                <i class="pi pi-plus"></i> Add Hub
              </button>
            </div>
          </header>
          <div class="tab-content">
            <div class="cards-grid">
              <div class="hub-card" *ngFor="let hub of hubs">
                <div class="hub-header">
                  <h4>{{ hub.name }}</h4>
                  <span class="status-dot" [class.active]="hub.isActive"></span>
                </div>
                <p class="hub-address">
                  <i class="pi pi-map-marker"></i> {{ hub.address }}, {{ hub.city }},
                  {{ hub.province }}
                </p>
                <p class="hub-meta"><i class="pi pi-phone"></i> {{ hub.phone || 'N/A' }}</p>
                <p class="hub-meta">
                  <i class="pi pi-users"></i> {{ hub.drivers?.length || 0 }} driver(s)
                </p>
                <p class="hub-meta">
                  <i class="pi pi-map"></i> {{ hub.latitude?.toFixed(4) }},
                  {{ hub.longitude?.toFixed(4) }}
                </p>
                <div class="hub-actions">
                  <button class="act-btn edit" (click)="editHub(hub)">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="act-btn reject" (click)="deleteHub(hub)">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="empty-state" *ngIf="hubs.length === 0">
              <i class="pi pi-building"></i>
              <p>No hubs yet</p>
            </div>
          </div>
        </div>

        <!-- ============ DRIVERS TAB ============ -->
        <div *ngIf="activeTab === 'drivers'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Drivers</h1>
              <p class="breadcrumb">Admin / Drivers</p>
            </div>
            <div class="top-bar-right">
              <button class="primary-btn" (click)="showDriverModal = true; resetDriverForm()">
                <i class="pi pi-plus"></i> Add Driver
              </button>
            </div>
          </header>
          <div class="tab-content">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Vehicle</th>
                    <th>Plate</th>
                    <th>Hub</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of drivers">
                    <td class="bold">{{ d.fullName }}</td>
                    <td>{{ d.user?.email }}</td>
                    <td>{{ d.phone }}</td>
                    <td>{{ d.vehicleType | titlecase }}</td>
                    <td class="mono">{{ d.plateNumber }}</td>
                    <td>{{ d.hub?.name || '—' }}</td>
                    <td>
                      <span
                        class="status-dot"
                        [class.active]="d.isAvailable"
                        [title]="d.isAvailable ? 'Available' : 'Busy'"
                      ></span>
                    </td>
                    <td class="actions-cell">
                      <button class="act-btn edit" (click)="editDriver(d)">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button class="act-btn reject" (click)="deleteDriver(d)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="empty-state" *ngIf="drivers.length === 0">
                <i class="pi pi-car"></i>
                <p>No drivers yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ DELIVERIES TAB ============ -->
        <div *ngIf="activeTab === 'deliveries'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Deliveries</h1>
              <p class="breadcrumb">Admin / Deliveries</p>
            </div>
            <div class="top-bar-right">
              <button class="primary-btn" (click)="showAssignModal = true; resetAssignForm()">
                <i class="pi pi-plus"></i> Receive Parcel
              </button>
            </div>
          </header>
          <div class="tab-content">
            <div class="filter-bar">
              <button
                *ngFor="let f of deliveryFilters"
                [class.active]="deliveryFilter === f"
                (click)="deliveryFilter = f; loadDeliveries()"
              >
                {{ f | titlecase }}
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Driver</th>
                    <th>Hub</th>
                    <th>Status</th>
                    <th>ETA</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of deliveries">
                    <td class="mono">{{ d.trackingNumber }}</td>
                    <td class="mono">{{ d.order?.orderNumber }}</td>
                    <td>{{ d.order?.user?.fullName || '—' }}</td>
                    <td>{{ d.driver?.fullName }}</td>
                    <td>{{ d.hub?.name }}</td>
                    <td>
                      <span class="status-chip" [attr.data-status]="d.status">{{
                        formatDeliveryStatus(d.status)
                      }}</span>
                    </td>
                    <td class="date-cell">
                      {{
                        d.estimatedDelivery ? (d.estimatedDelivery | date: 'MMM d, h:mm a') : '—'
                      }}
                    </td>
                    <td>{{ d.distanceKm ? (d.distanceKm | number: '1.1-1') + ' km' : '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="empty-state" *ngIf="deliveries.length === 0">
                <i class="pi pi-truck"></i>
                <p>No deliveries found</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ COUPONS TAB ============ -->
        <div *ngIf="activeTab === 'coupons'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Coupons & Vouchers</h1>
              <p class="breadcrumb">Admin / Coupons</p>
            </div>
            <div class="top-bar-right">
              <button class="primary-btn" (click)="openCouponModal()">
                <i class="pi pi-plus"></i> Create Coupon
              </button>
            </div>
          </header>
          <div class="tab-content">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min. Order</th>
                    <th>Usage</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let coupon of coupons">
                    <td class="mono bold">{{ coupon.code }}</td>
                    <td>
                      <span class="type-badge" [attr.data-type]="coupon.discountType">
                        {{ formatCouponType(coupon.discountType) }}
                      </span>
                    </td>
                    <td>{{ formatCouponValue(coupon) }}</td>
                    <td>₱{{ coupon.minOrderAmount | number: '1.2-2' }}</td>
                    <td>{{ coupon.usageCount }} / {{ coupon.usageLimit || '∞' }}</td>
                    <td class="date-cell">{{ coupon.validUntil | date: 'MMM d, yyyy' }}</td>
                    <td>
                      <span
                        class="status-chip"
                        [attr.data-status]="coupon.isActive ? 'active' : 'inactive'"
                      >
                        {{ coupon.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button class="icon-btn" (click)="editCoupon(coupon)" title="Edit">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button
                        class="icon-btn danger"
                        (click)="deleteCoupon(coupon.id)"
                        title="Delete"
                      >
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="empty-state" *ngIf="coupons.length === 0">
                <i class="pi pi-ticket"></i>
                <p>No coupons created yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ TAX TAB ============ -->
        <div *ngIf="activeTab === 'tax'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Tax Settings</h1>
              <p class="breadcrumb">Admin / Tax</p>
            </div>
            <div class="top-bar-right">
              <button class="primary-btn" (click)="openTaxModal()">
                <i class="pi pi-plus"></i> Add Tax Config
              </button>
            </div>
          </header>
          <div class="tab-content">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Rate</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tax of taxConfigs">
                    <td class="bold">{{ tax.name }}</td>
                    <td>{{ tax.taxType | uppercase }}</td>
                    <td>{{ tax.rate }}%</td>
                    <td>{{ tax.region || 'All' }}</td>
                    <td>
                      <span
                        class="status-chip"
                        [attr.data-status]="tax.isActive ? 'active' : 'inactive'"
                      >
                        {{ tax.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button class="icon-btn" (click)="editTax(tax)" title="Edit">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button class="icon-btn danger" (click)="deleteTax(tax.id)" title="Delete">
                        <i class="pi pi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="empty-state" *ngIf="taxConfigs.length === 0">
                <i class="pi pi-percentage"></i>
                <p>No tax configurations</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ============ COUPON MODAL ============ -->
    <div class="modal-overlay" *ngIf="showCouponModal">
      <div class="modal-box form-modal">
        <h3>{{ editingCouponId ? 'Edit Coupon' : 'Create Coupon' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Coupon Code *</label>
            <input
              [(ngModel)]="couponForm.code"
              placeholder="SAVE20"
              style="text-transform: uppercase"
            />
          </div>
          <div class="form-group">
            <label>Discount Type *</label>
            <select [(ngModel)]="couponForm.discountType">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div class="form-group">
            <label>Discount Value *</label>
            <input type="number" [(ngModel)]="couponForm.discountValue" placeholder="20" />
          </div>
          <div class="form-group">
            <label>Min. Order Amount</label>
            <input type="number" [(ngModel)]="couponForm.minOrderAmount" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Max Discount (optional)</label>
            <input
              type="number"
              [(ngModel)]="couponForm.maxDiscountAmount"
              placeholder="Leave empty for no limit"
            />
          </div>
          <div class="form-group">
            <label>Usage Limit (optional)</label>
            <input
              type="number"
              [(ngModel)]="couponForm.usageLimit"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div class="form-group">
            <label>Per User Limit</label>
            <input type="number" [(ngModel)]="couponForm.perUserLimit" placeholder="1" />
          </div>
          <div class="form-group">
            <label>Valid From *</label>
            <input type="datetime-local" [(ngModel)]="couponForm.validFrom" />
          </div>
          <div class="form-group">
            <label>Valid Until *</label>
            <input type="datetime-local" [(ngModel)]="couponForm.validUntil" />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="couponForm.isActive" />
              Active
            </label>
          </div>
          <div class="form-group full">
            <label>Description</label>
            <textarea
              [(ngModel)]="couponForm.description"
              rows="2"
              placeholder="Save 20% on your order"
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="secondary-btn" (click)="closeCouponModal()">Cancel</button>
          <button class="primary-btn" (click)="saveCoupon()" [disabled]="savingCoupon">
            <i class="pi pi-spin pi-spinner" *ngIf="savingCoupon"></i>
            {{ editingCouponId ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ TAX MODAL ============ -->
    <div class="modal-overlay" *ngIf="showTaxModal">
      <div class="modal-box form-modal">
        <h3>{{ editingTaxId ? 'Edit Tax Config' : 'Add Tax Config' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Name *</label>
            <input [(ngModel)]="taxForm.name" placeholder="VAT" />
          </div>
          <div class="form-group">
            <label>Tax Type *</label>
            <select [(ngModel)]="taxForm.taxType">
              <option value="vat">VAT</option>
              <option value="sales_tax">Sales Tax</option>
              <option value="gst">GST</option>
            </select>
          </div>
          <div class="form-group">
            <label>Rate (%) *</label>
            <input type="number" step="0.01" [(ngModel)]="taxForm.rate" placeholder="12" />
          </div>
          <div class="form-group">
            <label>Region (optional)</label>
            <input [(ngModel)]="taxForm.region" placeholder="NCR, Region VII, etc." />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="taxForm.isActive" />
              Active
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="secondary-btn" (click)="closeTaxModal()">Cancel</button>
          <button class="primary-btn" (click)="saveTax()" [disabled]="savingTax">
            <i class="pi pi-spin pi-spinner" *ngIf="savingTax"></i>
            {{ editingTaxId ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ HUB MODAL ============ -->
    <div class="modal-overlay" *ngIf="showHubModal">
      <div class="modal-box form-modal hub-form-modal">
        <h3>{{ editingHubId ? 'Edit Hub' : 'Add Delivery Hub' }}</h3>
        <div class="form-grid">
          <div class="form-group full">
            <label>Hub Name</label><input [(ngModel)]="hubForm.name" placeholder="Main Hub" />
          </div>
          <div class="form-group full">
            <label>Address</label>
            <input [(ngModel)]="hubForm.address" placeholder="Street address" />
          </div>
          <div class="form-group"><label>City</label><input [(ngModel)]="hubForm.city" /></div>
          <div class="form-group">
            <label>Province</label><input [(ngModel)]="hubForm.province" />
          </div>
          <div class="form-group">
            <label>Latitude</label
            ><input
              type="number"
              step="any"
              [(ngModel)]="hubForm.latitude"
              (change)="updateHubMapFromInput()"
            />
          </div>
          <div class="form-group">
            <label>Longitude</label>
            <input
              type="number"
              step="any"
              [(ngModel)]="hubForm.longitude"
              (change)="updateHubMapFromInput()"
            />
          </div>
          <div class="form-group"><label>Phone</label><input [(ngModel)]="hubForm.phone" /></div>

          <!-- Account Credentials (only for new hubs) -->
          <div
            class="form-group full"
            *ngIf="!editingHubId"
            style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;"
          >
            <label
              style="font-weight: 700; color: #ff6b35; display: flex; align-items: center; gap: 6px;"
            >
              <i class="pi pi-user"></i> Hub Account Credentials
            </label>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 12px;">
              Create login credentials for hub staff to access the hub dashboard
            </p>
          </div>
          <div class="form-group" *ngIf="!editingHubId">
            <label>Email <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="hubForm.email" type="email" placeholder="hub@example.com" />
          </div>
          <div class="form-group" *ngIf="!editingHubId">
            <label>Password <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="hubForm.password" type="password" placeholder="Min. 6 characters" />
          </div>

          <div class="form-group full">
            <label
              ><i class="pi pi-map-marker" style="color:#ff6b35"></i> Pin Location on Map</label
            >
            <p class="map-hint">
              Click on the map to set the hub location. The pin and coordinates will update
              automatically.
            </p>
            <div id="hubLocationMap" class="hub-map"></div>
          </div>
        </div>
        <p class="error-msg" *ngIf="hubError">{{ hubError }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="closeHubModal()">Cancel</button>
          <button class="modal-btn primary" (click)="saveHub()" [disabled]="savingHub">
            {{ editingHubId ? 'Update' : 'Create Hub & Account' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ DRIVER MODAL ============ -->
    <div class="modal-overlay" *ngIf="showDriverModal">
      <div class="modal-box form-modal">
        <h3>{{ editingDriverId ? 'Edit Driver' : 'Add Driver' }}</h3>
        <div class="form-grid">
          <div class="form-group" *ngIf="!editingDriverId">
            <label>Email</label><input [(ngModel)]="driverForm.email" type="email" />
          </div>
          <div class="form-group" *ngIf="!editingDriverId">
            <label>Password</label><input [(ngModel)]="driverForm.password" type="password" />
          </div>
          <div class="form-group">
            <label>Full Name</label><input [(ngModel)]="driverForm.fullName" />
          </div>
          <div class="form-group"><label>Phone</label><input [(ngModel)]="driverForm.phone" /></div>
          <div class="form-group">
            <label>Vehicle Type</label>
            <select [(ngModel)]="driverForm.vehicleType">
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
            </select>
          </div>
          <div class="form-group">
            <label>Plate Number</label><input [(ngModel)]="driverForm.plateNumber" />
          </div>
          <div class="form-group">
            <label>License Number</label><input [(ngModel)]="driverForm.licenseNumber" />
          </div>
          <div class="form-group">
            <label>Assigned Hub</label>
            <select [(ngModel)]="driverForm.hubId">
              <option value="">— None —</option>
              <option *ngFor="let h of hubs" [value]="h.id">{{ h.name }}</option>
            </select>
          </div>
        </div>
        <p class="error-msg" *ngIf="driverError">{{ driverError }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showDriverModal = false">Cancel</button>
          <button class="modal-btn primary" (click)="saveDriver()" [disabled]="savingDriver">
            {{ editingDriverId ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ RECEIVE PARCEL MODAL ============ -->
    <div class="modal-overlay" *ngIf="showAssignModal">
      <div class="modal-box form-modal">
        <h3>Receive Parcel</h3>
        <div class="form-grid">
          <div class="form-group full">
            <label>Search Order</label>
            <input
              [(ngModel)]="orderSearchQuery"
              placeholder="Type order number..."
              (input)="searchOrders()"
              autocomplete="off"
            />
            <div
              class="search-results"
              *ngIf="orderSearchResults.length > 0 && !assignForm.orderId"
            >
              <div
                class="search-result-item"
                *ngFor="let o of orderSearchResults"
                (click)="selectOrder(o)"
              >
                <span class="mono">{{ o.orderNumber }}</span>
                <span class="result-meta">{{ o.user?.fullName }} — {{ o.status | titlecase }}</span>
              </div>
            </div>
            <div
              class="search-no-results"
              *ngIf="
                orderSearchQuery.length >= 2 &&
                orderSearchResults.length === 0 &&
                !assignForm.orderId &&
                !orderSearching
              "
            >
              No orders found
            </div>
            <div class="selected-order" *ngIf="selectedOrder">
              <div class="selected-order-info">
                <span class="mono">{{ selectedOrder.orderNumber }}</span>
                <span>{{ selectedOrder.user?.fullName }}</span>
                <span class="result-meta"
                  >{{ selectedOrder.address?.city }}, {{ selectedOrder.address?.province }}</span
                >
              </div>
              <button class="clear-btn" (click)="clearSelectedOrder()">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
          <div class="form-group full">
            <label>Receiving Hub</label>
            <select [(ngModel)]="assignForm.hubId">
              <option value="">Select hub</option>
              <option *ngFor="let h of hubs" [value]="h.id">{{ h.name }} — {{ h.city }}</option>
            </select>
          </div>
        </div>
        <p class="error-msg" *ngIf="assignError">{{ assignError }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showAssignModal = false; clearAssignModal()">
            Cancel
          </button>
          <button
            class="modal-btn primary"
            (click)="assignDelivery()"
            [disabled]="assigning || !assignForm.orderId || !assignForm.hubId"
          >
            {{ assigning ? 'Receiving...' : 'Receive & Generate Tracking' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ REJECT SELLER MODAL ============ -->
    <div class="modal-overlay" *ngIf="showRejectModal">
      <div class="modal-box form-modal">
        <h3>Reject Seller</h3>
        <p>
          Reject <strong>{{ rejectingSeller?.shopName }}</strong
          >?
        </p>
        <div class="form-group full">
          <label>Reason</label>
          <textarea
            [(ngModel)]="rejectReason"
            rows="3"
            placeholder="Provide a reason for rejection"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showRejectModal = false">Cancel</button>
          <button class="modal-btn danger" (click)="rejectSeller()">Reject</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Dashboard Stats */
      .dash-content {
        padding: 24px 32px;
      }
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }
      .stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: white;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e5e7eb;
      }
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      .stat-icon.sellers {
        background: #dbeafe;
        color: #2563eb;
      }
      .stat-icon.pending {
        background: #fef3c7;
        color: #d97706;
      }
      .stat-icon.orders {
        background: #fce7f3;
        color: #db2777;
      }
      .stat-icon.drivers {
        background: #e0e7ff;
        color: #4f46e5;
      }
      .stat-icon.deliveries {
        background: #d1fae5;
        color: #059669;
      }
      .stat-icon.hubs {
        background: #f3e8ff;
        color: #7c3aed;
      }
      .stat-info {
        display: flex;
        flex-direction: column;
      }
      .stat-val {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
      }
      .stat-label {
        font-size: 13px;
        color: #6b7280;
      }
      .recent-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 16px;
      }
      .recent-table-wrap {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
      }

      /* Tab Content & Tables */
      .tab-content {
        padding: 24px 32px;
      }
      .table-wrap {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      .data-table thead {
        background: #f9fafb;
      }
      .data-table th {
        padding: 12px 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        border-bottom: 1px solid #e5e7eb;
      }
      .data-table td {
        padding: 14px 16px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: middle;
      }
      .data-table tr:hover {
        background: #f9fafb;
      }
      .mono {
        font-family: monospace;
        font-weight: 600;
        font-size: 13px;
      }
      .bold {
        font-weight: 600;
        color: #1f2937;
      }
      .date-cell {
        font-size: 13px;
        color: #6b7280;
        white-space: nowrap;
      }
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
      }
      .empty-state i {
        font-size: 36px;
        color: #d1d5db;
        display: block;
        margin-bottom: 12px;
      }

      /* Primary Button */
      .primary-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .primary-btn:hover {
        background: #e55a28;
      }

      /* Filter Bar */
      .filter-bar {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
        background: white;
        border-radius: 10px;
        padding: 4px;
        border: 1px solid #e5e7eb;
        flex-wrap: wrap;
      }
      .filter-bar button {
        padding: 8px 16px;
        border: none;
        background: none;
        font-size: 13px;
        color: #6b7280;
        border-radius: 7px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .filter-bar button:hover {
        background: #f9fafb;
      }
      .filter-bar button.active {
        background: #ff6b35;
        color: white;
      }
      .badge {
        font-size: 11px;
        background: rgba(0, 0, 0, 0.1);
        padding: 1px 7px;
        border-radius: 10px;
      }
      .filter-bar button.active .badge {
        background: rgba(255, 255, 255, 0.25);
      }

      /* Status */
      .status-chip {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        white-space: nowrap;
      }
      .status-chip[data-status='pending'],
      .status-chip[data-status='assigned'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status-chip[data-status='approved'],
      .status-chip[data-status='delivered'] {
        background: #dcfce7;
        color: #166534;
      }
      .status-chip[data-status='rejected'],
      .status-chip[data-status='failed'],
      .status-chip[data-status='cancelled'] {
        background: #fee2e2;
        color: #991b1b;
      }
      .status-chip[data-status='confirmed'],
      .status-chip[data-status='picked_up'] {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-chip[data-status='processing'],
      .status-chip[data-status='in_transit'] {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-chip[data-status='shipped'] {
        background: #fce7f3;
        color: #9d174d;
      }
      .status-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #d1d5db;
      }
      .status-dot.active {
        background: #22c55e;
      }

      /* Action Buttons */
      .actions-cell {
        display: flex;
        gap: 6px;
      }
      .act-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        transition: all 0.15s;
      }
      .act-btn.approve {
        color: #059669;
      }
      .act-btn.approve:hover {
        background: #dcfce7;
        border-color: #a7f3d0;
      }
      .act-btn.reject,
      .act-btn.danger {
        color: #dc2626;
      }
      .act-btn.reject:hover {
        background: #fee2e2;
        border-color: #fca5a5;
      }
      .act-btn.edit {
        color: #2563eb;
      }
      .act-btn.edit:hover {
        background: #dbeafe;
        border-color: #93c5fd;
      }
      .act-btn.toggle {
        color: #6b7280;
      }
      .act-btn.toggle:hover {
        background: #f3f4f6;
      }

      /* Hub Cards */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }
      .hub-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 20px;
      }
      .hub-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .hub-header h4 {
        font-size: 16px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .hub-address,
      .hub-meta {
        font-size: 13px;
        color: #6b7280;
        margin: 6px 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hub-address i,
      .hub-meta i {
        color: #ff6b35;
        font-size: 13px;
      }
      .hub-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f3f4f6;
      }

      /* Modals */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      }
      .modal-box {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 560px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
      .form-modal h3 {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 20px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .form-group.full {
        grid-column: span 2;
      }
      .form-group label {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border 0.15s;
      }
      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        border-color: #ff6b35;
      }
      .error-msg {
        color: #dc2626;
        font-size: 13px;
        margin: 12px 0 0;
      }
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .modal-btn {
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
      }
      .modal-btn.secondary {
        background: #f3f4f6;
        color: #374151;
      }
      .modal-btn.secondary:hover {
        background: #e5e7eb;
      }
      .modal-btn.primary {
        background: #ff6b35;
        color: white;
      }
      .modal-btn.primary:hover {
        background: #e55a28;
      }
      .modal-btn.danger {
        background: #ef4444;
        color: white;
      }
      .modal-btn.danger:hover {
        background: #dc2626;
      }
      .modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Hub Form Modal - wider for map */
      .hub-form-modal {
        max-width: 680px;
      }
      .hub-map {
        width: 100%;
        height: 300px;
        border-radius: 10px;
        border: 1px solid #d1d5db;
        margin-top: 6px;
        z-index: 0;
      }
      .map-hint {
        font-size: 12px;
        color: #9ca3af;
        margin: 2px 0 0;
      }

      /* Order Search */
      .search-results {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        max-height: 180px;
        overflow-y: auto;
        margin-top: 4px;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      .search-result-item {
        padding: 10px 14px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        border-bottom: 1px solid #f3f4f6;
        transition: background 0.1s;
      }
      .search-result-item:last-child {
        border-bottom: none;
      }
      .search-result-item:hover {
        background: #fff7ed;
      }
      .search-result-item .mono {
        font-weight: 600;
        color: #1f2937;
      }
      .result-meta {
        font-size: 12px;
        color: #6b7280;
      }
      .search-no-results {
        font-size: 12px;
        color: #9ca3af;
        padding: 8px 0;
      }
      .selected-order {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 10px 14px;
        margin-top: 6px;
      }
      .selected-order-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 13px;
      }
      .selected-order-info .mono {
        font-weight: 700;
        color: #166534;
      }
      .clear-btn {
        background: none;
        border: none;
        color: #dc2626;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
      }

      @media (max-width: 768px) {
        .stat-grid {
          grid-template-columns: 1fr 1fr;
        }
        .form-grid {
          grid-template-columns: 1fr;
        }
        .form-group.full {
          grid-column: span 1;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';

  // Dashboard
  stats: any = {
    totalSellers: 0,
    pendingSellers: 0,
    totalOrders: 0,
    totalDrivers: 0,
    activeDeliveries: 0,
    totalHubs: 0,
  };
  recentOrders: any[] = [];

  // Sellers
  sellers: any[] = [];
  sellerFilter = 'all';
  sellerFilters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  showRejectModal = false;
  rejectingSeller: any = null;
  rejectReason = '';

  // Hubs
  hubs: any[] = [];
  showHubModal = false;
  editingHubId = '';
  hubForm: any = {};
  hubError = '';
  savingHub = false;
  private hubMap: any = null;
  private hubMarker: any = null;

  // Drivers
  drivers: any[] = [];
  showDriverModal = false;
  editingDriverId = '';
  driverForm: any = {};
  driverError = '';
  savingDriver = false;

  // Deliveries
  deliveries: any[] = [];
  deliveryFilter = 'all';
  deliveryFilters = ['all', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];
  showAssignModal = false;
  assignForm: any = { orderId: '', hubId: '' };
  assignError = '';
  assigning = false;
  orderSearchQuery = '';
  orderSearchResults: any[] = [];
  selectedOrder: any = null;
  orderSearching = false;
  private searchTimeout: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || user.userType !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboard();
  }

  ngOnDestroy() {
    this.destroyHubMap();
  }

  loadDashboard() {
    this.adminService.getDashboardStats().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stats = res.data.stats;
          this.recentOrders = res.data.recentOrders;
        }
        this.cdr.detectChanges();
      },
    });
  }

  // ---- Sellers ----
  loadSellers() {
    this.adminService.getAllSellers().subscribe({
      next: (res: any) => {
        if (res.success) this.sellers = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredSellers(): any[] {
    if (this.sellerFilter === 'all') return this.sellers;
    return this.sellers.filter((s) => s.approvalStatus === this.sellerFilter);
  }

  getSellerCount(status: string): number {
    if (status === 'all') return this.sellers.length;
    return this.sellers.filter((s) => s.approvalStatus === status).length;
  }

  approveSeller(seller: any) {
    this.adminService.approveSeller(seller.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          seller.approvalStatus = 'approved';
          this.cdr.detectChanges();
        }
      },
    });
  }

  openRejectModal(seller: any) {
    this.rejectingSeller = seller;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  rejectSeller() {
    if (!this.rejectReason.trim()) return;
    this.adminService.rejectSeller(this.rejectingSeller.id, this.rejectReason).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.rejectingSeller.approvalStatus = 'rejected';
          this.showRejectModal = false;
          this.cdr.detectChanges();
        }
      },
    });
  }

  toggleSeller(seller: any) {
    this.adminService.toggleSellerStatus(seller.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (seller.user) seller.user.isActive = res.data.isActive;
          this.cdr.detectChanges();
        }
      },
    });
  }

  // ---- Hubs ----
  loadHubs() {
    this.adminService.getHubs().subscribe({
      next: (res: any) => {
        if (res.success) this.hubs = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  resetHubForm() {
    this.editingHubId = '';
    this.hubForm = {
      name: '',
      address: '',
      city: '',
      province: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      password: '',
    };
    this.hubError = '';
    this.destroyHubMap();
    setTimeout(() => this.initHubMap(), 200);
  }

  editHub(hub: any) {
    this.editingHubId = hub.id;
    this.hubForm = { ...hub };
    this.hubError = '';
    this.showHubModal = true;
    this.destroyHubMap();
    setTimeout(() => this.initHubMap(), 200);
  }

  closeHubModal() {
    this.showHubModal = false;
    this.destroyHubMap();
  }

  initHubMap() {
    const mapEl = document.getElementById('hubLocationMap');
    if (!mapEl || this.hubMap) return;

    const defaultLat = parseFloat(this.hubForm.latitude) || 14.5995;
    const defaultLng = parseFloat(this.hubForm.longitude) || 120.9842;
    const hasCoords = !!(this.hubForm.latitude && this.hubForm.longitude);

    this.hubMap = L.map('hubLocationMap', { zoomControl: true }).setView(
      [defaultLat, defaultLng],
      hasCoords ? 15 : 6,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.hubMap);

    // Place marker if coords exist
    if (hasCoords) {
      this.placeHubMarker(defaultLat, defaultLng);
    }

    // Click to place pin
    this.hubMap.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.hubForm.latitude = parseFloat(lat.toFixed(6));
      this.hubForm.longitude = parseFloat(lng.toFixed(6));
      this.placeHubMarker(lat, lng);
      this.cdr.detectChanges();
    });

    // Fix map rendering after modal animation
    setTimeout(() => {
      if (this.hubMap) this.hubMap.invalidateSize();
    }, 300);
  }

  placeHubMarker(lat: number, lng: number) {
    const icon = L.divIcon({
      html: '<div style="background:#ff6b35;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    if (this.hubMarker) {
      this.hubMarker.setLatLng([lat, lng]);
    } else {
      this.hubMarker = L.marker([lat, lng], { icon }).addTo(this.hubMap);
    }
  }

  updateHubMapFromInput() {
    const lat = parseFloat(this.hubForm.latitude);
    const lng = parseFloat(this.hubForm.longitude);
    if (!isNaN(lat) && !isNaN(lng) && this.hubMap) {
      this.hubMap.setView([lat, lng], 15);
      this.placeHubMarker(lat, lng);
    }
  }

  destroyHubMap() {
    if (this.hubMap) {
      this.hubMap.remove();
      this.hubMap = null;
      this.hubMarker = null;
    }
  }

  saveHub() {
    this.savingHub = true;
    this.hubError = '';

    // Validate required fields for new hubs
    if (!this.editingHubId) {
      if (!this.hubForm.email || !this.hubForm.password) {
        this.hubError = 'Email and password are required for new hubs';
        this.savingHub = false;
        return;
      }
      if (this.hubForm.password.length < 6) {
        this.hubError = 'Password must be at least 6 characters';
        this.savingHub = false;
        return;
      }
    }

    const obs = this.editingHubId
      ? this.adminService.updateHub(this.editingHubId, this.hubForm)
      : this.adminService.createHub(this.hubForm);
    obs.subscribe({
      next: (res: any) => {
        this.savingHub = false;
        if (res.success) {
          this.showHubModal = false;
          this.loadHubs();
          if (!this.editingHubId) {
            alert(
              `Hub created successfully!\n\nLogin credentials:\nEmail: ${this.hubForm.email}\nPassword: ${this.hubForm.password}\n\nHub staff can now log in at the login page.`,
            );
          }
        } else this.hubError = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.savingHub = false;
        this.hubError = err.error?.message || 'Failed to save hub';
        this.cdr.detectChanges();
      },
    });
  }

  deleteHub(hub: any) {
    if (!confirm(`Delete hub "${hub.name}"?`)) return;
    this.adminService.deleteHub(hub.id).subscribe({
      next: (res: any) => {
        if (res.success) this.loadHubs();
      },
      error: (err: any) => alert(err.error?.message || 'Failed to delete hub'),
    });
  }

  // ---- Drivers ----
  loadDrivers() {
    this.adminService.getDrivers().subscribe({
      next: (res: any) => {
        if (res.success) this.drivers = res.data;
        this.cdr.detectChanges();
      },
    });
    // Also load hubs for driver form
    if (this.hubs.length === 0) this.loadHubs();
  }

  resetDriverForm() {
    this.editingDriverId = '';
    this.driverForm = {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      vehicleType: 'motorcycle',
      plateNumber: '',
      licenseNumber: '',
      hubId: '',
    };
    this.driverError = '';
  }

  editDriver(d: any) {
    this.editingDriverId = d.id;
    this.driverForm = {
      fullName: d.fullName,
      phone: d.phone,
      vehicleType: d.vehicleType,
      plateNumber: d.plateNumber,
      licenseNumber: d.licenseNumber,
      hubId: d.hubId || '',
    };
    this.driverError = '';
    this.showDriverModal = true;
  }

  saveDriver() {
    this.savingDriver = true;
    this.driverError = '';
    const obs = this.editingDriverId
      ? this.adminService.updateDriver(this.editingDriverId, this.driverForm)
      : this.adminService.createDriver(this.driverForm);
    obs.subscribe({
      next: (res: any) => {
        this.savingDriver = false;
        if (res.success) {
          this.showDriverModal = false;
          this.loadDrivers();
        } else this.driverError = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.savingDriver = false;
        this.driverError = err.error?.message || 'Failed to save driver';
        this.cdr.detectChanges();
      },
    });
  }

  deleteDriver(d: any) {
    if (!confirm(`Deactivate driver "${d.fullName}"?`)) return;
    this.adminService.deleteDriver(d.id).subscribe({
      next: (res: any) => {
        if (res.success) this.loadDrivers();
      },
      error: (err: any) => alert(err.error?.message || 'Failed'),
    });
  }

  // ---- Deliveries ----
  loadDeliveries() {
    this.adminService.getDeliveries(this.deliveryFilter).subscribe({
      next: (res: any) => {
        if (res.success) this.deliveries = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  get availableDrivers(): any[] {
    return this.drivers.filter((d) => d.isAvailable && d.isActive);
  }

  resetAssignForm() {
    this.assignForm = { orderId: '', hubId: '' };
    this.assignError = '';
    this.orderSearchQuery = '';
    this.orderSearchResults = [];
    this.selectedOrder = null;
    this.orderSearching = false;
    if (this.drivers.length === 0) this.loadDrivers();
    if (this.hubs.length === 0) this.loadHubs();
  }

  searchOrders() {
    const q = this.orderSearchQuery.trim();
    if (q.length < 2) {
      this.orderSearchResults = [];
      return;
    }
    clearTimeout(this.searchTimeout);
    this.orderSearching = true;
    this.searchTimeout = setTimeout(() => {
      this.adminService.searchOrders(q).subscribe({
        next: (res: any) => {
          this.orderSearching = false;
          if (res.success) this.orderSearchResults = res.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.orderSearching = false;
          this.orderSearchResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 300);
  }

  selectOrder(order: any) {
    this.selectedOrder = order;
    this.assignForm.orderId = order.id;
    this.orderSearchQuery = '';
    this.orderSearchResults = [];
    this.cdr.detectChanges();
  }

  clearSelectedOrder() {
    this.selectedOrder = null;
    this.assignForm.orderId = '';
    this.orderSearchQuery = '';
    this.orderSearchResults = [];
  }

  clearAssignModal() {
    this.resetAssignForm();
  }

  assignDelivery() {
    this.assigning = true;
    this.assignError = '';
    this.adminService.assignDelivery(this.assignForm).subscribe({
      next: (res: any) => {
        this.assigning = false;
        if (res.success) {
          this.showAssignModal = false;
          this.clearAssignModal();
          this.loadDeliveries();
        } else this.assignError = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.assigning = false;
        this.assignError = err.error?.message || 'Failed to receive parcel';
        this.cdr.detectChanges();
      },
    });
  }

  formatDeliveryStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
  logout() {
    this.authService.logout();
  }

  // ---- Coupons ----
  coupons: any[] = [];
  showCouponModal = false;
  editingCouponId = '';
  couponForm: any = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    usageLimit: null,
    perUserLimit: 1,
    validFrom: '',
    validUntil: '',
    isActive: true,
  };
  savingCoupon = false;

  loadCoupons() {
    this.adminService.getAllCoupons().subscribe({
      next: (res: any) => {
        if (res.success) this.coupons = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  openCouponModal() {
    this.editingCouponId = '';
    this.couponForm = {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      usageLimit: null,
      perUserLimit: 1,
      validFrom: '',
      validUntil: '',
      isActive: true,
    };
    this.showCouponModal = true;
  }

  closeCouponModal() {
    this.showCouponModal = false;
    this.editingCouponId = '';
  }

  editCoupon(coupon: any) {
    this.editingCouponId = coupon.id;
    this.couponForm = {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      isActive: coupon.isActive,
    };
    this.showCouponModal = true;
  }

  saveCoupon() {
    this.savingCoupon = true;
    const obs = this.editingCouponId
      ? this.adminService.updateCoupon(this.editingCouponId, this.couponForm)
      : this.adminService.createCoupon(this.couponForm);

    obs.subscribe({
      next: (res: any) => {
        this.savingCoupon = false;
        if (res.success) {
          this.closeCouponModal();
          this.loadCoupons();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingCoupon = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteCoupon(id: string) {
    if (!confirm('Delete this coupon?')) return;
    this.adminService.deleteCoupon(id).subscribe({
      next: (res: any) => {
        if (res.success) this.loadCoupons();
        this.cdr.detectChanges();
      },
    });
  }

  formatCouponType(type: string): string {
    const map: any = {
      percentage: 'Percentage',
      fixed: 'Fixed Amount',
      free_shipping: 'Free Shipping',
    };
    return map[type] || type;
  }

  formatCouponValue(coupon: any): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else if (coupon.discountType === 'fixed') {
      return `₱${coupon.discountValue}`;
    } else {
      return 'Free Shipping';
    }
  }

  // ---- Tax ----
  taxConfigs: any[] = [];
  showTaxModal = false;
  editingTaxId = '';
  taxForm: any = {
    name: '',
    taxType: 'vat',
    rate: 0,
    region: '',
    isActive: true,
  };
  savingTax = false;

  loadTaxConfigs() {
    this.adminService.getAllTaxConfigs().subscribe({
      next: (res: any) => {
        if (res.success) this.taxConfigs = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  openTaxModal() {
    this.editingTaxId = '';
    this.taxForm = {
      name: '',
      taxType: 'vat',
      rate: 0,
      region: '',
      isActive: true,
    };
    this.showTaxModal = true;
  }

  closeTaxModal() {
    this.showTaxModal = false;
    this.editingTaxId = '';
  }

  editTax(tax: any) {
    this.editingTaxId = tax.id;
    this.taxForm = {
      name: tax.name,
      taxType: tax.taxType,
      rate: tax.rate,
      region: tax.region,
      isActive: tax.isActive,
    };
    this.showTaxModal = true;
  }

  saveTax() {
    this.savingTax = true;
    const obs = this.editingTaxId
      ? this.adminService.updateTaxConfig(this.editingTaxId, this.taxForm)
      : this.adminService.createTaxConfig(this.taxForm);

    obs.subscribe({
      next: (res: any) => {
        this.savingTax = false;
        if (res.success) {
          this.closeTaxModal();
          this.loadTaxConfigs();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingTax = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteTax(id: string) {
    if (!confirm('Delete this tax configuration?')) return;
    this.adminService.deleteTaxConfig(id).subscribe({
      next: (res: any) => {
        if (res.success) this.loadTaxConfigs();
        this.cdr.detectChanges();
      },
    });
  }
}
