import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../services/delivery.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tracking-page">
      <header class="tracking-header">
        <div class="header-inner">
          <button class="back-btn" (click)="goBack()"><i class="pi pi-arrow-left"></i></button>
          <div>
            <h1>Order Tracking</h1>
            <p class="sub" *ngIf="tracking">{{ tracking.trackingNumber }}</p>
          </div>
        </div>
      </header>

      <div class="loading" *ngIf="loading"><i class="pi pi-spin pi-spinner"></i> Loading tracking info...</div>
      <div class="error-box" *ngIf="error">{{ error }}</div>

      <div class="tracking-body" *ngIf="tracking && !loading">
        <div class="map-container">
          <div id="trackingMap" class="map"></div>
        </div>

        <div class="info-panel">
          <!-- Status Timeline -->
          <div class="timeline">
            <div class="tl-item" *ngFor="let step of timeline" [class.active]="step.active" [class.done]="step.done">
              <div class="tl-dot"><i [class]="step.icon"></i></div>
              <div class="tl-content">
                <span class="tl-label">{{ step.label }}</span>
                <span class="tl-time" *ngIf="step.time">{{ step.time | date:'MMM d, h:mm a' }}</span>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div class="detail-section">
            <h3>Delivery Details</h3>
            <div class="detail-row"><span class="dl">Status</span><span class="dv"><span class="status-chip" [attr.data-status]="tracking.status">{{ formatStatus(tracking.status) }}</span></span></div>
            <div class="detail-row" *ngIf="tracking.distanceKm"><span class="dl">Distance</span><span class="dv">{{ tracking.distanceKm | number:'1.1-1' }} km</span></div>
            <div class="detail-row" *ngIf="tracking.estimatedDelivery"><span class="dl">Estimated Delivery</span><span class="dv eta">{{ tracking.estimatedDelivery | date:'MMM d, yyyy h:mm a' }}</span></div>
            <div class="detail-row"><span class="dl">Destination</span><span class="dv">{{ tracking.destinationAddress }}</span></div>
          </div>

          <!-- Driver Info -->
          <div class="detail-section" *ngIf="tracking.driver">
            <h3>Driver</h3>
            <div class="detail-row"><span class="dl">Name</span><span class="dv">{{ tracking.driver.fullName }}</span></div>
            <div class="detail-row"><span class="dl">Phone</span><span class="dv">{{ tracking.driver.phone }}</span></div>
            <div class="detail-row"><span class="dl">Vehicle</span><span class="dv">{{ tracking.driver.vehicleType | titlecase }} &middot; {{ tracking.driver.plateNumber }}</span></div>
          </div>

          <!-- Hub Info -->
          <div class="detail-section" *ngIf="tracking.hub">
            <h3>Pickup Hub</h3>
            <div class="detail-row"><span class="dl">Hub</span><span class="dv">{{ tracking.hub.name }}</span></div>
            <div class="detail-row"><span class="dl">Address</span><span class="dv">{{ tracking.hub.address }}, {{ tracking.hub.city }}</span></div>
          </div>

          <!-- Order Info -->
          <div class="detail-section" *ngIf="tracking.order">
            <h3>Order</h3>
            <div class="detail-row"><span class="dl">Order #</span><span class="dv mono">{{ tracking.order.orderNumber }}</span></div>
            <div class="detail-row"><span class="dl">Total</span><span class="dv">₱{{ tracking.order.totalAmount | number:'1.2-2' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-page { min-height: 100vh; background: #f9fafb; }
    .tracking-header { background: white; border-bottom: 1px solid #e5e7eb; padding: 20px 24px; }
    .header-inner { display: flex; align-items: center; gap: 16px; max-width: 1200px; margin: 0 auto; }
    .back-btn { background: #f3f4f6; border: none; width: 40px; height: 40px; border-radius: 10px; font-size: 16px; cursor: pointer; color: #374151; display: flex; align-items: center; justify-content: center; }
    .back-btn:hover { background: #e5e7eb; }
    .tracking-header h1 { font-size: 20px; font-weight: 700; color: #1f2937; margin: 0; }
    .sub { font-size: 13px; color: #6b7280; margin: 2px 0 0; font-family: monospace; }

    .loading { text-align: center; padding: 60px 20px; color: #6b7280; font-size: 15px; }
    .loading i { margin-right: 8px; }
    .error-box { max-width: 600px; margin: 40px auto; padding: 20px; background: #fee2e2; color: #991b1b; border-radius: 10px; text-align: center; }

    .tracking-body { display: grid; grid-template-columns: 1fr 420px; max-width: 1200px; margin: 0 auto; gap: 0; min-height: calc(100vh - 90px); }
    .map-container { position: relative; }
    .map { width: 100%; height: 100%; min-height: 500px; }

    .info-panel { background: white; border-left: 1px solid #e5e7eb; padding: 24px; overflow-y: auto; max-height: calc(100vh - 90px); }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; gap: 0; margin-bottom: 28px; position: relative; padding-left: 20px; }
    .tl-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; position: relative; }
    .tl-item::before { content: ''; position: absolute; left: -14px; top: 32px; bottom: -12px; width: 2px; background: #e5e7eb; }
    .tl-item:last-child::before { display: none; }
    .tl-item.done::before { background: #22c55e; }
    .tl-dot { width: 28px; height: 28px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #9ca3af; position: relative; z-index: 1; flex-shrink: 0; border: 2px solid #e5e7eb; }
    .tl-item.done .tl-dot { background: #dcfce7; color: #22c55e; border-color: #22c55e; }
    .tl-item.active .tl-dot { background: #ff6b35; color: white; border-color: #ff6b35; animation: pulse 2s infinite; }
    .tl-content { display: flex; flex-direction: column; }
    .tl-label { font-size: 14px; font-weight: 600; color: #374151; }
    .tl-item.active .tl-label { color: #ff6b35; }
    .tl-time { font-size: 12px; color: #9ca3af; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); } 50% { box-shadow: 0 0 0 8px rgba(255,107,53,0); } }

    /* Detail Sections */
    .detail-section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #f3f4f6; }
    .detail-section:last-child { border-bottom: none; }
    .detail-section h3 { font-size: 14px; font-weight: 600; color: #1f2937; margin: 0 0 12px; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; gap: 16px; }
    .dl { color: #6b7280; flex-shrink: 0; }
    .dv { color: #1f2937; font-weight: 500; text-align: right; }
    .dv.eta { color: #ff6b35; font-weight: 600; }
    .mono { font-family: monospace; font-weight: 600; }

    .status-chip { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
    .status-chip[data-status="assigned"] { background: #fef3c7; color: #92400e; }
    .status-chip[data-status="picked_up"] { background: #dbeafe; color: #1e40af; }
    .status-chip[data-status="in_transit"] { background: #e0e7ff; color: #3730a3; }
    .status-chip[data-status="delivered"] { background: #dcfce7; color: #166534; }
    .status-chip[data-status="failed"] { background: #fee2e2; color: #991b1b; }

    @media (max-width: 900px) {
      .tracking-body { grid-template-columns: 1fr; }
      .map { min-height: 350px; }
      .info-panel { max-height: none; border-left: none; border-top: 1px solid #e5e7eb; }
    }
  `],
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  tracking: any = null;
  loading = true;
  error = '';
  timeline: any[] = [];

  private map: any = null;
  private driverMarker: any = null;
  private destMarker: any = null;
  private routeLine: any = null;
  private refreshInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (!orderId) {
      this.error = 'No order ID provided';
      this.loading = false;
      return;
    }
    this.loadTracking(orderId);
    // Refresh every 15 seconds for real-time updates
    this.refreshInterval = setInterval(() => this.loadTracking(orderId, true), 15000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.map) this.map.remove();
  }

  loadTracking(orderId: string, silent = false) {
    if (!silent) this.loading = true;
    this.deliveryService.getTracking(orderId).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.tracking = res.data;
          this.buildTimeline();
          setTimeout(() => this.initOrUpdateMap(), 100);
        } else {
          this.error = res.message || 'Tracking not available';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.message || 'No tracking information found for this order';
        this.cdr.detectChanges();
      },
    });
  }

  buildTimeline() {
    if (!this.tracking) return;
    const status = this.tracking.status;
    const steps = [
      { key: 'assigned', label: 'Order Assigned', icon: 'pi pi-box', time: this.tracking.createdAt },
      { key: 'picked_up', label: 'Picked Up from Hub', icon: 'pi pi-check', time: this.tracking.pickedUpAt },
      { key: 'in_transit', label: 'In Transit', icon: 'pi pi-truck', time: null },
      { key: 'delivered', label: 'Delivered', icon: 'pi pi-home', time: this.tracking.deliveredAt },
    ];
    const order = ['assigned', 'picked_up', 'in_transit', 'delivered'];
    const currentIdx = order.indexOf(status);

    this.timeline = steps.map((s, i) => ({
      ...s,
      done: i < currentIdx,
      active: i === currentIdx,
    }));

    if (status === 'failed') {
      this.timeline.push({ key: 'failed', label: 'Delivery Failed', icon: 'pi pi-times', time: null, done: false, active: true });
    }
  }

  initOrUpdateMap() {
    if (!this.tracking) return;

    const destLat = this.tracking.destinationLatitude;
    const destLng = this.tracking.destinationLongitude;
    const driverLat = this.tracking.currentLatitude || this.tracking.driver?.currentLatitude;
    const driverLng = this.tracking.currentLongitude || this.tracking.driver?.currentLongitude;

    if (!destLat || !destLng) return;

    // Initialize map once
    if (!this.map) {
      this.map = L.map('trackingMap').setView([destLat, destLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
    }

    // Destination marker
    const destIcon = L.divIcon({
      html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (!this.destMarker) {
      this.destMarker = L.marker([destLat, destLng], { icon: destIcon })
        .addTo(this.map)
        .bindPopup('<b>Destination</b><br>' + (this.tracking.destinationAddress || ''));
    }

    // Driver marker
    if (driverLat && driverLng) {
      const driverIcon = L.divIcon({
        html: '<div style="background:#ff6b35;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>',
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (this.driverMarker) {
        this.driverMarker.setLatLng([driverLat, driverLng]);
      } else {
        this.driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(this.map)
          .bindPopup('<b>Driver</b><br>' + (this.tracking.driver?.fullName || ''));
      }

      // Route line
      const lineCoords = [[driverLat, driverLng], [destLat, destLng]];
      if (this.routeLine) {
        this.routeLine.setLatLngs(lineCoords);
      } else {
        this.routeLine = L.polyline(lineCoords, {
          color: '#ff6b35',
          weight: 3,
          dashArray: '8, 8',
          opacity: 0.8,
        }).addTo(this.map);
      }

      // Fit both points
      const bounds = L.latLngBounds([[driverLat, driverLng], [destLat, destLng]]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  formatStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
