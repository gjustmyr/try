import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';

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
                <i class="pi pi-plus"></i> Assign Delivery
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
      </main>
    </div>

    <!-- ============ HUB MODAL ============ -->
    <div class="modal-overlay" *ngIf="showHubModal">
      <div class="modal-box form-modal">
        <h3>{{ editingHubId ? 'Edit Hub' : 'Add Delivery Hub' }}</h3>
        <div class="form-grid">
          <div class="form-group full">
            <label>Hub Name</label><input [(ngModel)]="hubForm.name" placeholder="Main Hub" />
          </div>
          <div class="form-group full">
            <label>Address</label
            ><input [(ngModel)]="hubForm.address" placeholder="Street address" />
          </div>
          <div class="form-group"><label>City</label><input [(ngModel)]="hubForm.city" /></div>
          <div class="form-group">
            <label>Province</label><input [(ngModel)]="hubForm.province" />
          </div>
          <div class="form-group">
            <label>Latitude</label><input type="number" step="any" [(ngModel)]="hubForm.latitude" />
          </div>
          <div class="form-group">
            <label>Longitude</label
            ><input type="number" step="any" [(ngModel)]="hubForm.longitude" />
          </div>
          <div class="form-group"><label>Phone</label><input [(ngModel)]="hubForm.phone" /></div>
        </div>
        <p class="error-msg" *ngIf="hubError">{{ hubError }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showHubModal = false">Cancel</button>
          <button class="modal-btn primary" (click)="saveHub()" [disabled]="savingHub">
            {{ editingHubId ? 'Update' : 'Create' }}
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

    <!-- ============ ASSIGN DELIVERY MODAL ============ -->
    <div class="modal-overlay" *ngIf="showAssignModal">
      <div class="modal-box form-modal">
        <h3>Assign Delivery</h3>
        <div class="form-grid">
          <div class="form-group full">
            <label>Order ID</label>
            <input [(ngModel)]="assignForm.orderId" placeholder="Paste order UUID" />
          </div>
          <div class="form-group">
            <label>Hub</label>
            <select [(ngModel)]="assignForm.hubId">
              <option value="">Select hub</option>
              <option *ngFor="let h of hubs" [value]="h.id">{{ h.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Driver</label>
            <select [(ngModel)]="assignForm.driverId">
              <option value="">Select driver</option>
              <option *ngFor="let d of availableDrivers" [value]="d.id">
                {{ d.fullName }} ({{ d.vehicleType }})
              </option>
            </select>
          </div>
        </div>
        <p class="error-msg" *ngIf="assignError">{{ assignError }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showAssignModal = false">Cancel</button>
          <button class="modal-btn primary" (click)="assignDelivery()" [disabled]="assigning">
            Assign
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
export class AdminDashboardComponent implements OnInit {
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
  assignForm: any = { orderId: '', hubId: '', driverId: '' };
  assignError = '';
  assigning = false;

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
    };
    this.hubError = '';
  }

  editHub(hub: any) {
    this.editingHubId = hub.id;
    this.hubForm = { ...hub };
    this.hubError = '';
    this.showHubModal = true;
  }

  saveHub() {
    this.savingHub = true;
    this.hubError = '';
    const obs = this.editingHubId
      ? this.adminService.updateHub(this.editingHubId, this.hubForm)
      : this.adminService.createHub(this.hubForm);
    obs.subscribe({
      next: (res: any) => {
        this.savingHub = false;
        if (res.success) {
          this.showHubModal = false;
          this.loadHubs();
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
    this.assignForm = { orderId: '', hubId: '', driverId: '' };
    this.assignError = '';
    if (this.drivers.length === 0) this.loadDrivers();
    if (this.hubs.length === 0) this.loadHubs();
  }

  assignDelivery() {
    this.assigning = true;
    this.assignError = '';
    this.adminService.assignDelivery(this.assignForm).subscribe({
      next: (res: any) => {
        this.assigning = false;
        if (res.success) {
          this.showAssignModal = false;
          this.loadDeliveries();
        } else this.assignError = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.assigning = false;
        this.assignError = err.error?.message || 'Failed to assign';
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
}
