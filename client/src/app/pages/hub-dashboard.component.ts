import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HubService } from '../services/hub.service';

@Component({
  selector: 'app-hub-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./seller-dashboard.component.css'],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="pi pi-building"></i>
          <span>Hub Operations</span>
        </div>
        <div class="hub-selector" *ngIf="hubs.length > 1">
          <label>Select Hub</label>
          <select [(ngModel)]="selectedHubId" (ngModelChange)="onHubChange()">
            <option value="">Choose a hub...</option>
            <option *ngFor="let hub of hubs" [value]="hub.id">
              {{ hub.name }} — {{ hub.city }}
            </option>
          </select>
        </div>
        <nav class="sidebar-nav">
          <a
            class="nav-item"
            [class.active]="activeTab === 'parcels'"
            (click)="activeTab = 'parcels'; filterStatus = ''; loadParcels()"
          >
            <i class="pi pi-box"></i><span>All Parcels</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'receive'"
            (click)="activeTab = 'receive'; openReceiveModal()"
          >
            <i class="pi pi-plus-circle"></i><span>Receive Parcel</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'received'"
            (click)="activeTab = 'received'; filterStatus = 'received_at_hub'; loadParcels()"
          >
            <i class="pi pi-check-circle"></i><span>Received</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'transit'"
            (click)="activeTab = 'transit'; filterStatus = 'in_transit'; loadParcels()"
          >
            <i class="pi pi-truck"></i><span>In Transit</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'destination'"
            (click)="activeTab = 'destination'; filterStatus = 'at_destination_hub'; loadParcels()"
          >
            <i class="pi pi-map-marker"></i><span>At Destination</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'out'"
            (click)="activeTab = 'out'; filterStatus = 'out_for_delivery'; loadParcels()"
          >
            <i class="pi pi-send"></i><span>Out for Delivery</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'drivers'"
            (click)="activeTab = 'drivers'; loadDrivers()"
          >
            <i class="pi pi-car"></i><span>Drivers</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="back-btn" (click)="navigate(isAdmin() ? '/admin' : '/')" *ngIf="isAdmin()">
            <i class="pi pi-arrow-left"></i><span>Back to Admin</span>
          </button>
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i><span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-bar">
          <div class="top-bar-left">
            <h1>{{ getSelectedHub()?.name || 'Hub Dashboard' }}</h1>
            <p class="breadcrumb">
              {{ getSelectedHub()?.address || 'Select a hub to manage parcels' }}
            </p>
          </div>
          <div class="top-bar-right" *ngIf="selectedHubId">
            <div class="stat-pills">
              <span class="pill received">{{ getStatusCount('received_at_hub') }} Received</span>
              <span class="pill transit">{{ getStatusCount('in_transit') }} Transit</span>
              <span class="pill dest">{{ getStatusCount('at_destination_hub') }} At Hub</span>
              <span class="pill out">{{ getStatusCount('out_for_delivery') }} Out</span>
            </div>
          </div>
        </header>

        <div class="content-area">
          <!-- No hub selected -->
          <div class="empty-state" *ngIf="!selectedHubId">
            <i class="pi pi-building"></i>
            <p>Select a delivery hub from the sidebar to manage parcels.</p>
          </div>

          <!-- Loading -->
          <div class="loading-state" *ngIf="loading && selectedHubId">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading parcels...</p>
          </div>

          <!-- Empty parcels -->
          <div
            class="empty-state"
            *ngIf="!loading && selectedHubId && filteredParcels.length === 0"
          >
            <i class="pi pi-inbox"></i>
            <p>No parcels found for this status.</p>
          </div>

          <!-- Parcels List -->
          <div class="parcels-grid" *ngIf="!loading && filteredParcels.length > 0">
            <div class="parcel-card" *ngFor="let p of filteredParcels">
              <div class="parcel-header">
                <div class="parcel-tracking" *ngIf="p.trackingNumber">
                  <i class="pi pi-barcode"></i> {{ p.trackingNumber }}
                </div>
                <div class="parcel-tracking no-track" *ngIf="!p.trackingNumber">
                  <i class="pi pi-clock"></i> Awaiting Tracking #
                </div>
                <span class="status-chip" [attr.data-status]="p.status">{{
                  formatStatus(p.status)
                }}</span>
              </div>

              <div class="parcel-info">
                <div class="info-row">
                  <span class="label">Order:</span>
                  <span class="value mono">{{ p.order?.orderNumber }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Customer:</span>
                  <span class="value">{{ p.order?.user?.fullName }}</span>
                </div>
                <div class="info-row" *ngIf="p.order?.items?.length">
                  <span class="label">Seller:</span>
                  <span class="value">{{ p.order.items[0]?.seller?.shopName }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Origin Hub:</span>
                  <span class="value">{{ p.hub?.name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Dest Hub:</span>
                  <span class="value">{{ p.destinationHub?.name || '—' }}</span>
                </div>
                <div class="info-row" *ngIf="p.order?.address">
                  <span class="label">Deliver to:</span>
                  <span class="value small"
                    >{{ p.order.address.streetAddress }}, {{ p.order.address.city }}</span
                  >
                </div>
                <div class="info-row" *ngIf="p.driver">
                  <span class="label">Driver:</span>
                  <span class="value">{{ p.driver.fullName }} ({{ p.driver.vehicleType }})</span>
                </div>
              </div>

              <!-- QR Code Display -->
              <div class="qr-section" *ngIf="p.qrCode">
                <button class="qr-toggle" (click)="p._showQR = !p._showQR">
                  <i class="pi pi-qrcode"></i> {{ p._showQR ? 'Hide' : 'Show' }} QR Code
                </button>
                <div class="qr-image" *ngIf="p._showQR">
                  <img [src]="p.qrCode" alt="QR Code" />
                  <p class="qr-label">Scan to confirm delivery</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="parcel-actions">
                <!-- Dispatch to destination hub -->
                <button
                  class="action-btn dispatch"
                  *ngIf="p.status === 'received_at_hub'"
                  (click)="showDispatchModal(p)"
                  [disabled]="p._loading"
                >
                  <i class="pi pi-truck"></i> Dispatch to Hub
                </button>

                <!-- Mark arrived at destination -->
                <button
                  class="action-btn arrive"
                  *ngIf="p.status === 'in_transit' && isDestinationHub(p)"
                  (click)="arriveAtHub(p)"
                  [disabled]="p._loading"
                >
                  <i class="pi pi-map-marker"></i> Mark Arrived
                </button>

                <!-- Assign rider -->
                <button
                  class="action-btn assign"
                  *ngIf="p.status === 'at_destination_hub'"
                  (click)="showAssignModal(p)"
                  [disabled]="p._loading"
                >
                  <i class="pi pi-user"></i> Assign Rider
                </button>

                <span class="action-status" *ngIf="p.status === 'out_for_delivery'">
                  <i class="pi pi-send"></i> Rider is delivering
                </span>
                <span class="action-status delivered" *ngIf="p.status === 'delivered'">
                  <i class="pi pi-check-circle"></i> Delivered
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ DRIVERS TAB ============ -->
        <div *ngIf="activeTab === 'drivers'" class="content-area">
          <header class="section-header">
            <h2>Drivers</h2>
            <button class="primary-btn" (click)="openDriverModal()">
              <i class="pi pi-plus"></i> Add Driver
            </button>
          </header>

          <div class="loading-state" *ngIf="loadingDrivers">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading drivers...</p>
          </div>

          <div class="drivers-grid" *ngIf="!loadingDrivers && drivers.length > 0">
            <div class="driver-card" *ngFor="let driver of drivers">
              <div class="driver-header">
                <div class="driver-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="driver-info">
                  <h4>{{ driver.fullName }}</h4>
                  <p class="driver-vehicle">
                    {{ driver.vehicleType | titlecase }} - {{ driver.plateNumber }}
                  </p>
                </div>
                <span
                  class="status-badge"
                  [class.active]="driver.isAvailable"
                  [class.inactive]="!driver.isAvailable"
                >
                  {{ driver.isAvailable ? 'Available' : 'Busy' }}
                </span>
              </div>
              <div class="driver-details">
                <div class="detail-row">
                  <i class="pi pi-phone"></i>
                  <span>{{ driver.phone }}</span>
                </div>
                <div class="detail-row">
                  <i class="pi pi-id-card"></i>
                  <span>License: {{ driver.licenseNumber }}</span>
                </div>
                <div class="detail-row">
                  <i class="pi pi-building"></i>
                  <span>{{ driver.hub?.name || 'No hub assigned' }}</span>
                </div>
              </div>
              <div class="driver-actions">
                <button class="edit-btn" (click)="editDriver(driver)">
                  <i class="pi pi-pencil"></i> Edit
                </button>
                <button class="toggle-btn" (click)="toggleDriverStatus(driver)">
                  <i
                    class="pi"
                    [class.pi-check]="!driver.isActive"
                    [class.pi-times]="driver.isActive"
                  ></i>
                  {{ driver.isActive ? 'Deactivate' : 'Activate' }}
                </button>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="!loadingDrivers && drivers.length === 0">
            <i class="pi pi-car"></i>
            <p>No drivers found. Add your first driver to get started.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Driver Modal -->
    <div class="modal-overlay" *ngIf="showDriverModal">
      <div class="modal-box form-modal">
        <h3>{{ editingDriverId ? 'Edit Driver' : 'Add Driver' }}</h3>
        <div class="form-grid">
          <div class="form-group" *ngIf="!editingDriverId">
            <label>Email <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="driverForm.email" type="email" placeholder="driver@example.com" />
          </div>
          <div class="form-group" *ngIf="!editingDriverId">
            <label>Password <span style="color: #dc2626;">*</span></label>
            <input
              [(ngModel)]="driverForm.password"
              type="password"
              placeholder="Min. 6 characters"
            />
          </div>
          <div class="form-group">
            <label>Full Name <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="driverForm.fullName" placeholder="John Doe" />
          </div>
          <div class="form-group">
            <label>Phone <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="driverForm.phone" placeholder="+63 912 345 6789" />
          </div>
          <div class="form-group">
            <label>Vehicle Type <span style="color: #dc2626;">*</span></label>
            <select [(ngModel)]="driverForm.vehicleType">
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
            </select>
          </div>
          <div class="form-group">
            <label>Plate Number <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="driverForm.plateNumber" placeholder="ABC 1234" />
          </div>
          <div class="form-group">
            <label>License Number <span style="color: #dc2626;">*</span></label>
            <input [(ngModel)]="driverForm.licenseNumber" placeholder="N01-12-345678" />
          </div>
        </div>
        <p class="error-msg" *ngIf="driverError">{{ driverError }}</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="closeDriverModal()">Cancel</button>
          <button class="modal-btn primary" (click)="saveDriver()" [disabled]="savingDriver">
            {{ editingDriverId ? 'Update' : 'Create Driver' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dispatch Modal -->
    <div class="modal-overlay" *ngIf="showDispatch">
      <div class="modal-box">
        <h3><i class="pi pi-truck"></i> Dispatch Parcel</h3>
        <p>
          Send parcel to <strong>{{ dispatchParcel?.destinationHub?.name }}</strong>
        </p>
        <p class="sub" *ngIf="dispatchParcel?.hubId === dispatchParcel?.destinationHubId">
          Same hub — will skip transit and mark as arrived.
        </p>
        <p class="sub" *ngIf="dispatchParcel?.hubId !== dispatchParcel?.destinationHubId">
          Parcel will be marked as in transit to the destination hub. No driver assignment needed
          for hub-to-hub transfers.
        </p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showDispatch = false">Cancel</button>
          <button class="modal-btn primary" (click)="dispatchToHub()">Dispatch</button>
        </div>
      </div>
    </div>

    <!-- Assign Rider Modal -->
    <div class="modal-overlay" *ngIf="showAssign">
      <div class="modal-box">
        <h3><i class="pi pi-user"></i> Assign Rider</h3>
        <p>
          Assign a rider for last-mile delivery to
          <strong
            >{{ assignParcel?.order?.address?.streetAddress }},
            {{ assignParcel?.order?.address?.city }}</strong
          >
        </p>
        <p class="sub" *ngIf="assignParcel?.order?.address?.province">
          {{ assignParcel?.order?.address?.barangay }}, {{ assignParcel?.order?.address?.province }}
        </p>
        <div class="form-group">
          <label>Select Rider</label>
          <select [(ngModel)]="selectedRiderId">
            <option value="">Choose rider...</option>
            <option *ngFor="let d of availableDrivers" [value]="d.id">
              {{ d.fullName }} — {{ d.vehicleType }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showAssign = false">Cancel</button>
          <button class="modal-btn primary" (click)="assignRider()" [disabled]="!selectedRiderId">
            Assign
          </button>
        </div>
      </div>
    </div>

    <!-- Receive Parcel Modal -->
    <div class="modal-overlay" *ngIf="showReceive">
      <div class="modal-box" style="max-width: 520px">
        <h3><i class="pi pi-plus-circle"></i> Receive Parcel from Seller</h3>
        <p>Search for a processing order to receive at this hub.</p>
        <div class="form-group">
          <label>Search Order Number</label>
          <input
            type="text"
            class="search-input"
            [(ngModel)]="receiveSearchQuery"
            (input)="searchProcessingOrders()"
            placeholder="Type order number (e.g. MS-...)  "
            autocomplete="off"
          />
        </div>
        <div
          class="receive-results"
          *ngIf="receiveSearchResults.length > 0 && !receiveSelectedOrder"
        >
          <div
            class="receive-result-item"
            *ngFor="let o of receiveSearchResults"
            (click)="selectReceiveOrder(o)"
          >
            <div class="result-order-num">{{ o.orderNumber }}</div>
            <div class="result-meta">
              {{ o.user?.fullName }} — {{ o.items?.length || 0 }} item(s) — ₱{{ o.total }}
            </div>
            <div class="result-meta" *ngIf="o.address">
              {{ o.address.city }}, {{ o.address.province }}
            </div>
          </div>
        </div>
        <div
          class="receive-no-results"
          *ngIf="
            receiveSearchQuery.length >= 2 &&
            receiveSearchResults.length === 0 &&
            !receiveSearching &&
            !receiveSelectedOrder
          "
        >
          No processing orders found.
        </div>
        <div class="receive-selected" *ngIf="receiveSelectedOrder">
          <div class="selected-header">
            <strong>{{ receiveSelectedOrder.orderNumber }}</strong>
            <button class="clear-btn" (click)="clearReceiveOrder()">✕</button>
          </div>
          <div class="selected-details">
            <div>Customer: {{ receiveSelectedOrder.user?.fullName }}</div>
            <div>Total: ₱{{ receiveSelectedOrder.total }}</div>
            <div *ngIf="receiveSelectedOrder.items?.length">
              Seller: {{ receiveSelectedOrder.items[0]?.seller?.shopName }}
            </div>
            <div *ngIf="receiveSelectedOrder.address">
              Deliver to: {{ receiveSelectedOrder.address.streetAddress }},
              {{ receiveSelectedOrder.address.barangay }},
              {{ receiveSelectedOrder.address.city }}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="closeReceiveModal()">Cancel</button>
          <button
            class="modal-btn primary"
            (click)="confirmReceive()"
            [disabled]="!receiveSelectedOrder || receiving"
          >
            {{ receiving ? 'Receiving...' : 'Receive & Generate Tracking' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Hub-specific styles */
      .hub-selector {
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      .hub-selector label {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 6px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .hub-selector select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 13px;
        color: #374151;
        background: white;
      }

      /* Content area styles */
      .content-area {
        padding: 24px 30px;
      }
      .stat-pills {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .pill {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
      }
      .pill.pending {
        background: #fef3c7;
        color: #92400e;
      }
      .pill.received {
        background: #dbeafe;
        color: #1e40af;
      }
      .pill.transit {
        background: #e0e7ff;
        color: #3730a3;
      }
      .pill.dest {
        background: #fce7f3;
        color: #9d174d;
      }
      .pill.out {
        background: #dcfce7;
        color: #166534;
      }

      .loading-state,
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
      }
      .loading-state i,
      .empty-state i {
        font-size: 40px;
        color: #d1d5db;
        display: block;
        margin-bottom: 12px;
      }
      .loading-state i {
        color: #ff6b35;
      }

      /* Parcel cards */
      .parcels-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 16px;
      }
      .parcel-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 20px;
        transition: box-shadow 0.2s;
      }
      .parcel-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }
      .parcel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .parcel-tracking {
        font-family: monospace;
        font-size: 13px;
        font-weight: 700;
        color: #7c3aed;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .parcel-tracking.no-track {
        color: #9ca3af;
        font-weight: 500;
      }
      .status-chip {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 20px;
      }
      .status-chip[data-status='pending_drop_off'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status-chip[data-status='received_at_hub'] {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-chip[data-status='in_transit'] {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-chip[data-status='at_destination_hub'] {
        background: #fce7f3;
        color: #9d174d;
      }
      .status-chip[data-status='out_for_delivery'] {
        background: #dcfce7;
        color: #166534;
      }
      .status-chip[data-status='delivered'] {
        background: #d1fae5;
        color: #065f46;
      }
      .status-chip[data-status='failed'] {
        background: #fee2e2;
        color: #991b1b;
      }

      .parcel-info {
        margin-bottom: 14px;
      }
      .info-row {
        display: flex;
        gap: 8px;
        font-size: 13px;
        margin-bottom: 4px;
      }
      .info-row .label {
        color: #6b7280;
        min-width: 80px;
        flex-shrink: 0;
      }
      .info-row .value {
        color: #1f2937;
        font-weight: 500;
      }
      .info-row .value.mono {
        font-family: monospace;
      }
      .info-row .value.small {
        font-size: 12px;
      }

      .qr-section {
        margin-bottom: 14px;
      }
      .qr-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        border-radius: 6px;
        font-size: 12px;
        color: #7c3aed;
        cursor: pointer;
        font-weight: 500;
      }
      .qr-toggle:hover {
        background: #ede9fe;
      }
      .qr-image {
        text-align: center;
        margin-top: 10px;
      }
      .qr-image img {
        width: 200px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }
      .qr-label {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
      }

      .parcel-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        padding-top: 14px;
        border-top: 1px solid #f3f4f6;
      }
      .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s;
      }
      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .action-btn.receive {
        background: #dbeafe;
        color: #1e40af;
      }
      .action-btn.receive:hover:not(:disabled) {
        background: #bfdbfe;
      }
      .action-btn.dispatch {
        background: #e0e7ff;
        color: #3730a3;
      }
      .action-btn.dispatch:hover:not(:disabled) {
        background: #c7d2fe;
      }
      .action-btn.arrive {
        background: #fce7f3;
        color: #9d174d;
      }
      .action-btn.arrive:hover:not(:disabled) {
        background: #fbcfe8;
      }
      .action-btn.assign {
        background: #dcfce7;
        color: #166534;
      }
      .action-btn.assign:hover:not(:disabled) {
        background: #bbf7d0;
      }
      .action-status {
        font-size: 13px;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
      }
      .action-status.delivered {
        color: #16a34a;
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
        max-width: 440px;
        width: 90%;
      }
      .modal-box h3 {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .modal-box h3 i {
        color: #ff6b35;
      }
      .modal-box p {
        font-size: 14px;
        color: #4b5563;
        margin: 0 0 8px;
      }
      .modal-box .sub {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }
      .form-group {
        margin: 16px 0;
      }
      .form-group label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
      }
      .form-group select,
      .form-group input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        background: white;
      }
      .modal-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
        justify-content: flex-end;
      }
      .modal-btn {
        padding: 10px 20px;
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
      .modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Receive modal */
      .search-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .search-input:focus {
        outline: none;
        border-color: #ff6b35;
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
      }
      .receive-results {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-top: 8px;
      }
      .receive-result-item {
        padding: 10px 14px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
        transition: background 0.1s;
      }
      .receive-result-item:last-child {
        border-bottom: none;
      }
      .receive-result-item:hover {
        background: #fff7ed;
      }
      .result-order-num {
        font-family: monospace;
        font-weight: 700;
        font-size: 14px;
        color: #1f2937;
      }
      .result-meta {
        font-size: 12px;
        color: #6b7280;
        margin-top: 2px;
      }
      .receive-no-results {
        text-align: center;
        padding: 16px;
        color: #9ca3af;
        font-size: 13px;
      }
      .receive-selected {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 10px;
        padding: 14px;
        margin-top: 12px;
      }
      .selected-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .selected-header strong {
        font-family: monospace;
        font-size: 15px;
        color: #166534;
      }
      .clear-btn {
        background: none;
        border: none;
        font-size: 16px;
        color: #9ca3af;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .clear-btn:hover {
        color: #dc2626;
        background: #fee2e2;
      }
      .selected-details {
        font-size: 13px;
        color: #374151;
        line-height: 1.6;
      }

      /* Drivers Section */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .section-header h2 {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .primary-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .primary-btn:hover {
        background: #e55a28;
      }
      .drivers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }
      .driver-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        padding: 20px;
        transition: box-shadow 0.2s;
      }
      .driver-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }
      .driver-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .driver-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        font-size: 20px;
      }
      .driver-info {
        flex: 1;
      }
      .driver-info h4 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px;
      }
      .driver-vehicle {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
      }
      .status-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
      }
      .status-badge.active {
        background: #dcfce7;
        color: #166534;
      }
      .status-badge.inactive {
        background: #fee2e2;
        color: #991b1b;
      }
      .driver-details {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f3f4f6;
      }
      .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #4b5563;
        margin-bottom: 8px;
      }
      .detail-row:last-child {
        margin-bottom: 0;
      }
      .detail-row i {
        color: #9ca3af;
        width: 16px;
      }
      .driver-actions {
        display: flex;
        gap: 8px;
      }
      .edit-btn,
      .toggle-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.15s;
      }
      .edit-btn {
        background: #f3f4f6;
        color: #374151;
      }
      .edit-btn:hover {
        background: #e5e7eb;
      }
      .toggle-btn {
        background: #fef2f2;
        color: #dc2626;
      }
      .toggle-btn:hover {
        background: #fee2e2;
      }
      .form-modal {
        max-width: 500px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }
      .form-group.full {
        grid-column: 1 / -1;
      }
      .error-msg {
        background: #fee2e2;
        color: #991b1b;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 16px;
      }

      @media (max-width: 768px) {
        .parcels-grid {
          grid-template-columns: 1fr;
        }
        .stat-pills {
          display: none;
        }
      }
    `,
  ],
})
export class HubDashboardComponent implements OnInit {
  hubs: any[] = [];
  selectedHubId = '';
  activeTab = 'parcels';
  filterStatus = '';
  parcels: any[] = [];
  loading = false;

  // Modal state
  showDispatch = false;
  dispatchParcel: any = null;
  showAssign = false;
  assignParcel: any = null;
  selectedDriverId = '';
  selectedRiderId = '';
  availableDrivers: any[] = [];

  // Receive modal state
  showReceive = false;
  receiveSearchQuery = '';
  receiveSearchResults: any[] = [];
  receiveSelectedOrder: any = null;
  receiveSearching = false;
  receiving = false;
  receiveSearchTimeout: any = null;

  // Driver management state
  drivers: any[] = [];
  loadingDrivers = false;
  showDriverModal = false;
  editingDriverId = '';
  driverForm: any = {
    email: '',
    password: '',
    fullName: '',
    phone: '',
    vehicleType: 'motorcycle',
    plateNumber: '',
    licenseNumber: '',
  };
  driverError = '';
  savingDriver = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private hubService: HubService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || (user.userType !== 'admin' && user.userType !== 'hub')) {
      this.router.navigate(['/login']);
      return;
    }

    // If hub user, get their hub from localStorage
    if (user.userType === 'hub') {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.hub) {
        this.hubs = [userData.hub];
        this.selectedHubId = userData.hub.id;
        this.loadParcels();
      }
    } else {
      // Admin can see all hubs
      this.loadHubs();
    }
  }

  loadHubs() {
    this.hubService.getAvailableHubs().subscribe({
      next: (res: any) => {
        if (res.success) this.hubs = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  onHubChange() {
    if (this.selectedHubId) {
      this.filterStatus = '';
      this.activeTab = 'parcels';
      this.loadParcels();
    }
  }

  loadParcels() {
    if (!this.selectedHubId) return;
    this.loading = true;
    this.hubService.getHubParcels(this.selectedHubId, this.filterStatus || undefined).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) this.parcels = res.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredParcels(): any[] {
    return this.parcels;
  }

  getSelectedHub() {
    return this.hubs.find((h) => h.id === this.selectedHubId);
  }

  getStatusCount(status: string): number {
    return this.parcels.filter((p) => p.status === status).length;
  }

  isDestinationHub(p: any): boolean {
    return p.destinationHubId === this.selectedHubId;
  }

  formatStatus(status: string): string {
    const map: any = {
      pending_drop_off: 'Pending Drop-off',
      received_at_hub: 'Received',
      in_transit: 'In Transit',
      at_destination_hub: 'At Destination',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      failed: 'Failed',
    };
    return map[status] || status;
  }

  receiveParcel(p: any) {
    // Legacy — no longer used
  }

  openReceiveModal() {
    this.showReceive = true;
    this.receiveSearchQuery = '';
    this.receiveSearchResults = [];
    this.receiveSelectedOrder = null;
    this.receiving = false;
  }

  closeReceiveModal() {
    this.showReceive = false;
    this.receiveSearchQuery = '';
    this.receiveSearchResults = [];
    this.receiveSelectedOrder = null;
    this.receiving = false;
    this.activeTab = 'parcels';
  }

  searchProcessingOrders() {
    if (this.receiveSearchTimeout) clearTimeout(this.receiveSearchTimeout);
    if (this.receiveSearchQuery.length < 2) {
      this.receiveSearchResults = [];
      return;
    }
    this.receiveSearching = true;
    this.receiveSearchTimeout = setTimeout(() => {
      this.hubService.searchProcessingOrders(this.receiveSearchQuery).subscribe({
        next: (res: any) => {
          this.receiveSearching = false;
          if (res.success) this.receiveSearchResults = res.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.receiveSearching = false;
          this.receiveSearchResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 300);
  }

  selectReceiveOrder(order: any) {
    this.receiveSelectedOrder = order;
    this.receiveSearchResults = [];
  }

  clearReceiveOrder() {
    this.receiveSelectedOrder = null;
    this.receiveSearchQuery = '';
    this.receiveSearchResults = [];
  }

  confirmReceive() {
    if (!this.receiveSelectedOrder || !this.selectedHubId) return;
    this.receiving = true;
    this.hubService.receiveFromSeller(this.selectedHubId, this.receiveSelectedOrder.id).subscribe({
      next: (res: any) => {
        this.receiving = false;
        if (res.success) {
          alert(`Parcel received! Tracking: ${res.data.trackingNumber}`);
          this.closeReceiveModal();
          this.loadParcels();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.receiving = false;
        alert(err.error?.message || 'Failed to receive parcel');
        this.cdr.detectChanges();
      },
    });
  }

  showDispatchModal(p: any) {
    this.dispatchParcel = p;
    this.showDispatch = true;
    // No driver needed for hub-to-hub transfers
  }

  showAssignModal(p: any) {
    this.assignParcel = p;
    this.selectedRiderId = '';
    this.showAssign = true;
    this.loadAvailableDrivers();
  }

  loadAvailableDrivers() {
    // Use admin API to get drivers (reusing hub service for available hubs, but we need admin service)
    // For simplicity, load all hubs' drivers through a fetch
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/api/admin/drivers', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          this.availableDrivers = res.data.filter((d: any) => d.isAvailable && d.isActive);
        }
        this.cdr.detectChanges();
      });
  }

  dispatchToHub() {
    if (!this.dispatchParcel) return;
    // No driver needed for hub-to-hub transfers
    this.hubService.dispatchToHub(this.dispatchParcel.id).subscribe({
      next: (res: any) => {
        this.showDispatch = false;
        if (res.success) {
          this.loadParcels();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.showDispatch = false;
        this.cdr.detectChanges();
      },
    });
  }

  arriveAtHub(p: any) {
    p._loading = true;
    this.hubService.arriveAtHub(p.id).subscribe({
      next: (res: any) => {
        p._loading = false;
        if (res.success) {
          p.status = 'at_destination_hub';
          p.driverId = null;
          p.driver = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        p._loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  assignRider() {
    if (!this.assignParcel || !this.selectedRiderId) return;
    this.hubService.assignRider(this.assignParcel.id, this.selectedRiderId).subscribe({
      next: (res: any) => {
        this.showAssign = false;
        if (res.success) {
          this.loadParcels();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.showAssign = false;
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

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.userType === 'admin';
  }

  // ============ DRIVER MANAGEMENT ============
  loadDrivers() {
    if (!this.selectedHubId) return;
    this.loadingDrivers = true;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/api/admin/drivers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        this.loadingDrivers = false;
        if (res.success) {
          // Filter drivers for this hub only
          this.drivers = res.data.filter((d: any) => d.hubId === this.selectedHubId);
        }
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.loadingDrivers = false;
        this.cdr.detectChanges();
      });
  }

  openDriverModal() {
    this.editingDriverId = '';
    this.driverForm = {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      vehicleType: 'motorcycle',
      plateNumber: '',
      licenseNumber: '',
    };
    this.driverError = '';
    this.showDriverModal = true;
  }

  closeDriverModal() {
    this.showDriverModal = false;
    this.editingDriverId = '';
    this.driverError = '';
  }

  editDriver(driver: any) {
    this.editingDriverId = driver.id;
    this.driverForm = {
      fullName: driver.fullName,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      plateNumber: driver.plateNumber,
      licenseNumber: driver.licenseNumber,
    };
    this.driverError = '';
    this.showDriverModal = true;
  }

  saveDriver() {
    this.savingDriver = true;
    this.driverError = '';

    // Validate required fields
    if (!this.editingDriverId) {
      if (!this.driverForm.email || !this.driverForm.password) {
        this.driverError = 'Email and password are required';
        this.savingDriver = false;
        return;
      }
      if (this.driverForm.password.length < 6) {
        this.driverError = 'Password must be at least 6 characters';
        this.savingDriver = false;
        return;
      }
    }

    if (
      !this.driverForm.fullName ||
      !this.driverForm.phone ||
      !this.driverForm.plateNumber ||
      !this.driverForm.licenseNumber
    ) {
      this.driverError = 'All fields are required';
      this.savingDriver = false;
      return;
    }

    const token = localStorage.getItem('token');
    const payload = {
      ...this.driverForm,
      hubId: this.selectedHubId, // Assign to current hub
    };

    const url = this.editingDriverId
      ? `http://localhost:8000/api/admin/drivers/${this.editingDriverId}`
      : `http://localhost:8000/api/admin/drivers`;

    const method = this.editingDriverId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((res) => {
        this.savingDriver = false;
        if (res.success) {
          this.closeDriverModal();
          this.loadDrivers();
          if (!this.editingDriverId) {
            alert(
              `Driver created successfully!\n\nLogin credentials:\nEmail: ${this.driverForm.email}\nPassword: ${this.driverForm.password}`,
            );
          }
        } else {
          this.driverError = res.message || 'Failed to save driver';
        }
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.savingDriver = false;
        this.driverError = 'Failed to save driver';
        this.cdr.detectChanges();
      });
  }

  toggleDriverStatus(driver: any) {
    const action = driver.isActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} driver ${driver.fullName}?`))
      return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/api/admin/drivers/${driver.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !driver.isActive }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          this.loadDrivers();
        } else {
          alert(res.message || 'Failed to update driver');
        }
      })
      .catch(() => alert('Failed to update driver'));
  }
}
