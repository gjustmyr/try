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
  template: `
    <div class="hub-layout">
      <!-- Sidebar -->
      <aside class="hub-sidebar">
        <div class="sidebar-header">
          <i class="pi pi-building"></i>
          <span>Hub Operations</span>
        </div>
        <div class="hub-selector" *ngIf="hubs.length > 0">
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
            (click)="activeTab = 'parcels'"
          >
            <i class="pi pi-box"></i> <span>All Parcels</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'pending'"
            (click)="activeTab = 'pending'; filterStatus = 'pending_drop_off'; loadParcels()"
          >
            <i class="pi pi-clock"></i> <span>Pending Drop-offs</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'received'"
            (click)="activeTab = 'received'; filterStatus = 'received_at_hub'; loadParcels()"
          >
            <i class="pi pi-check-circle"></i> <span>Received</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'transit'"
            (click)="activeTab = 'transit'; filterStatus = 'in_transit'; loadParcels()"
          >
            <i class="pi pi-truck"></i> <span>In Transit</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'destination'"
            (click)="activeTab = 'destination'; filterStatus = 'at_destination_hub'; loadParcels()"
          >
            <i class="pi pi-map-marker"></i> <span>At Destination</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'out'"
            (click)="activeTab = 'out'; filterStatus = 'out_for_delivery'; loadParcels()"
          >
            <i class="pi pi-send"></i> <span>Out for Delivery</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="back-btn" (click)="navigate('/admin')">
            <i class="pi pi-arrow-left"></i> <span>Back to Admin</span>
          </button>
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i> <span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="hub-main">
        <header class="top-bar">
          <div class="top-bar-left">
            <h1>{{ getSelectedHub()?.name || 'Hub Dashboard' }}</h1>
            <p class="breadcrumb">
              {{ getSelectedHub()?.address || 'Select a hub to manage parcels' }}
            </p>
          </div>
          <div class="top-bar-right" *ngIf="selectedHubId">
            <div class="stat-pills">
              <span class="pill pending">{{ getStatusCount('pending_drop_off') }} Pending</span>
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
                <!-- Receive from seller -->
                <button
                  class="action-btn receive"
                  *ngIf="p.status === 'pending_drop_off'"
                  (click)="receiveParcel(p)"
                  [disabled]="p._loading"
                >
                  <i class="pi pi-check"></i> Receive Parcel
                </button>

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
      </main>
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
        <div class="form-group" *ngIf="dispatchParcel?.hubId !== dispatchParcel?.destinationHubId">
          <label>Select Transfer Driver</label>
          <select [(ngModel)]="selectedDriverId">
            <option value="">Choose driver...</option>
            <option *ngFor="let d of availableDrivers" [value]="d.id">
              {{ d.fullName }} — {{ d.vehicleType }} ({{ d.hub?.name || 'No hub' }})
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="showDispatch = false">Cancel</button>
          <button
            class="modal-btn primary"
            (click)="dispatchToHub()"
            [disabled]="
              dispatchParcel?.hubId !== dispatchParcel?.destinationHubId && !selectedDriverId
            "
          >
            Dispatch
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Rider Modal -->
    <div class="modal-overlay" *ngIf="showAssign">
      <div class="modal-box">
        <h3><i class="pi pi-user"></i> Assign Rider</h3>
        <p>
          Assign a rider for last-mile delivery to
          <strong>{{ assignParcel?.order?.address?.streetAddress }}, {{ assignParcel?.order?.address?.city }}</strong>
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
  `,
  styles: [
    `
      .hub-layout {
        display: flex;
        min-height: 100vh;
        background: #f3f4f6;
      }

      .hub-sidebar {
        width: 260px;
        background: white;
        border-right: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        position: fixed;
        height: 100vh;
        z-index: 10;
      }
      .sidebar-header {
        padding: 20px;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .sidebar-header i {
        color: #ff6b35;
        font-size: 20px;
      }
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
      .sidebar-nav {
        flex: 1;
        padding: 12px 0;
        overflow-y: auto;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        font-size: 14px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.15s;
        text-decoration: none;
      }
      .nav-item:hover {
        background: #f9fafb;
        color: #1f2937;
      }
      .nav-item.active {
        background: #fff7ed;
        color: #ff6b35;
        font-weight: 600;
        border-right: 3px solid #ff6b35;
      }
      .nav-item i {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }
      .sidebar-footer {
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .back-btn,
      .logout-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        font-weight: 500;
      }
      .back-btn {
        background: #f3f4f6;
        color: #374151;
      }
      .back-btn:hover {
        background: #e5e7eb;
      }
      .logout-btn {
        background: #fef2f2;
        color: #dc2626;
      }
      .logout-btn:hover {
        background: #fee2e2;
      }

      .hub-main {
        flex: 1;
        margin-left: 260px;
      }
      .top-bar {
        background: white;
        padding: 20px 30px;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .top-bar h1 {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .breadcrumb {
        font-size: 13px;
        color: #6b7280;
        margin: 4px 0 0;
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

      .content-area {
        padding: 24px 30px;
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
      .form-group select {
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

      @media (max-width: 768px) {
        .hub-sidebar {
          width: 60px;
        }
        .hub-sidebar span,
        .hub-selector,
        .sidebar-header span {
          display: none;
        }
        .hub-main {
          margin-left: 60px;
        }
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private hubService: HubService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || user.userType !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadHubs();
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
    p._loading = true;
    this.hubService.receiveParcel(p.id).subscribe({
      next: (res: any) => {
        p._loading = false;
        if (res.success) {
          p.status = 'received_at_hub';
          p.trackingNumber = res.data.trackingNumber;
          p.qrCode = res.data.qrCode;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        p._loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  showDispatchModal(p: any) {
    this.dispatchParcel = p;
    this.selectedDriverId = '';
    this.showDispatch = true;
    if (p.hubId !== p.destinationHubId) {
      this.loadAvailableDrivers();
    }
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
    const driverId =
      this.dispatchParcel.hubId !== this.dispatchParcel.destinationHubId
        ? this.selectedDriverId
        : undefined;
    this.hubService.dispatchToHub(this.dispatchParcel.id, driverId).subscribe({
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
}
