import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { HubService } from '../services/hub.service';

@Component({
  selector: 'app-seller-orders',
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
          <a class="nav-item active">
            <i class="pi pi-shopping-cart"></i>
            <span>Orders</span>
          </a>
          <a class="nav-item" (click)="navigate('/seller/customers')">
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
            <h1>Orders</h1>
            <p class="breadcrumb">Home / Orders</p>
          </div>
          <div class="top-bar-right">
            <div class="order-stats">
              <span class="stat-pill pending">{{ getCount('pending') }} Pending</span>
              <span class="stat-pill processing">{{ getCount('processing') }} Processing</span>
              <span class="stat-pill shipped">{{ getCount('pending_drop_off') + getCount('shipped') }} Shipping</span>
            </div>
          </div>
        </header>

        <div class="orders-content">
          <!-- Status Filter Tabs -->
          <div class="status-tabs">
            <button *ngFor="let tab of statusTabs" [class.active]="activeStatus === tab.key" (click)="filterByStatus(tab.key)">
              {{ tab.label }}
              <span class="tab-badge" *ngIf="getCount(tab.key) > 0">{{ getCount(tab.key) }}</span>
            </button>
          </div>

          <!-- Loading -->
          <div class="loading-state" *ngIf="loading">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading orders...</p>
          </div>

          <!-- Empty -->
          <div class="empty-state" *ngIf="!loading && filteredOrders.length === 0">
            <i class="pi pi-inbox"></i>
            <p>No {{ activeStatus === 'all' ? '' : activeStatus }} orders found.</p>
          </div>

          <!-- Orders Table -->
          <div class="orders-table-wrapper" *ngIf="!loading && filteredOrders.length > 0">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Tracking #</th>
                  <th>ETA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of filteredOrders" class="order-row" (click)="toggleExpand(order.id)">
                  <td class="order-num">{{ order.orderNumber }}</td>
                  <td>
                    <div class="customer-info">
                      <span class="cust-name">{{ order.user?.fullName || 'Customer' }}</span>
                      <span class="cust-email">{{ order.user?.email }}</span>
                    </div>
                  </td>
                  <td>{{ order.items?.length }} item{{ order.items?.length > 1 ? 's' : '' }}</td>
                  <td class="order-total-cell">₱{{ getSellerTotal(order) | number:'1.2-2' }}</td>
                  <td>
                    <span class="status-chip" [attr.data-status]="order.status">{{ order.status | titlecase }}</span>
                  </td>
                  <td class="order-date-cell">{{ order.createdAt | date:'MMM d, yyyy' }}</td>
                  <td class="tracking-cell">
                    <span class="tracking-number" *ngIf="order.trackingNumber">{{ order.trackingNumber }}</span>
                    <span class="no-tracking" *ngIf="!order.trackingNumber">—</span>
                  </td>
                  <td class="eta-cell">
                    <span class="eta-badge" *ngIf="order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled'">
                      <i class="pi pi-truck"></i> {{ order.estimatedDelivery | date:'MMM d' }}
                      <small>{{ getDaysUntil(order.estimatedDelivery) }}</small>
                    </span>
                    <span class="eta-badge delivered" *ngIf="order.status === 'delivered'"><i class="pi pi-check-circle"></i> Delivered</span>
                    <span class="eta-badge na" *ngIf="order.status === 'cancelled'">—</span>
                  </td>
                  <td class="actions-cell" (click)="$event.stopPropagation()">
                    <button class="hub-dropoff-btn" *ngIf="order.status === 'processing'" (click)="openHubModal(order)">
                      <i class="pi pi-building"></i> Drop off at Hub
                    </button>
                    <select class="status-select" [ngModel]="order.status" (ngModelChange)="changeStatus(order, $event)"
                      *ngIf="order.status !== 'pending_drop_off' && order.status !== 'shipped' && order.status !== 'out_for_delivery' && order.status !== 'delivered' && order.status !== 'processing'">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="cancelled" [disabled]="order.status === 'shipped' || order.status === 'delivered'">Cancelled</option>
                    </select>
                    <span class="hub-status-label" *ngIf="order.status === 'pending_drop_off'"><i class="pi pi-clock"></i> Awaiting Hub</span>
                    <span class="hub-status-label shipped" *ngIf="order.status === 'shipped'"><i class="pi pi-truck"></i> In Hub System</span>
                    <span class="hub-status-label transit" *ngIf="order.status === 'out_for_delivery'"><i class="pi pi-send"></i> Out for Delivery</span>
                    <span class="hub-status-label done" *ngIf="order.status === 'delivered'"><i class="pi pi-check"></i> Delivered</span>
                  </td>
                </tr>

              </tbody>
            </table>

            <!-- Expanded Detail (below table per order) -->
            <div class="order-detail-panel" *ngIf="expandedOrder">
              <div class="detail-header">
                <h3>Order {{ expandedOrder.orderNumber }}</h3>
                <button class="close-detail" (click)="expandedOrderId = ''; expandedOrder = null">
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <!-- ETA Bar -->
              <div class="detail-tracking-bar" *ngIf="expandedOrder.trackingNumber">
                <i class="pi pi-barcode"></i>
                <span>Tracking Number: <strong>{{ expandedOrder.trackingNumber }}</strong></span>
              </div>

              <div class="detail-eta-bar" *ngIf="expandedOrder.estimatedDelivery && expandedOrder.status !== 'delivered' && expandedOrder.status !== 'cancelled'">
                <i class="pi pi-truck"></i>
                <span>Estimated Delivery: <strong>{{ expandedOrder.estimatedDelivery | date:'MMMM d, yyyy' }}</strong></span>
                <span class="eta-countdown">{{ getDaysUntil(expandedOrder.estimatedDelivery) }}</span>
              </div>

              <div class="detail-grid">
                <!-- Customer & Address -->
                <div class="detail-section">
                  <h4><i class="pi pi-user"></i> Customer</h4>
                  <p><strong>{{ expandedOrder.user?.fullName }}</strong></p>
                  <p>{{ expandedOrder.user?.email }}</p>
                </div>
                <div class="detail-section" *ngIf="expandedOrder.address">
                  <h4><i class="pi pi-map-marker"></i> Delivery Address</h4>
                  <p><strong>{{ expandedOrder.address.fullName }}</strong> · {{ expandedOrder.address.phone }}</p>
                  <p>{{ expandedOrder.address.streetAddress }}, {{ expandedOrder.address.barangay }}, {{ expandedOrder.address.city }}, {{ expandedOrder.address.province }}</p>
                </div>
                <div class="detail-section" *ngIf="expandedOrder.notes">
                  <h4><i class="pi pi-file-edit"></i> Notes</h4>
                  <p class="order-notes">{{ expandedOrder.notes }}</p>
                </div>
              </div>

              <!-- Items -->
              <div class="detail-items">
                <h4>Items from your store</h4>
                <div class="d-item" *ngFor="let item of expandedOrder.items">
                  <div class="d-item-img">
                    <img *ngIf="item.productImage?.url" [src]="item.productImage.url" />
                    <div *ngIf="!item.productImage?.url" class="d-item-placeholder"><i class="pi pi-image"></i></div>
                  </div>
                  <div class="d-item-info">
                    <span class="d-item-name">{{ item.productName }}</span>
                  </div>
                  <div class="d-item-price">₱{{ item.price | number:'1.2-2' }}</div>
                  <div class="d-item-qty">x{{ item.quantity }}</div>
                  <div class="d-item-subtotal">₱{{ (item.price * item.quantity) | number:'1.2-2' }}</div>
                </div>
              </div>

              <div class="detail-footer">
                <div class="detail-total">
                  Your Total: <strong>₱{{ getSellerTotal(expandedOrder) | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Status Change Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showConfirmModal">
      <div class="modal-box">
        <div class="modal-icon" [attr.data-type]="pendingNewStatus === 'cancelled' ? 'danger' : 'info'">
          <i [class]="pendingNewStatus === 'cancelled' ? 'pi pi-exclamation-triangle' : 'pi pi-refresh'"></i>
        </div>
        <h3>{{ pendingNewStatus === 'cancelled' ? 'Cancel Order?' : 'Update Status' }}</h3>
        <p>Change order <strong>{{ pendingOrder?.orderNumber }}</strong> status from
          <span class="status-chip-inline" [attr.data-status]="pendingOrder?.status">{{ pendingOrder?.status | titlecase }}</span>
          to
          <span class="status-chip-inline" [attr.data-status]="pendingNewStatus">{{ pendingNewStatus | titlecase }}</span>
        </p>
        <p class="sub-text" *ngIf="pendingNewStatus === 'cancelled'">This will return the item stocks back to inventory.</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="cancelStatusChange()">Cancel</button>
          <button class="modal-btn" [class.danger]="pendingNewStatus === 'cancelled'" [class.primary]="pendingNewStatus !== 'cancelled'" (click)="confirmStatusChange()">
            {{ pendingNewStatus === 'cancelled' ? 'Yes, Cancel Order' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Hub Selection Modal -->
    <div class="modal-overlay" *ngIf="showHubModal">
      <div class="modal-box hub-modal">
        <div class="modal-icon" data-type="info"><i class="pi pi-building"></i></div>
        <h3>Select Drop-off Hub</h3>
        <p>Choose the nearest hub to drop off the parcel for order <strong>{{ hubModalOrder?.orderNumber }}</strong></p>
        <div class="hub-list" *ngIf="availableHubs.length > 0">
          <div class="hub-option" *ngFor="let hub of availableHubs" [class.selected]="selectedHubId === hub.id" (click)="selectedHubId = hub.id">
            <div class="hub-radio"><div class="radio-dot" *ngIf="selectedHubId === hub.id"></div></div>
            <div class="hub-info">
              <span class="hub-name">{{ hub.name }}</span>
              <span class="hub-addr">{{ hub.address }}, {{ hub.city }}</span>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="availableHubs.length === 0 && !hubsLoading">
          <p>No hubs available. Contact admin.</p>
        </div>
        <div class="loading-state" *ngIf="hubsLoading"><i class="pi pi-spin pi-spinner"></i> Loading hubs...</div>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="closeHubModal()">Cancel</button>
          <button class="modal-btn primary" (click)="confirmDropOff()" [disabled]="!selectedHubId || droppingOff">{{ droppingOff ? 'Processing...' : 'Confirm Drop-off' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Orders Content */
    .orders-content { padding: 24px; }

    .order-stats { display: flex; gap: 8px; }
    .stat-pill {
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;
    }
    .stat-pill.pending { background: #fef3c7; color: #92400e; }
    .stat-pill.processing { background: #e0e7ff; color: #3730a3; }
    .stat-pill.shipped { background: #fce7f3; color: #9d174d; }

    /* Status Tabs */
    .status-tabs {
      display: flex; gap: 4px; margin-bottom: 20px; background: white;
      border-radius: 10px; padding: 4px; border: 1px solid #e5e7eb; flex-wrap: wrap;
    }
    .status-tabs button {
      padding: 9px 16px; border: none; background: none; font-size: 13px;
      color: #6b7280; border-radius: 7px; cursor: pointer; font-weight: 500;
      transition: all 0.15s; display: flex; align-items: center; gap: 6px;
    }
    .status-tabs button:hover { background: #f9fafb; }
    .status-tabs button.active { background: #ff6b35; color: white; }
    .tab-badge {
      font-size: 11px; background: rgba(0,0,0,0.1); padding: 1px 7px;
      border-radius: 10px; min-width: 18px; text-align: center;
    }
    .status-tabs button.active .tab-badge { background: rgba(255,255,255,0.25); }

    /* Loading / Empty */
    .loading-state, .empty-state {
      text-align: center; padding: 60px 20px; color: #6b7280;
    }
    .loading-state i, .empty-state i { font-size: 36px; color: #d1d5db; display: block; margin-bottom: 12px; }
    .loading-state i { color: #ff6b35; }
    .loading-state p, .empty-state p { font-size: 14px; margin: 0; }

    /* Table */
    .orders-table-wrapper {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;
    }
    .orders-table {
      width: 100%; border-collapse: collapse; font-size: 14px;
    }
    .orders-table thead { background: #f9fafb; }
    .orders-table th {
      padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600;
      color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;
      border-bottom: 1px solid #e5e7eb;
    }
    .orders-table td {
      padding: 14px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle;
    }
    .order-row { cursor: pointer; transition: background 0.1s; }
    .order-row:hover { background: #f9fafb; }

    .order-num { font-family: monospace; font-weight: 700; color: #1f2937; font-size: 13px; }
    .customer-info { display: flex; flex-direction: column; }
    .cust-name { font-weight: 500; color: #1f2937; font-size: 13px; }
    .cust-email { font-size: 12px; color: #9ca3af; }
    .order-total-cell { font-weight: 600; color: #ff6b35; }
    .order-date-cell { font-size: 13px; color: #6b7280; white-space: nowrap; }

    .eta-cell { white-space: nowrap; }
    .eta-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
      background: #fffbeb; color: #92400e;
    }
    .eta-badge i { font-size: 12px; color: #d97706; }
    .eta-badge small { font-size: 11px; color: #b45309; font-weight: 400; }
    .eta-badge.delivered { background: #dcfce7; color: #166534; }
    .eta-badge.delivered i { color: #16a34a; }
    .eta-badge.na { background: #f3f4f6; color: #9ca3af; }

    .detail-eta-bar {
      display: flex; align-items: center; gap: 10px;
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 20px; font-size: 14px; color: #92400e;
    }
    .detail-eta-bar i { font-size: 18px; color: #d97706; }
    .detail-eta-bar strong { color: #78350f; }
    .eta-countdown {
      margin-left: auto; font-size: 13px; font-weight: 500; color: #b45309;
    }

    .status-chip {
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; white-space: nowrap;
    }
    .status-chip[data-status="pending"] { background: #fef3c7; color: #92400e; }
    .status-chip[data-status="confirmed"] { background: #dbeafe; color: #1e40af; }
    .status-chip[data-status="processing"] { background: #e0e7ff; color: #3730a3; }
    .status-chip[data-status="shipped"] { background: #fce7f3; color: #9d174d; }
    .status-chip[data-status="pending_drop_off"] { background: #fff7ed; color: #c2410c; }
    .status-chip[data-status="out_for_delivery"] { background: #f0fdf4; color: #15803d; }
    .status-chip[data-status="delivered"] { background: #dcfce7; color: #166534; }
    .status-chip[data-status="cancelled"] { background: #fee2e2; color: #991b1b; }

    .actions-cell { min-width: 140px; }
    .status-select {
      padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 13px; color: #374151; cursor: pointer; background: white;
      outline: none; transition: border 0.2s;
    }
    .status-select:focus { border-color: #ff6b35; }

    /* Detail Panel */
    .order-detail-panel {
      margin-top: -1px; border: 1px solid #e5e7eb; border-top: 2px solid #ff6b35;
      border-radius: 0 0 12px 12px; background: white; padding: 24px;
    }
    .detail-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    }
    .detail-header h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 0; }
    .close-detail {
      background: none; border: none; font-size: 18px; color: #6b7280;
      cursor: pointer; padding: 4px;
    }
    .close-detail:hover { color: #1f2937; }

    .detail-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px; margin-bottom: 20px;
    }
    .detail-section h4 {
      font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 8px;
      display: flex; align-items: center; gap: 6px;
    }
    .detail-section h4 i { color: #ff6b35; font-size: 13px; }
    .detail-section p { font-size: 13px; color: #4b5563; margin: 0 0 4px; line-height: 1.5; }
    .order-notes {
      background: #f9fafb; padding: 10px; border-radius: 6px; font-style: italic;
    }

    .detail-items { margin-bottom: 16px; }
    .detail-items h4 {
      font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 12px;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .d-item {
      display: flex; align-items: center; gap: 12px; padding: 10px;
      background: #f9fafb; border-radius: 8px; margin-bottom: 8px;
    }
    .d-item-img { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
    .d-item-img img { width: 100%; height: 100%; object-fit: cover; }
    .d-item-placeholder {
      width: 100%; height: 100%; background: #e5e7eb;
      display: flex; align-items: center; justify-content: center; color: #9ca3af;
    }
    .d-item-info { flex: 1; min-width: 0; }
    .d-item-name { font-size: 14px; font-weight: 500; color: #1f2937; }
    .d-item-price { font-size: 13px; color: #6b7280; width: 80px; text-align: right; }
    .d-item-qty { font-size: 13px; color: #6b7280; width: 40px; text-align: center; }
    .d-item-subtotal { font-size: 14px; font-weight: 600; color: #ff6b35; width: 90px; text-align: right; }

    .detail-footer {
      display: flex; justify-content: flex-end; padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .detail-total { font-size: 15px; color: #4b5563; }
    .detail-total strong { color: #1f2937; font-size: 18px; }

    @media (max-width: 1024px) {
      .orders-table { font-size: 13px; }
      .orders-table th, .orders-table td { padding: 10px 12px; }
    }
    /* Confirmation Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000; animation: fadeIn 0.15s ease;
    }
    .modal-box {
      background: white; border-radius: 16px; padding: 40px; text-align: center;
      max-width: 440px; width: 90%; animation: scaleIn 0.2s ease;
    }
    .modal-icon i { font-size: 48px; }
    .modal-icon[data-type="info"] i { color: #3b82f6; }
    .modal-icon[data-type="danger"] i { color: #ef4444; }
    .modal-box h3 { font-size: 22px; font-weight: 700; color: #1f2937; margin: 16px 0 8px; }
    .modal-box p { color: #4b5563; font-size: 14px; margin: 0 0 4px; line-height: 1.6; }
    .sub-text { color: #9ca3af !important; font-size: 13px !important; margin-top: 8px !important; }
    .status-chip-inline {
      font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px;
    }
    .status-chip-inline[data-status="pending"] { background: #fef3c7; color: #92400e; }
    .status-chip-inline[data-status="confirmed"] { background: #dbeafe; color: #1e40af; }
    .status-chip-inline[data-status="processing"] { background: #e0e7ff; color: #3730a3; }
    .status-chip-inline[data-status="shipped"] { background: #fce7f3; color: #9d174d; }
    .status-chip-inline[data-status="pending_drop_off"] { background: #fff7ed; color: #c2410c; }
    .status-chip-inline[data-status="out_for_delivery"] { background: #f0fdf4; color: #15803d; }
    .status-chip-inline[data-status="delivered"] { background: #dcfce7; color: #166534; }
    .status-chip-inline[data-status="cancelled"] { background: #fee2e2; color: #991b1b; }
    .modal-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: center; }
    .modal-btn {
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;
      cursor: pointer; border: none; transition: background 0.15s;
    }
    .modal-btn.secondary { background: #f3f4f6; color: #374151; }
    .modal-btn.secondary:hover { background: #e5e7eb; }
    .modal-btn.primary { background: #ff6b35; color: white; }
    .modal-btn.primary:hover { background: #e55a28; }
    .modal-btn.danger { background: #ef4444; color: white; }
    .modal-btn.danger:hover { background: #dc2626; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    @media (max-width: 768px) {
      .order-stats { display: none; }
      .detail-grid { grid-template-columns: 1fr; }
    }

    /* Hub drop-off button */
    .hub-dropoff-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 16px; border-radius: 8px; border: none;
      background: #ff6b35; color: white; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background 0.15s; white-space: nowrap;
    }
    .hub-dropoff-btn:hover { background: #e55a28; }
    .hub-dropoff-btn i { font-size: 13px; }

    .hub-status-label {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px;
      background: #fff7ed; color: #c2410c; white-space: nowrap;
    }
    .hub-status-label.shipped { background: #fce7f3; color: #9d174d; }
    .hub-status-label.transit { background: #f0fdf4; color: #15803d; }
    .hub-status-label.done { background: #dcfce7; color: #166534; }
    .hub-status-label i { font-size: 12px; }

    /* Hub Selection Modal */
    .hub-modal { max-width: 520px; text-align: left; }
    .hub-modal h3, .hub-modal > p { text-align: center; }
    .hub-list { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; max-height: 300px; overflow-y: auto; }
    .hub-option {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer;
      transition: all 0.15s;
    }
    .hub-option:hover { border-color: #ff6b35; background: #fff7ed; }
    .hub-option.selected { border-color: #ff6b35; background: #fff7ed; }
    .hub-radio {
      width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d1d5db;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hub-option.selected .hub-radio { border-color: #ff6b35; }
    .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: #ff6b35; }
    .hub-info { display: flex; flex-direction: column; }
    .hub-name { font-size: 14px; font-weight: 600; color: #1f2937; }
    .hub-addr { font-size: 12px; color: #6b7280; }

    .tracking-cell { font-size: 13px; }
    .tracking-number {
      font-family: monospace; font-size: 12px; font-weight: 600; color: #7c3aed;
      background: #f5f3ff; padding: 3px 8px; border-radius: 4px;
    }
    .no-tracking { color: #d1d5db; }

    .detail-tracking-bar {
      display: flex; align-items: center; gap: 10px;
      background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 12px; font-size: 14px; color: #5b21b6;
    }
    .detail-tracking-bar i { font-size: 18px; color: #7c3aed; }
    .detail-tracking-bar strong { color: #4c1d95; font-family: monospace; letter-spacing: 0.5px; }
  `],
})
export class SellerOrdersComponent implements OnInit {
  shopName = '';
  orders: any[] = [];
  loading = true;
  activeStatus = 'all';
  expandedOrderId = '';
  expandedOrder: any = null;

  // Confirmation modal state
  showConfirmModal = false;
  pendingOrder: any = null;
  pendingNewStatus = '';

  statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'pending_drop_off', label: 'Awaiting Hub' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Hub modal state
  showHubModal = false;
  hubModalOrder: any = null;
  availableHubs: any[] = [];
  selectedHubId = '';
  hubsLoading = false;
  droppingOff = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService,
    private hubService: HubService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user?.seller) {
      this.shopName = user.seller.shopName;
    } else {
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getSellerOrders().subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.orders = res.data;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredOrders(): any[] {
    if (this.activeStatus === 'all') return this.orders;
    return this.orders.filter((o: any) => o.status === this.activeStatus);
  }

  getCount(status: string): number {
    if (status === 'all') return this.orders.length;
    return this.orders.filter((o: any) => o.status === status).length;
  }

  getSellerTotal(order: any): number {
    return (order.items || []).reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);
  }

  getDaysUntil(dateStr: string): string {
    if (!dateStr) return '';
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return '(any time now)';
    if (diff === 1) return '(tomorrow)';
    return `(in ${diff} days)`;
  }

  filterByStatus(status: string) {
    this.activeStatus = status;
    this.expandedOrderId = '';
    this.expandedOrder = null;
  }

  toggleExpand(orderId: string) {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = '';
      this.expandedOrder = null;
    } else {
      this.expandedOrderId = orderId;
      this.expandedOrder = this.orders.find((o: any) => o.id === orderId);
    }
    this.cdr.detectChanges();
  }

  changeStatus(order: any, newStatus: string) {
    if (order.status === newStatus) return;
    // Store pending change and show modal
    this.pendingOrder = order;
    this.pendingNewStatus = newStatus;
    this.showConfirmModal = true;
    // Revert select display immediately (actual change happens on confirm)
    const old = order.status;
    order.status = '__reset__';
    this.cdr.detectChanges();
    order.status = old;
    this.cdr.detectChanges();
  }

  cancelStatusChange() {
    this.showConfirmModal = false;
    this.pendingOrder = null;
    this.pendingNewStatus = '';
    this.cdr.detectChanges();
  }

  confirmStatusChange() {
    const order = this.pendingOrder;
    const newStatus = this.pendingNewStatus;
    const oldStatus = order.status;
    this.showConfirmModal = false;
    this.pendingOrder = null;
    this.pendingNewStatus = '';

    order.status = newStatus;
    this.cdr.detectChanges();

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.data?.estimatedDelivery !== undefined) {
            order.estimatedDelivery = res.data.estimatedDelivery;
            if (this.expandedOrder?.id === order.id) {
              this.expandedOrder.estimatedDelivery = res.data.estimatedDelivery;
            }
          }
          if (res.data?.trackingNumber) {
            order.trackingNumber = res.data.trackingNumber;
            if (this.expandedOrder?.id === order.id) {
              this.expandedOrder.trackingNumber = res.data.trackingNumber;
            }
          }
        } else {
          order.status = oldStatus;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        order.status = oldStatus;
        this.cdr.detectChanges();
      },
    });
  }

  openHubModal(order: any) {
    this.hubModalOrder = order;
    this.selectedHubId = '';
    this.showHubModal = true;
    this.hubsLoading = true;
    this.hubService.getAvailableHubs().subscribe({
      next: (res: any) => {
        this.hubsLoading = false;
        if (res.success) this.availableHubs = res.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hubsLoading = false;
        this.availableHubs = [];
        this.cdr.detectChanges();
      },
    });
  }

  closeHubModal() {
    this.showHubModal = false;
    this.hubModalOrder = null;
    this.selectedHubId = '';
    this.availableHubs = [];
    this.droppingOff = false;
  }

  confirmDropOff() {
    if (!this.selectedHubId || !this.hubModalOrder) return;
    this.droppingOff = true;
    this.hubService.sellerDropOff(this.hubModalOrder.id, this.selectedHubId).subscribe({
      next: (res: any) => {
        this.droppingOff = false;
        if (res.success) {
          this.hubModalOrder.status = 'pending_drop_off';
          this.closeHubModal();
          this.loadOrders();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.droppingOff = false;
        alert(err.error?.message || 'Drop-off failed');
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
