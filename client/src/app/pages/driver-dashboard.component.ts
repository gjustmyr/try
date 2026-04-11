import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DriverService } from '../services/driver.service';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./seller-dashboard.component.css'],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="pi pi-car"></i>
          <span>Driver Panel</span>
        </div>
        <nav class="sidebar-nav">
          <a
            class="nav-item"
            [class.active]="activeTab === 'dashboard'"
            (click)="activeTab = 'dashboard'; loadStats()"
          >
            <i class="pi pi-home"></i><span>Dashboard</span>
          </a>
          <a
            class="nav-item"
            [class.active]="activeTab === 'deliveries'"
            (click)="activeTab = 'deliveries'; loadDeliveries()"
          >
            <i class="pi pi-truck"></i><span>My Deliveries</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="avail-toggle">
            <label class="toggle-label">
              <span>{{ profile?.isAvailable ? 'Available' : 'Unavailable' }}</span>
              <div
                class="toggle-switch"
                [class.on]="profile?.isAvailable"
                (click)="toggleAvailability()"
              >
                <div class="toggle-thumb"></div>
              </div>
            </label>
          </div>
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i><span>Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <main class="main-content">
        <!-- ===== DASHBOARD TAB ===== -->
        <div *ngIf="activeTab === 'dashboard'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>Welcome, {{ profile?.fullName }}</h1>
              <p class="breadcrumb">
                {{ profile?.hub?.name || 'No hub assigned' }} &mdash;
                {{ profile?.vehicleType | titlecase }}
              </p>
            </div>
          </header>
          <div class="dash-content">
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-icon total"><i class="pi pi-truck"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ driverStats.totalDeliveries }}</span
                  ><span class="stat-label">Total Deliveries</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon active"><i class="pi pi-bolt"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ driverStats.activeNow }}</span
                  ><span class="stat-label">Active Now</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon pending"><i class="pi pi-clock"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ driverStats.pendingPickup }}</span
                  ><span class="stat-label">Pending Pickup</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon today"><i class="pi pi-check-circle"></i></div>
                <div class="stat-info">
                  <span class="stat-val">{{ driverStats.completedToday }}</span
                  ><span class="stat-label">Completed Today</span>
                </div>
              </div>
            </div>

            <!-- Active delivery quick view -->
            <div class="active-delivery-card" *ngIf="activeDelivery">
              <h3><i class="pi pi-bolt"></i> Active Delivery</h3>
              <div class="ad-info">
                <div class="ad-row">
                  <strong>Tracking:</strong>
                  <span class="mono">{{ activeDelivery.trackingNumber }}</span>
                </div>
                <div class="ad-row">
                  <strong>Order:</strong>
                  <span class="mono">{{ activeDelivery.order?.orderNumber }}</span>
                </div>
                <div class="ad-row">
                  <strong>Customer:</strong> {{ activeDelivery.order?.user?.fullName }}
                </div>
                <div class="ad-row">
                  <strong>Destination:</strong> {{ activeDelivery.destinationAddress }}
                </div>
                <div class="ad-row">
                  <strong>Distance:</strong> {{ activeDelivery.distanceKm | number: '1.1-1' }} km
                </div>
                <div class="ad-row" *ngIf="activeDelivery.estimatedDelivery">
                  <strong>ETA:</strong>
                  {{ activeDelivery.estimatedDelivery | date: 'MMM d, h:mm a' }}
                </div>
              </div>
              <div class="ad-actions">
                <button
                  class="status-btn pickup"
                  *ngIf="activeDelivery.status === 'assigned'"
                  (click)="updateStatus(activeDelivery, 'picked_up')"
                >
                  <i class="pi pi-box"></i> Pick Up
                </button>
                <button
                  class="status-btn transit"
                  *ngIf="activeDelivery.status === 'picked_up'"
                  (click)="updateStatus(activeDelivery, 'in_transit')"
                >
                  <i class="pi pi-send"></i> Start Transit
                </button>
                <button
                  class="status-btn deliver"
                  *ngIf="activeDelivery.status === 'in_transit'"
                  (click)="updateStatus(activeDelivery, 'delivered')"
                >
                  <i class="pi pi-check"></i> Mark Delivered
                </button>
                <button
                  class="status-btn scan"
                  *ngIf="activeDelivery.status === 'out_for_delivery'"
                  (click)="openQRScanner(activeDelivery)"
                >
                  <i class="pi pi-qrcode"></i> Scan QR to Deliver
                </button>
                <button
                  class="status-btn fail"
                  *ngIf="
                    activeDelivery.status !== 'delivered' && activeDelivery.status !== 'failed'
                  "
                  (click)="updateStatus(activeDelivery, 'failed')"
                >
                  <i class="pi pi-times"></i> Failed
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== DELIVERIES TAB ===== -->
        <div *ngIf="activeTab === 'deliveries'">
          <header class="top-bar">
            <div class="top-bar-left">
              <h1>My Deliveries</h1>
              <p class="breadcrumb">Driver / Deliveries</p>
            </div>
          </header>
          <div class="tab-content">
            <div class="filter-bar">
              <button
                *ngFor="let f of statusFilters"
                [class.active]="statusFilter === f"
                (click)="statusFilter = f; loadDeliveries()"
              >
                {{ formatStatus(f) }}
              </button>
            </div>
            <div class="deliveries-list">
              <div
                class="delivery-card"
                *ngFor="let d of deliveryList"
                [class.is-active]="d.status === 'in_transit' || d.status === 'picked_up'"
              >
                <div class="dc-header">
                  <span class="mono">{{ d.trackingNumber }}</span>
                  <span class="status-chip" [attr.data-status]="d.status">{{
                    formatStatus(d.status)
                  }}</span>
                </div>
                <div class="dc-body">
                  <div class="dc-row">
                    <i class="pi pi-shopping-cart"></i> Order:
                    <strong class="mono">{{ d.order?.orderNumber }}</strong>
                  </div>
                  <div class="dc-row">
                    <i class="pi pi-user"></i> {{ d.order?.user?.fullName }} &middot;
                    {{ d.order?.user?.email }}
                  </div>
                  <div class="dc-row">
                    <i class="pi pi-map-marker"></i> {{ d.destinationAddress }}
                  </div>
                  <div class="dc-row" *ngIf="d.distanceKm">
                    <i class="pi pi-map"></i> {{ d.distanceKm | number: '1.1-1' }} km
                  </div>
                  <div class="dc-row" *ngIf="d.estimatedDelivery">
                    <i class="pi pi-clock"></i> ETA:
                    {{ d.estimatedDelivery | date: 'MMM d, h:mm a' }}
                  </div>
                  <div class="dc-row" *ngIf="d.hub">
                    <i class="pi pi-building"></i> Hub: {{ d.hub?.name }}
                  </div>
                </div>
                <div class="dc-actions" *ngIf="d.status !== 'delivered' && d.status !== 'failed'">
                  <button
                    class="status-btn pickup"
                    *ngIf="d.status === 'assigned'"
                    (click)="updateStatus(d, 'picked_up')"
                  >
                    <i class="pi pi-box"></i> Pick Up
                  </button>
                  <button
                    class="status-btn transit"
                    *ngIf="d.status === 'picked_up'"
                    (click)="updateStatus(d, 'in_transit')"
                  >
                    <i class="pi pi-send"></i> In Transit
                  </button>
                  <button
                    class="status-btn deliver"
                    *ngIf="d.status === 'in_transit'"
                    (click)="updateStatus(d, 'delivered')"
                  >
                    <i class="pi pi-check"></i> Delivered
                  </button>
                  <button
                    class="status-btn scan"
                    *ngIf="d.status === 'out_for_delivery'"
                    (click)="openQRScanner(d)"
                  >
                    <i class="pi pi-qrcode"></i> Scan QR to Deliver
                  </button>
                  <button class="status-btn fail" (click)="updateStatus(d, 'failed')">
                    <i class="pi pi-times"></i> Failed
                  </button>
                </div>
              </div>
              <div class="empty-state" *ngIf="deliveryList.length === 0">
                <i class="pi pi-truck"></i>
                <p>No deliveries found</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- QR Scanner Modal -->
    <div class="modal-overlay" *ngIf="showQRScanner">
      <div class="modal-box qr-modal">
        <div class="qr-header">
          <h3><i class="pi pi-qrcode"></i> Scan Parcel QR Code</h3>
          <button class="close-btn" (click)="closeQRScanner()"><i class="pi pi-times"></i></button>
        </div>
        <p class="qr-instruction">
          Point your camera at the QR code on the parcel to confirm delivery.
        </p>
        <div id="qr-reader" class="qr-reader-box"></div>
        <div class="qr-manual">
          <p>Or enter QR data manually:</p>
          <div class="manual-input-row">
            <input
              type="text"
              [(ngModel)]="manualQRInput"
              placeholder="Paste QR code data..."
              class="manual-qr-input"
            />
            <button
              class="status-btn scan"
              (click)="submitManualQR()"
              [disabled]="!manualQRInput.trim() || scanning"
            >
              <i class="pi pi-check"></i> Submit
            </button>
          </div>
        </div>
        <div class="qr-status scanning" *ngIf="scanning">
          <i class="pi pi-spin pi-spinner"></i> Verifying...
        </div>
      </div>
    </div>

    <!-- Scan Result Modal -->
    <div class="modal-overlay" *ngIf="showScanResult">
      <div class="modal-box">
        <div class="modal-icon" [attr.data-type]="scanSuccess ? 'success' : 'danger'">
          <i [class]="scanSuccess ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        </div>
        <h3>{{ scanSuccess ? 'Delivery Confirmed!' : 'Scan Failed' }}</h3>
        <p>{{ scanResultMessage }}</p>
        <div class="modal-actions">
          <button class="modal-btn primary" (click)="closeScanResult()">OK</button>
        </div>
      </div>
    </div>
  `,
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  profile: any = null;
  driverStats: any = { totalDeliveries: 0, activeNow: 0, pendingPickup: 0, completedToday: 0 };
  deliveryList: any[] = [];
  statusFilter = 'all';
  statusFilters = [
    'all',
    'assigned',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'at_destination_hub',
    'delivered',
    'failed',
  ];
  activeDelivery: any = null;

  // QR Scanner state
  showQRScanner = false;
  scanningDelivery: any = null;
  manualQRInput = '';
  scanning = false;
  showScanResult = false;
  scanSuccess = false;
  scanResultMessage = '';
  private html5QrCode: any = null;

  private locationInterval: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private driverService: DriverService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user || user.userType !== 'driver') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
    this.loadStats();
    this.startLocationTracking();
  }

  ngOnDestroy() {
    if (this.locationInterval) clearInterval(this.locationInterval);
  }

  loadProfile() {
    this.driverService.getProfile().subscribe({
      next: (res: any) => {
        if (res.success) this.profile = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  loadStats() {
    this.driverService.getStats().subscribe({
      next: (res: any) => {
        if (res.success) this.driverStats = res.data;
        this.cdr.detectChanges();
      },
    });
    // Load active delivery
    this.driverService.getDeliveries('in_transit').subscribe({
      next: (res: any) => {
        if (res.success && res.data.length > 0) {
          this.activeDelivery = res.data[0];
        } else {
          // Check out_for_delivery
          this.driverService.getDeliveries('out_for_delivery').subscribe({
            next: (res1b: any) => {
              if (res1b.success && res1b.data.length > 0) {
                this.activeDelivery = res1b.data[0];
              } else {
                // Check picked_up ones
                this.driverService.getDeliveries('picked_up').subscribe({
                  next: (res2: any) => {
                    if (res2.success && res2.data.length > 0) {
                      this.activeDelivery = res2.data[0];
                    } else {
                      this.driverService.getDeliveries('assigned').subscribe({
                        next: (res3: any) => {
                          if (res3.success && res3.data.length > 0)
                            this.activeDelivery = res3.data[0];
                          this.cdr.detectChanges();
                        },
                      });
                    }
                    this.cdr.detectChanges();
                  },
                });
              }
              this.cdr.detectChanges();
            },
          });
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadDeliveries() {
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;
    this.driverService.getDeliveries(status).subscribe({
      next: (res: any) => {
        if (res.success) this.deliveryList = res.data;
        this.cdr.detectChanges();
      },
    });
  }

  updateStatus(delivery: any, newStatus: string) {
    const notes = newStatus === 'failed' ? prompt('Reason for failure:') || '' : '';
    this.driverService.updateDeliveryStatus(delivery.id, newStatus, notes).subscribe({
      next: (res: any) => {
        if (res.success) {
          delivery.status = newStatus;
          if (newStatus === 'delivered' || newStatus === 'failed') {
            if (this.activeDelivery?.id === delivery.id) this.activeDelivery = null;
          }
          this.loadStats();
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => alert(err.error?.message || 'Status update failed'),
    });
  }

  toggleAvailability() {
    this.driverService.toggleAvailability().subscribe({
      next: (res: any) => {
        if (res.success && this.profile) {
          this.profile.isAvailable = res.data.isAvailable;
          this.cdr.detectChanges();
        }
      },
    });
  }

  startLocationTracking() {
    if (!navigator.geolocation) return;
    this.locationInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.driverService.updateLocation(pos.coords.latitude, pos.coords.longitude).subscribe();
        },
        () => {},
        { enableHighAccuracy: true },
      );
    }, 30000); // every 30 seconds

    // Also fire immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.driverService.updateLocation(pos.coords.latitude, pos.coords.longitude).subscribe();
      },
      () => {},
    );
  }

  formatStatus(status: string): string {
    if (status === 'all') return 'All';
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async openQRScanner(delivery: any) {
    this.scanningDelivery = delivery;
    this.showQRScanner = true;
    this.manualQRInput = '';
    this.scanning = false;
    this.cdr.detectChanges();

    // Initialize html5-qrcode after DOM renders
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        this.html5QrCode = new Html5Qrcode('qr-reader');
        await this.html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => this.onQRScanSuccess(decodedText),
          () => {},
        );
      } catch (err) {
        console.warn('Camera not available, use manual input');
      }
    }, 300);
  }

  async closeQRScanner() {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
      } catch (_) {}
      this.html5QrCode = null;
    }
    this.showQRScanner = false;
    this.scanningDelivery = null;
    this.manualQRInput = '';
    this.cdr.detectChanges();
  }

  onQRScanSuccess(decodedText: string) {
    if (this.scanning) return;
    this.processQRData(decodedText);
  }

  submitManualQR() {
    if (!this.manualQRInput.trim()) return;
    this.processQRData(this.manualQRInput.trim());
  }

  async processQRData(qrData: string) {
    this.scanning = true;
    this.cdr.detectChanges();

    // Stop camera while processing
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
      } catch (_) {}
    }

    this.driverService.scanDelivery(qrData).subscribe({
      next: (res: any) => {
        this.scanning = false;
        this.showQRScanner = false;
        this.html5QrCode = null;
        if (res.success) {
          this.scanSuccess = true;
          this.scanResultMessage =
            'Parcel delivered successfully! Tracking: ' + (res.data?.trackingNumber || '');
          // Update local delivery status
          if (this.scanningDelivery) this.scanningDelivery.status = 'delivered';
          if (this.activeDelivery?.id === this.scanningDelivery?.id) this.activeDelivery = null;
          this.loadStats();
        } else {
          this.scanSuccess = false;
          this.scanResultMessage = res.message || 'Verification failed.';
        }
        this.showScanResult = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.scanning = false;
        this.showQRScanner = false;
        this.html5QrCode = null;
        this.scanSuccess = false;
        this.scanResultMessage = err.error?.message || 'QR scan verification failed.';
        this.showScanResult = true;
        this.cdr.detectChanges();
      },
    });
  }

  closeScanResult() {
    this.showScanResult = false;
    this.scanSuccess = false;
    this.scanResultMessage = '';
    this.scanningDelivery = null;
    this.cdr.detectChanges();
  }

  logout() {
    this.authService.logout();
  }
}
