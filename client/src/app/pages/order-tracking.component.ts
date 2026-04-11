import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../services/delivery.service';
import { OrderService } from '../services/order.service';
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
            <p class="sub" *ngIf="!tracking && orderData?.trackingNumber">
              {{ orderData.trackingNumber }}
            </p>
          </div>
        </div>
      </header>

      <div class="loading" *ngIf="loading">
        <i class="pi pi-spin pi-spinner"></i> Loading tracking info...
      </div>
      <div class="error-box" *ngIf="error">{{ error }}</div>

      <!-- Delivery-based tracking (driver/hub) -->
      <div class="tracking-body" *ngIf="tracking && !loading">
        <div class="map-container">
          <div id="trackingMap" class="map"></div>
          <!-- Route Info Overlay -->
          <div class="route-overlay" *ngIf="routeLabel">
            <div class="route-badge">
              <i class="pi" [ngClass]="{
                'pi-arrows-h': routeLabel === 'Hub to Hub Transfer',
                'pi-truck': routeLabel === 'Last-Mile Delivery',
                'pi-clock': routeLabel === 'Awaiting Rider Assignment'
              }"></i>
              <span class="route-badge-label">{{ routeLabel }}</span>
            </div>
            <div class="route-stats" *ngIf="routeDistance > 0">
              <span class="route-stat"><i class="pi pi-map"></i> {{ routeDistance | number: '1.1-1' }} km</span>
              <span class="route-stat" *ngIf="routeEta"><i class="pi pi-clock"></i> {{ routeEta }}</span>
            </div>
          </div>
        </div>

        <div class="info-panel">
          <!-- Status Timeline -->
          <div class="timeline">
            <div
              class="tl-item"
              *ngFor="let step of timeline"
              [class.active]="step.active"
              [class.done]="step.done"
            >
              <div class="tl-dot"><i [class]="step.icon"></i></div>
              <div class="tl-content">
                <span class="tl-label">{{ step.label }}</span>
                <span class="tl-time" *ngIf="step.time">{{
                  step.time | date: 'MMM d, h:mm a'
                }}</span>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div class="detail-section">
            <h3>Delivery Details</h3>
            <div class="detail-row">
              <span class="dl">Status</span
              ><span class="dv"
                ><span class="status-chip" [attr.data-status]="tracking.status">{{
                  formatStatus(tracking.status)
                }}</span></span
              >
            </div>
            <div class="detail-row" *ngIf="routeDistance > 0">
              <span class="dl">Route Distance</span
              ><span class="dv">{{ routeDistance | number: '1.1-1' }} km</span>
            </div>
            <div class="detail-row" *ngIf="routeEta">
              <span class="dl">ETA</span
              ><span class="dv eta">{{ routeEta }}</span>
            </div>
            <div class="detail-row" *ngIf="tracking.estimatedDelivery">
              <span class="dl">Estimated Delivery</span
              ><span class="dv eta">{{
                tracking.estimatedDelivery | date: 'MMM d, yyyy h:mm a'
              }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Destination</span
              ><span class="dv">{{ tracking.destinationAddress }}</span>
            </div>
          </div>

          <!-- Current Route Section -->
          <div class="detail-section route-info-section" *ngIf="routeLabel">
            <h3><i class="pi pi-directions"></i> Current Route</h3>
            <div class="route-from-to">
              <div class="route-point">
                <span class="route-dot from"></span>
                <div>
                  <span class="route-point-label">From</span>
                  <span class="route-point-name" *ngIf="isHubToHub()">{{ tracking.hub?.name }}</span>
                  <span class="route-point-name" *ngIf="!isHubToHub()">{{ tracking.destinationHub?.name || 'Hub' }}</span>
                </div>
              </div>
              <div class="route-line-indicator"></div>
              <div class="route-point">
                <span class="route-dot to"></span>
                <div>
                  <span class="route-point-label">To</span>
                  <span class="route-point-name" *ngIf="isHubToHub()">{{ tracking.destinationHub?.name }}</span>
                  <span class="route-point-name" *ngIf="!isHubToHub()">Customer Address</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Driver Info -->
          <div class="detail-section" *ngIf="tracking.driver">
            <h3>Driver</h3>
            <div class="detail-row">
              <span class="dl">Name</span><span class="dv">{{ tracking.driver.fullName }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Phone</span><span class="dv">{{ tracking.driver.phone }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Vehicle</span
              ><span class="dv"
                >{{ tracking.driver.vehicleType | titlecase }} &middot;
                {{ tracking.driver.plateNumber }}</span
              >
            </div>
          </div>

          <!-- Hub Info -->
          <div class="detail-section" *ngIf="tracking.hub">
            <h3>Origin Hub</h3>
            <div class="detail-row">
              <span class="dl">Hub</span><span class="dv">{{ tracking.hub.name }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Address</span
              ><span class="dv">{{ tracking.hub.address }}, {{ tracking.hub.city }}, {{ tracking.hub.province }}</span>
            </div>
          </div>

          <!-- Destination Hub Info -->
          <div class="detail-section" *ngIf="tracking.destinationHub">
            <h3>Destination Hub</h3>
            <div class="detail-row">
              <span class="dl">Hub</span><span class="dv">{{ tracking.destinationHub.name }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Address</span
              ><span class="dv"
                >{{ tracking.destinationHub.address }}, {{ tracking.destinationHub.city }}, {{ tracking.destinationHub.province }}</span
              >
            </div>
          </div>

          <!-- Order Info -->
          <div class="detail-section" *ngIf="tracking.order">
            <h3>Order</h3>
            <div class="detail-row">
              <span class="dl">Order #</span
              ><span class="dv mono">{{ tracking.order.orderNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Total</span
              ><span class="dv">₱{{ tracking.order.total | number: '1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Order-based tracking (no delivery record) -->
      <div class="order-tracking-body" *ngIf="!tracking && orderData && !loading && !error">
        <!-- Shipping Map -->
        <div class="shipping-map-card" *ngIf="hasMapData()">
          <div class="map-header">
            <h3><i class="pi pi-map"></i> Shipping Route</h3>
            <div class="map-legend">
              <span class="legend-item"
                ><span class="legend-dot origin"></span> {{ getSellerName() }}</span
              >
              <span class="legend-item"><span class="legend-dot dest"></span> Your Address</span>
            </div>
          </div>
          <div id="orderTrackingMap" class="order-map"></div>
          <div class="map-footer" *ngIf="shippingDistance">
            <i class="pi pi-arrows-h"></i>
            <span
              >Estimated distance:
              <strong>{{ shippingDistance | number: '1.1-1' }} km</strong></span
            >
          </div>
        </div>

        <div class="order-tracking-card">
          <!-- Order Status Timeline -->
          <div class="timeline">
            <div
              class="tl-item"
              *ngFor="let step of orderTimeline"
              [class.active]="step.active"
              [class.done]="step.done"
            >
              <div class="tl-dot"><i [class]="step.icon"></i></div>
              <div class="tl-content">
                <span class="tl-label">{{ step.label }}</span>
              </div>
            </div>
          </div>

          <!-- ETA Prediction Banner -->
          <div
            class="eta-prediction"
            *ngIf="orderData.status !== 'delivered' && orderData.status !== 'cancelled'"
          >
            <div class="eta-icon-box" [attr.data-status]="orderData.status">
              <i [class]="getStatusIcon(orderData.status)"></i>
            </div>
            <div class="eta-text">
              <span class="eta-message">{{ getStatusMessage(orderData.status) }}</span>
              <span class="eta-date" *ngIf="orderData.estimatedDelivery">
                Estimated arrival:
                <strong>{{ orderData.estimatedDelivery | date: 'EEEE, MMMM d, yyyy' }}</strong>
                <span class="eta-countdown">{{ getDaysUntil(orderData.estimatedDelivery) }}</span>
              </span>
            </div>
          </div>
          <div class="eta-prediction delivered" *ngIf="orderData.status === 'delivered'">
            <div class="eta-icon-box" data-status="delivered">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="eta-text">
              <span class="eta-message">Your order has been delivered!</span>
            </div>
          </div>

          <!-- Tracking Info -->
          <div class="detail-section" *ngIf="orderData.trackingNumber">
            <h3>Tracking Information</h3>
            <div class="tracking-number-display">
              <i class="pi pi-barcode"></i>
              <span>{{ orderData.trackingNumber }}</span>
            </div>
          </div>

          <!-- Order Details -->
          <div class="detail-section">
            <h3>Order Details</h3>
            <div class="detail-row">
              <span class="dl">Order #</span
              ><span class="dv mono">{{ orderData.orderNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Status</span
              ><span class="dv"
                ><span class="status-chip" [attr.data-status]="orderData.status">{{
                  orderData.status | titlecase
                }}</span></span
              >
            </div>
            <div class="detail-row">
              <span class="dl">Total</span
              ><span class="dv">₱{{ orderData.total | number: '1.2-2' }}</span>
            </div>
          </div>

          <!-- Delivery Address -->
          <div class="detail-section" *ngIf="orderData.address">
            <h3>Delivery Address</h3>
            <div class="detail-row">
              <span class="dl">Name</span><span class="dv">{{ orderData.address.fullName }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Phone</span><span class="dv">{{ orderData.address.phone }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Address</span
              ><span class="dv"
                >{{ orderData.address.streetAddress }}, {{ orderData.address.barangay }},
                {{ orderData.address.city }}, {{ orderData.address.province }}</span
              >
            </div>
          </div>

          <!-- Items -->
          <div class="detail-section">
            <h3>Items</h3>
            <div class="tracking-item" *ngFor="let item of orderData.items">
              <div class="ti-img">
                <img *ngIf="item.productImage?.url" [src]="item.productImage.url" />
                <div *ngIf="!item.productImage?.url" class="ti-placeholder">
                  <i class="pi pi-image"></i>
                </div>
              </div>
              <div class="ti-info">
                <span class="ti-name">{{ item.productName }}</span>
                <span class="ti-seller" *ngIf="item.seller">{{ item.seller.shopName }}</span>
              </div>
              <div class="ti-qty">x{{ item.quantity }}</div>
              <div class="ti-price">₱{{ item.price * item.quantity | number: '1.2-2' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tracking-page {
        min-height: 100vh;
        background: #f9fafb;
      }
      .tracking-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 20px 24px;
      }
      .header-inner {
        display: flex;
        align-items: center;
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .back-btn {
        background: #f3f4f6;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        font-size: 16px;
        cursor: pointer;
        color: #374151;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .back-btn:hover {
        background: #e5e7eb;
      }
      .tracking-header h1 {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      .sub {
        font-size: 13px;
        color: #6b7280;
        margin: 2px 0 0;
        font-family: monospace;
      }

      .loading {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
        font-size: 15px;
      }
      .loading i {
        margin-right: 8px;
      }
      .error-box {
        max-width: 600px;
        margin: 40px auto;
        padding: 20px;
        background: #fee2e2;
        color: #991b1b;
        border-radius: 10px;
        text-align: center;
      }

      .tracking-body {
        display: grid;
        grid-template-columns: 1fr 420px;
        max-width: 1200px;
        margin: 0 auto;
        gap: 0;
        min-height: calc(100vh - 90px);
      }
      .map-container {
        position: relative;
      }
      .map {
        width: 100%;
        height: 100%;
        min-height: 500px;
      }

      /* Route Overlay on Map */
      .route-overlay {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .route-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        padding: 8px 14px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
      }
      .route-badge i { color: #ff6b35; }
      .route-stats {
        display: flex;
        gap: 12px;
        background: white;
        padding: 6px 14px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .route-stat {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
      .route-stat i { font-size: 12px; color: #ff6b35; }

      /* Route Info Section in Panel */
      .route-info-section h3 {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .route-info-section h3 i { color: #ff6b35; font-size: 14px; }
      .route-from-to {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 8px 0;
      }
      .route-point {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 0;
      }
      .route-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 2px solid white;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
      }
      .route-dot.from { background: #6366f1; }
      .route-dot.to { background: #ef4444; }
      .route-point-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #9ca3af;
        font-weight: 600;
        display: block;
      }
      .route-point-name {
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        display: block;
      }
      .route-line-indicator {
        width: 2px;
        height: 16px;
        background: #e5e7eb;
        margin-left: 5px;
      }

      .info-panel {
        background: white;
        border-left: 1px solid #e5e7eb;
        padding: 24px;
        overflow-y: auto;
        max-height: calc(100vh - 90px);
      }

      /* Timeline */
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-bottom: 28px;
        position: relative;
        padding-left: 20px;
      }
      .tl-item {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 12px 0;
        position: relative;
      }
      .tl-item::before {
        content: '';
        position: absolute;
        left: -14px;
        top: 32px;
        bottom: -12px;
        width: 2px;
        background: #e5e7eb;
      }
      .tl-item:last-child::before {
        display: none;
      }
      .tl-item.done::before {
        background: #22c55e;
      }
      .tl-dot {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #9ca3af;
        position: relative;
        z-index: 1;
        flex-shrink: 0;
        border: 2px solid #e5e7eb;
      }
      .tl-item.done .tl-dot {
        background: #dcfce7;
        color: #22c55e;
        border-color: #22c55e;
      }
      .tl-item.active .tl-dot {
        background: #ff6b35;
        color: white;
        border-color: #ff6b35;
        animation: pulse 2s infinite;
      }
      .tl-content {
        display: flex;
        flex-direction: column;
      }
      .tl-label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
      .tl-item.active .tl-label {
        color: #ff6b35;
      }
      .tl-time {
        font-size: 12px;
        color: #9ca3af;
      }
      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(255, 107, 53, 0);
        }
      }

      /* Detail Sections */
      .detail-section {
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #f3f4f6;
      }
      .detail-section:last-child {
        border-bottom: none;
      }
      .detail-section h3 {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 12px;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
        gap: 16px;
      }
      .dl {
        color: #6b7280;
        flex-shrink: 0;
      }
      .dv {
        color: #1f2937;
        font-weight: 500;
        text-align: right;
      }
      .dv.eta {
        color: #ff6b35;
        font-weight: 600;
      }
      .mono {
        font-family: monospace;
        font-weight: 600;
      }

      .status-chip {
        font-size: 12px;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 20px;
      }
      .status-chip[data-status='assigned'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status-chip[data-status='picked_up'] {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-chip[data-status='in_transit'] {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-chip[data-status='delivered'] {
        background: #dcfce7;
        color: #166534;
      }
      .status-chip[data-status='failed'] {
        background: #fee2e2;
        color: #991b1b;
      }

      @media (max-width: 900px) {
        .tracking-body {
          grid-template-columns: 1fr;
        }
        .map {
          min-height: 350px;
        }
        .info-panel {
          max-height: none;
          border-left: none;
          border-top: 1px solid #e5e7eb;
        }
      }

      /* Order-based tracking */
      .order-tracking-body {
        max-width: 700px;
        margin: 24px auto;
        padding: 0 16px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .order-tracking-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        padding: 32px;
      }

      /* Shipping Map */
      .shipping-map-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
      }
      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
      }
      .map-header h3 {
        font-size: 15px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .map-header h3 i {
        color: #ff6b35;
      }
      .map-legend {
        display: flex;
        gap: 16px;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
      }
      .legend-dot.origin {
        background: #ff6b35;
      }
      .legend-dot.dest {
        background: #ef4444;
      }
      .order-map {
        width: 100%;
        height: 350px;
      }
      .map-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: #f9fafb;
        border-top: 1px solid #f3f4f6;
        font-size: 13px;
        color: #6b7280;
      }
      .map-footer i {
        color: #ff6b35;
      }
      .map-footer strong {
        color: #1f2937;
      }

      .tracking-number-display {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #f5f3ff;
        border: 1px solid #ddd6fe;
        border-radius: 12px;
        padding: 16px 20px;
        font-size: 20px;
        font-weight: 700;
        color: #5b21b6;
        font-family: monospace;
        letter-spacing: 1px;
      }
      .tracking-number-display i {
        font-size: 24px;
        color: #7c3aed;
      }

      .tracking-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .ti-img {
        width: 44px;
        height: 44px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;
      }
      .ti-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ti-placeholder {
        width: 100%;
        height: 100%;
        background: #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
      }
      .ti-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .ti-name {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
      }
      .ti-seller {
        font-size: 12px;
        color: #6b7280;
      }
      .ti-qty {
        font-size: 13px;
        color: #6b7280;
        width: 40px;
        text-align: center;
      }
      .ti-price {
        font-size: 14px;
        font-weight: 600;
        color: #ff6b35;
        width: 90px;
        text-align: right;
      }

      .status-chip[data-status='pending'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status-chip[data-status='confirmed'] {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-chip[data-status='processing'] {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-chip[data-status='pending_drop_off'] {
        background: #fff7ed;
        color: #c2410c;
      }
      .status-chip[data-status='shipped'] {
        background: #fce7f3;
        color: #9d174d;
      }
      .status-chip[data-status='received_at_hub'] {
        background: #ecfdf5;
        color: #065f46;
      }
      .status-chip[data-status='in_transit'] {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-chip[data-status='at_destination_hub'] {
        background: #fdf4ff;
        color: #86198f;
      }
      .status-chip[data-status='out_for_delivery'] {
        background: #f0fdf4;
        color: #15803d;
      }
      .status-chip[data-status='delivered'] {
        background: #dcfce7;
        color: #166534;
      }
      .status-chip[data-status='cancelled'] {
        background: #fee2e2;
        color: #991b1b;
      }
      .status-chip[data-status='failed'] {
        background: #fee2e2;
        color: #991b1b;
      }

      /* ETA Prediction Banner */
      .eta-prediction {
        display: flex;
        align-items: center;
        gap: 16px;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border: 1px solid #fde68a;
        border-radius: 14px;
        padding: 20px 24px;
        margin-bottom: 24px;
      }
      .eta-prediction.delivered {
        background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%);
        border-color: #a7f3d0;
      }
      .eta-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
      }
      .eta-icon-box[data-status='pending'] {
        background: #fef3c7;
        color: #d97706;
      }
      .eta-icon-box[data-status='confirmed'] {
        background: #dbeafe;
        color: #2563eb;
      }
      .eta-icon-box[data-status='processing'] {
        background: #e0e7ff;
        color: #4f46e5;
      }
      .eta-icon-box[data-status='pending_drop_off'] {
        background: #fff7ed;
        color: #c2410c;
      }
      .eta-icon-box[data-status='shipped'] {
        background: #fce7f3;
        color: #db2777;
      }
      .eta-icon-box[data-status='out_for_delivery'] {
        background: #f0fdf4;
        color: #15803d;
      }
      .eta-icon-box[data-status='delivered'] {
        background: #dcfce7;
        color: #16a34a;
      }
      .eta-text {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .eta-message {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
      }
      .eta-date {
        font-size: 14px;
        color: #4b5563;
      }
      .eta-date strong {
        color: #1f2937;
      }
      .eta-countdown {
        display: inline-block;
        margin-left: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #ff6b35;
        background: #fff7ed;
        padding: 2px 10px;
        border-radius: 20px;
      }
    `,
  ],
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  tracking: any = null;
  orderData: any = null;
  orderTimeline: any[] = [];
  loading = true;
  error = '';
  timeline: any[] = [];
  shippingDistance: number = 0;
  routeDistance: number = 0;
  routeEta: string = '';
  routeLabel: string = '';

  private map: any = null;
  private orderMap: any = null;
  private driverMarker: any = null;
  private destMarker: any = null;
  private routeLine: any = null;
  private refreshInterval: any = null;
  private hubMarker: any = null;
  private orderRouteLine: any = null;
  private destHubMarker: any = null;
  private originMarker: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DeliveryService,
    private orderService: OrderService,
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
    if (this.orderMap) this.orderMap.remove();
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
          this.loadOrderTracking(orderId);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // No delivery record, try order-based tracking
        this.loadOrderTracking(orderId);
      },
    });
  }

  loadOrderTracking(orderId: string) {
    this.orderService.getOrderTracking(orderId).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.orderData = res.data;
          this.buildOrderTimeline();
          this.cdr.detectChanges();
          setTimeout(() => this.initOrderMap(), 200);
        } else {
          this.error = 'Tracking info not found';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'Tracking info not found';
        this.cdr.detectChanges();
      },
    });
  }

  buildOrderTimeline() {
    if (!this.orderData) return;
    const status = this.orderData.status;
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: 'pi pi-shopping-cart' },
      { key: 'confirmed', label: 'Confirmed', icon: 'pi pi-check' },
      { key: 'processing', label: 'Processing', icon: 'pi pi-box' },
      { key: 'shipped', label: 'Received at Hub', icon: 'pi pi-inbox' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'pi pi-truck' },
      { key: 'delivered', label: 'Delivered', icon: 'pi pi-home' },
    ];
    const order = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
    ];
    const currentIdx = order.indexOf(status);

    this.orderTimeline = steps.map((s, i) => ({
      ...s,
      done: i < currentIdx,
      active: i === currentIdx,
    }));

    if (status === 'cancelled') {
      this.orderTimeline = [
        {
          key: 'cancelled',
          label: 'Order Cancelled',
          icon: 'pi pi-times',
          done: false,
          active: true,
        },
      ];
    }
  }

  buildTimeline() {
    if (!this.tracking) return;
    const status = this.tracking.status;
    const steps = [
      {
        key: 'received_at_hub',
        label: 'Received at Origin Hub',
        icon: 'pi pi-inbox',
        time: this.tracking.createdAt,
      },
      { key: 'in_transit', label: 'In Transit (Hub to Hub)', icon: 'pi pi-truck', time: null },
      {
        key: 'at_destination_hub',
        label: 'At Destination Hub',
        icon: 'pi pi-map-marker',
        time: null,
      },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'pi pi-send', time: null },
      { key: 'delivered', label: 'Delivered', icon: 'pi pi-home', time: this.tracking.deliveredAt },
    ];
    const order = [
      'received_at_hub',
      'in_transit',
      'at_destination_hub',
      'out_for_delivery',
      'delivered',
    ];
    const currentIdx = order.indexOf(status);

    this.timeline = steps.map((s, i) => ({
      ...s,
      done: i < currentIdx,
      active: i === currentIdx,
    }));

    if (status === 'failed') {
      this.timeline.push({
        key: 'failed',
        label: 'Delivery Failed',
        icon: 'pi pi-times',
        time: null,
        done: false,
        active: true,
      });
    }
  }

  initOrUpdateMap() {
    if (!this.tracking) return;

    const status = this.tracking.status;
    const destLat = this.tracking.destinationLatitude;
    const destLng = this.tracking.destinationLongitude;
    const hubLat = this.tracking.hub?.latitude;
    const hubLng = this.tracking.hub?.longitude;
    const destHubLat = this.tracking.destinationHub?.latitude;
    const destHubLng = this.tracking.destinationHub?.longitude;
    const driverLat = this.tracking.currentLatitude || this.tracking.driver?.currentLatitude;
    const driverLng = this.tracking.currentLongitude || this.tracking.driver?.currentLongitude;

    // Initialize map once
    if (!this.map) {
      const centerLat = destLat || hubLat || 14.17;
      const centerLng = destLng || hubLng || 121.13;
      this.map = L.map('trackingMap').setView([centerLat, centerLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
    }

    // Clear old markers and route on each refresh
    this.clearMapLayers();

    // Phase 1: received_at_hub / in_transit → Origin Hub to Destination Hub
    if (['received_at_hub', 'in_transit'].includes(status)) {
      this.routeLabel = 'Hub to Hub Transfer';

      if (hubLat && hubLng) {
        this.originMarker = this.addMarker(hubLat, hubLng, '#6366f1', `<b>Origin Hub</b><br>${this.tracking.hub?.name || ''}`);
      }
      if (destHubLat && destHubLng) {
        this.destMarker = this.addMarker(destHubLat, destHubLng, '#8b5cf6', `<b>Destination Hub</b><br>${this.tracking.destinationHub?.name || ''}`);
      }
      if (driverLat && driverLng) {
        this.driverMarker = this.addDriverMarker(driverLat, driverLng, this.tracking.driver?.fullName || 'Transfer Driver');
      }
      if (hubLat && hubLng && destHubLat && destHubLng) {
        this.fetchRouteWithEta([hubLat, hubLng], [destHubLat, destHubLng]);
        const pts: [number, number][] = [[hubLat, hubLng], [destHubLat, destHubLng]];
        if (driverLat && driverLng) pts.push([driverLat, driverLng]);
        this.fitBounds(pts);
      }
    }

    // Phase 2: at_destination_hub / out_for_delivery / delivered → Dest Hub to Customer
    else if (['at_destination_hub', 'out_for_delivery', 'delivered'].includes(status)) {
      this.routeLabel = status === 'at_destination_hub' ? 'Awaiting Rider Assignment' : 'Last-Mile Delivery';

      if (destHubLat && destHubLng) {
        this.originMarker = this.addMarker(destHubLat, destHubLng, '#8b5cf6', `<b>Destination Hub</b><br>${this.tracking.destinationHub?.name || ''}`);
      }
      if (destLat && destLng) {
        this.destMarker = this.addMarker(destLat, destLng, '#ef4444', `<b>Delivery Address</b><br>${this.tracking.destinationAddress || ''}`);
      }
      if (driverLat && driverLng) {
        this.driverMarker = this.addDriverMarker(driverLat, driverLng, this.tracking.driver?.fullName || 'Rider');
      }
      const fromLat = driverLat || destHubLat;
      const fromLng = driverLng || destHubLng;
      if (fromLat && fromLng && destLat && destLng) {
        this.fetchRouteWithEta([fromLat, fromLng], [destLat, destLng]);
        const pts: [number, number][] = [[fromLat, fromLng], [destLat, destLng]];
        if (destHubLat && destHubLng && driverLat && driverLng) pts.push([destHubLat, destHubLng]);
        this.fitBounds(pts);
      }
    }

    // Fallback
    else {
      this.routeLabel = '';
      if (hubLat && hubLng) {
        this.originMarker = this.addMarker(hubLat, hubLng, '#6366f1', `<b>Origin Hub</b><br>${this.tracking.hub?.name || ''}`);
      }
      if (destLat && destLng) {
        this.destMarker = this.addMarker(destLat, destLng, '#ef4444', `<b>Destination</b><br>${this.tracking.destinationAddress || ''}`);
        if (hubLat && hubLng) {
          this.fetchRouteWithEta([hubLat, hubLng], [destLat, destLng]);
          this.fitBounds([[hubLat, hubLng], [destLat, destLng]]);
        }
      }
    }
  }

  private clearMapLayers() {
    [this.originMarker, this.destMarker, this.destHubMarker, this.driverMarker, this.hubMarker, this.routeLine].forEach(layer => {
      if (layer) this.map.removeLayer(layer);
    });
    this.originMarker = null;
    this.destMarker = null;
    this.destHubMarker = null;
    this.driverMarker = null;
    this.hubMarker = null;
    this.routeLine = null;
  }

  private addMarker(lat: number, lng: number, color: string, popup: string): any {
    const icon = L.divIcon({
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    return L.marker([lat, lng], { icon }).addTo(this.map).bindPopup(popup);
  }

  private addDriverMarker(lat: number, lng: number, name: string): any {
    const icon = L.divIcon({
      html: '<div style="background:#ff6b35;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>',
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    return L.marker([lat, lng], { icon }).addTo(this.map).bindPopup(`<b>Driver</b><br>${name}`);
  }

  private fitBounds(points: [number, number][]) {
    const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  fetchRouteWithEta(from: [number, number], to: [number, number]) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

          if (this.routeLine) {
            this.routeLine.setLatLngs(coords);
          } else {
            this.routeLine = L.polyline(coords, {
              color: '#ff6b35',
              weight: 4,
              opacity: 0.8,
            }).addTo(this.map);
          }

          this.routeDistance = route.distance / 1000;
          const durationMin = Math.round(route.duration / 60);
          if (durationMin < 60) {
            this.routeEta = `~${durationMin} min`;
          } else {
            const hrs = Math.floor(durationMin / 60);
            const mins = durationMin % 60;
            this.routeEta = mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`;
          }
          this.cdr.detectChanges();
        }
      })
      .catch(() => {
        this.routeLine = L.polyline([from, to], {
          color: '#ff6b35',
          weight: 3,
          dashArray: '8, 8',
          opacity: 0.8,
        }).addTo(this.map);
      });
  }

  fetchRoute(from: [number, number], to: [number, number], mapRef?: any, lineRef?: string) {
    const targetMap = mapRef || this.map;
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

          if (lineRef === 'order') {
            if (this.orderRouteLine) {
              this.orderRouteLine.setLatLngs(coords);
            } else {
              this.orderRouteLine = L.polyline(coords, {
                color: '#ff6b35',
                weight: 4,
                opacity: 0.8,
              }).addTo(targetMap);
            }
            this.shippingDistance = data.routes[0].distance / 1000;
            this.cdr.detectChanges();
          }
        }
      })
      .catch(() => {
        if (lineRef === 'order' && !this.orderRouteLine) {
          this.orderRouteLine = L.polyline([from, to], {
            color: '#ff6b35',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.8,
          }).addTo(targetMap);
        }
      });
  }

  formatStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  isHubToHub(): boolean {
    return ['received_at_hub', 'in_transit'].includes(this.tracking?.status);
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      pending: 'pi pi-clock',
      confirmed: 'pi pi-check',
      processing: 'pi pi-box',
      shipped: 'pi pi-inbox',
      out_for_delivery: 'pi pi-truck',
      delivered: 'pi pi-check-circle',
    };
    return icons[status] || 'pi pi-info-circle';
  }

  getStatusMessage(status: string): string {
    const messages: any = {
      pending: 'Your order is pending confirmation from the seller.',
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is being packed and prepared for shipping.',
      shipped: 'Your order has been received at the hub and is being processed for delivery.',
      out_for_delivery: 'Your order is on its way to you! A rider has been assigned.',
    };
    return messages[status] || 'Order is being processed.';
  }

  getDaysUntil(dateStr: string): string {
    if (!dateStr) return '';
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Arriving any time now';
    if (diff === 1) return 'Arriving tomorrow';
    return `${diff} days away`;
  }

  hasMapData(): boolean {
    if (!this.orderData) return false;
    const addr = this.orderData.address;
    if (!addr?.latitude || !addr?.longitude) return false;
    const seller = this.orderData.items?.[0]?.seller;
    if (!seller?.latitude || !seller?.longitude) return false;
    return true;
  }

  getSellerName(): string {
    return this.orderData?.items?.[0]?.seller?.shopName || 'Store';
  }

  initOrderMap() {
    if (!this.orderData || this.orderMap) return;
    const addr = this.orderData.address;
    const seller = this.orderData.items?.[0]?.seller;
    if (!addr?.latitude || !addr?.longitude || !seller?.latitude || !seller?.longitude) return;

    const destLat = parseFloat(addr.latitude);
    const destLng = parseFloat(addr.longitude);
    const originLat = parseFloat(seller.latitude);
    const originLng = parseFloat(seller.longitude);

    const mapEl = document.getElementById('orderTrackingMap');
    if (!mapEl) return;

    this.orderMap = L.map('orderTrackingMap');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.orderMap);

    // Origin marker (seller/store)
    const originIcon = L.divIcon({
      html: '<div style="background:#ff6b35;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>',
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    // Destination marker (customer)
    const destIcon = L.divIcon({
      html: '<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>',
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([originLat, originLng], { icon: originIcon })
      .addTo(this.orderMap)
      .bindPopup(`<b>${seller.shopName}</b><br>${seller.businessAddress || 'Store Location'}`);

    L.marker([destLat, destLng], { icon: destIcon })
      .addTo(this.orderMap)
      .bindPopup(`<b>Your Address</b><br>${addr.streetAddress}, ${addr.barangay}, ${addr.city}`);

    // Route line using OSRM (follows roads)
    this.fetchRoute([originLat, originLng], [destLat, destLng], this.orderMap, 'order');

    // Fit bounds
    const bounds = L.latLngBounds([
      [originLat, originLng],
      [destLat, destLng],
    ]);
    this.orderMap.fitBounds(bounds, { padding: [50, 50] });
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
