import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { AddressService } from '../services/address.service';
import { OrderService } from '../services/order.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="checkout-page">
      <div class="container">
        <h2 class="page-title"><i class="pi pi-credit-card"></i> Checkout</h2>

        <div class="checkout-layout">
          <div class="checkout-main">
            <!-- Delivery Address Section -->
            <div class="section">
              <div class="section-header">
                <h3><i class="pi pi-map-marker"></i> Delivery Address</h3>
                <button class="add-addr-btn" (click)="openAddressForm()" *ngIf="!showAddressForm">
                  <i class="pi pi-plus"></i> Add New Address
                </button>
              </div>

              <!-- Address Form -->
              <div class="address-form" *ngIf="showAddressForm">
                <div class="form-title">{{ editingAddress ? 'Edit Address' : 'Add New Address' }}</div>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Label</label>
                    <select [(ngModel)]="addressForm.label">
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" [(ngModel)]="addressForm.fullName" placeholder="Recipient full name" />
                  </div>
                  <div class="form-group">
                    <label>Phone *</label>
                    <input type="text" [(ngModel)]="addressForm.phone" placeholder="09xxxxxxxxx" />
                  </div>
                  <div class="form-group">
                    <label>Region *</label>
                    <input type="text" [(ngModel)]="addressForm.region" placeholder="e.g. NCR, Region VII" />
                  </div>
                  <div class="form-group">
                    <label>Province *</label>
                    <input type="text" [(ngModel)]="addressForm.province" placeholder="Province" />
                  </div>
                  <div class="form-group">
                    <label>City / Municipality *</label>
                    <input type="text" [(ngModel)]="addressForm.city" placeholder="City" />
                  </div>
                  <div class="form-group">
                    <label>Barangay *</label>
                    <input type="text" [(ngModel)]="addressForm.barangay" placeholder="Barangay" />
                  </div>
                  <div class="form-group">
                    <label>Postal Code *</label>
                    <input type="text" [(ngModel)]="addressForm.postalCode" placeholder="e.g. 1000" />
                  </div>
                  <div class="form-group full-width">
                    <label>Street Address *</label>
                    <input type="text" [(ngModel)]="addressForm.streetAddress" placeholder="House/Unit No., Street, Building" />
                  </div>
                  <div class="form-group full-width">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="addressForm.isDefault" />
                      Set as default address
                    </label>
                  </div>
                </div>

                <!-- Map Pin -->
                <div class="map-section">
                  <div class="map-header">
                    <label><i class="pi pi-map"></i> Pin Location</label>
                    <button type="button" class="locate-btn" (click)="locateFromAddress()" [disabled]="geocoding">
                      <i class="pi pi-spin pi-spinner" *ngIf="geocoding"></i>
                      <i class="pi pi-search" *ngIf="!geocoding"></i>
                      Locate from address
                    </button>
                  </div>
                  <div id="address-map" class="address-map"></div>
                  <p class="map-hint">Drag the pin to adjust your exact location</p>
                </div>

                <div class="form-actions">
                  <button class="cancel-btn" (click)="cancelAddressForm()">Cancel</button>
                  <button class="save-btn" (click)="saveAddress()" [disabled]="savingAddress">
                    <i class="pi pi-spin pi-spinner" *ngIf="savingAddress"></i>
                    {{ editingAddress ? 'Update' : 'Save' }} Address
                  </button>
                </div>
              </div>

              <!-- Address List -->
              <div class="address-list" *ngIf="!showAddressForm">
                <div class="no-address" *ngIf="addresses.length === 0">
                  <i class="pi pi-map-marker"></i>
                  <p>No delivery address yet. Add one to continue.</p>
                </div>
                <div
                  class="address-card"
                  *ngFor="let addr of addresses"
                  [class.active]="selectedAddressId === addr.id"
                  (click)="selectedAddressId = addr.id"
                >
                  <div class="addr-radio">
                    <span class="radio-dot" [class.selected]="selectedAddressId === addr.id"></span>
                  </div>
                  <div class="addr-content">
                    <div class="addr-top">
                      <span class="addr-name">{{ addr.fullName }}</span>
                      <span class="addr-phone">{{ addr.phone }}</span>
                      <span class="addr-badge default" *ngIf="addr.isDefault">Default</span>
                      <span class="addr-badge">{{ addr.label }}</span>
                    </div>
                    <p class="addr-detail">{{ addr.streetAddress }}, {{ addr.barangay }}, {{ addr.city }}, {{ addr.province }}, {{ addr.region }} {{ addr.postalCode }}</p>
                    <div class="addr-actions">
                      <button (click)="editAddress(addr, $event)">Edit</button>
                      <button (click)="deleteAddr(addr, $event)">Delete</button>
                      <button *ngIf="!addr.isDefault" (click)="setDefault(addr, $event)">Set Default</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Items Section -->
            <div class="section">
              <h3><i class="pi pi-box"></i> Order Items ({{ checkoutItems.length }})</h3>
              <div class="order-items">
                <div class="order-item" *ngFor="let item of checkoutItems">
                  <div class="oi-img">
                    <img *ngIf="item.product.images?.length" [src]="item.product.images[0].url" />
                    <div *ngIf="!item.product.images?.length" class="oi-no-img"><i class="pi pi-image"></i></div>
                  </div>
                  <div class="oi-info">
                    <div class="oi-name">{{ item.product.name }}</div>
                    <div class="oi-seller" *ngIf="item.product.seller">{{ item.product.seller.shopName }}</div>
                  </div>
                  <div class="oi-qty">x{{ item.quantity }}</div>
                  <div class="oi-price">₱{{ (item.product.price * item.quantity) | number:'1.2-2' }}</div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="section">
              <h3><i class="pi pi-file-edit"></i> Order Notes</h3>
              <textarea [(ngModel)]="orderNotes" placeholder="Add notes for the seller (optional)..." rows="3"></textarea>
            </div>
          </div>

          <!-- Summary Sidebar -->
          <div class="summary-sidebar">
            <div class="summary-card">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal ({{ totalQty }} item{{ totalQty > 1 ? 's' : '' }})</span>
                <span>₱{{ subtotal | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span class="free">Free</span>
              </div>
              <div class="divider"></div>
              <div class="summary-row total">
                <span>Total</span>
                <span>₱{{ subtotal | number:'1.2-2' }}</span>
              </div>
              <div class="payment-method">
                <div class="pm-label">Payment Method</div>
                <div class="pm-value"><i class="pi pi-wallet"></i> Cash on Delivery (COD)</div>
              </div>
              <button class="place-order-btn" (click)="placeOrder()" [disabled]="placingOrder || !selectedAddressId">
                <i class="pi pi-spin pi-spinner" *ngIf="placingOrder"></i>
                <i class="pi pi-check" *ngIf="!placingOrder"></i>
                {{ placingOrder ? 'Placing Order...' : 'Place Order' }}
              </button>
              <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div class="modal-overlay" *ngIf="orderSuccess">
      <div class="modal-box">
        <div class="success-icon"><i class="pi pi-check-circle"></i></div>
        <h3>Order Placed!</h3>
        <p>Your order <strong>{{ placedOrderNumber }}</strong> has been placed successfully.</p>
        <div class="eta-banner" *ngIf="placedOrderEta">
          <i class="pi pi-truck"></i>
          <span>Estimated delivery by <strong>{{ placedOrderEta | date:'MMMM d, yyyy' }}</strong></span>
        </div>
        <p class="sub-text">We'll send you updates on your order status.</p>
        <div class="modal-actions">
          <button class="modal-btn secondary" (click)="goHome()">Continue Shopping</button>
          <button class="modal-btn primary" (click)="goToOrders()">View Orders</button>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .checkout-page { min-height: calc(100vh - 120px); background: #f9fafb; padding: 32px 0; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
    .page-title {
      font-size: 22px; font-weight: 700; color: #1f2937;
      display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
    }
    .page-title i { font-size: 22px; }

    .checkout-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
    .checkout-main { display: flex; flex-direction: column; gap: 20px; }

    .section {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px;
    }
    .section h3 {
      font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .section h3 i { color: #ff6b35; font-size: 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h3 { margin: 0; }

    /* Address Form */
    .address-form { background: #f9fafb; border-radius: 10px; padding: 20px; border: 1px dashed #d1d5db; }
    .form-title { font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 13px; font-weight: 500; color: #374151; }
    .form-group input, .form-group select {
      padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;
      outline: none; transition: border 0.2s;
    }
    .form-group input:focus, .form-group select:focus { border-color: #ff6b35; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
    .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #ff6b35; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .cancel-btn {
      padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 14px; cursor: pointer; color: #374151;
    }
    .cancel-btn:hover { background: #f3f4f6; }
    .save-btn {
      padding: 10px 20px; background: #ff6b35; color: white; border: none; border-radius: 6px;
      font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;
    }
    .save-btn:hover:not(:disabled) { background: #e55a28; }
    .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .add-addr-btn {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      background: white; border: 1px solid #ff6b35; color: #ff6b35; border-radius: 6px;
      font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .add-addr-btn:hover { background: #fff7f3; }

    /* Address List */
    .no-address { text-align: center; padding: 30px; color: #6b7280; }
    .no-address i { font-size: 36px; color: #d1d5db; margin-bottom: 10px; display: block; }
    .no-address p { margin: 0 0 16px; font-size: 14px; }
    .add-addr-btn-empty {
      padding: 10px 24px; background: #ff6b35; color: white; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    }
    .add-addr-btn-empty:hover { background: #e55a28; }

    .address-card {
      display: flex; gap: 12px; padding: 14px; border: 2px solid #e5e7eb;
      border-radius: 10px; cursor: pointer; transition: all 0.15s; margin-bottom: 10px;
    }
    .address-card:last-child { margin-bottom: 0; }
    .address-card:hover { border-color: #fca471; }
    .address-card.active { border-color: #ff6b35; background: #fff7f3; }
    .addr-radio { padding-top: 2px; }
    .radio-dot {
      width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; transition: all 0.15s;
    }
    .radio-dot.selected { border-color: #ff6b35; }
    .radio-dot.selected::after {
      content: ''; width: 10px; height: 10px; background: #ff6b35; border-radius: 50%;
    }
    .addr-content { flex: 1; }
    .addr-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
    .addr-name { font-weight: 600; font-size: 14px; color: #1f2937; }
    .addr-phone { font-size: 13px; color: #6b7280; }
    .addr-badge {
      font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f3f4f6; color: #6b7280;
    }
    .addr-badge.default { background: #fef3c7; color: #92400e; }
    .addr-detail { font-size: 13px; color: #4b5563; margin: 0 0 8px; line-height: 1.4; }
    .addr-actions { display: flex; gap: 12px; }
    .addr-actions button {
      background: none; border: none; font-size: 13px; color: #ff6b35;
      cursor: pointer; padding: 0; font-weight: 500;
    }
    .addr-actions button:hover { text-decoration: underline; }

    /* Order Items */
    .order-items { display: flex; flex-direction: column; gap: 10px; }
    .order-item {
      display: flex; align-items: center; gap: 12px; padding: 10px; background: #f9fafb; border-radius: 8px;
    }
    .oi-img { width: 56px; height: 56px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
    .oi-img img { width: 100%; height: 100%; object-fit: cover; }
    .oi-no-img {
      width: 100%; height: 100%; background: #e5e7eb;
      display: flex; align-items: center; justify-content: center; color: #9ca3af;
    }
    .oi-info { flex: 1; min-width: 0; }
    .oi-name {
      font-size: 14px; font-weight: 500; color: #1f2937;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .oi-seller { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .oi-qty { font-size: 13px; color: #6b7280; flex-shrink: 0; }
    .oi-price { font-size: 14px; font-weight: 600; color: #ff6b35; flex-shrink: 0; }

    /* Notes */
    textarea {
      width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 14px; resize: vertical; outline: none; font-family: inherit;
      box-sizing: border-box;
    }
    textarea:focus { border-color: #ff6b35; }

    /* Summary Sidebar */
    .summary-sidebar { position: sticky; top: 24px; }
    .summary-card {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px;
    }
    .summary-card h3 { font-size: 17px; font-weight: 700; color: #1f2937; margin: 0 0 20px; }
    .summary-row {
      display: flex; justify-content: space-between; font-size: 14px; color: #4b5563; padding: 8px 0;
    }
    .free { color: #16a34a; font-weight: 500; }
    .divider { height: 1px; background: #e5e7eb; margin: 12px 0; }
    .total span { font-size: 16px; font-weight: 700; color: #1f2937; }
    .payment-method { margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 8px; }
    .pm-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .pm-value { font-size: 14px; color: #1f2937; font-weight: 500; display: flex; align-items: center; gap: 6px; }
    .pm-value i { color: #ff6b35; }
    .place-order-btn {
      width: 100%; padding: 14px; background: #ff6b35; color: white; border: none;
      border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
      margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .place-order-btn:hover:not(:disabled) { background: #e55a28; }
    .place-order-btn:disabled { background: #d1d5db; cursor: not-allowed; }
    .error-msg { color: #dc2626; font-size: 13px; text-align: center; margin-top: 10px; }

    /* Success Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    }
    .modal-box {
      background: white; border-radius: 16px; padding: 40px; text-align: center;
      max-width: 440px; width: 90%;
    }
    .success-icon i { font-size: 56px; color: #16a34a; }
    .modal-box h3 { font-size: 22px; font-weight: 700; color: #1f2937; margin: 16px 0 8px; }
    .modal-box p { color: #4b5563; font-size: 14px; margin: 0 0 4px; }
    .sub-text { color: #9ca3af !important; font-size: 13px !important; }
    .modal-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: center; }
    .modal-btn {
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none;
    }
    .modal-btn.secondary { background: #f3f4f6; color: #374151; }
    .modal-btn.secondary:hover { background: #e5e7eb; }
    .modal-btn.primary { background: #ff6b35; color: white; }
    .modal-btn.primary:hover { background: #e55a28; }

    .eta-banner {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 12px 16px; margin: 16px 0 0; color: #92400e; font-size: 14px; font-weight: 500;
    }
    .eta-banner i { font-size: 18px; color: #d97706; }

    /* Map */
    .map-section { margin-top: 16px; }
    .map-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .map-header label {
      font-size: 13px; font-weight: 600; color: #374151;
      display: flex; align-items: center; gap: 6px;
    }
    .map-header label i { color: #ff6b35; font-size: 14px; }
    .locate-btn {
      display: flex; align-items: center; gap: 5px; padding: 6px 12px;
      background: white; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 12px; color: #374151; cursor: pointer; transition: all 0.2s;
    }
    .locate-btn:hover:not(:disabled) { border-color: #ff6b35; color: #ff6b35; }
    .locate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .locate-btn i { font-size: 12px; }
    .address-map {
      width: 100%; height: 260px; border-radius: 10px; border: 1px solid #d1d5db;
      overflow: hidden; z-index: 0;
    }
    .map-hint {
      font-size: 12px; color: #9ca3af; margin: 6px 0 0; text-align: center;
    }

    @media (max-width: 768px) {
      .checkout-layout { grid-template-columns: 1fr; }
      .summary-sidebar { position: static; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutItems: any[] = [];
  addresses: any[] = [];
  selectedAddressId = '';
  orderNotes = '';
  showAddressForm = false;
  editingAddress: any = null;
  savingAddress = false;
  placingOrder = false;
  orderSuccess = false;
  placedOrderNumber = '';
  placedOrderEta = '';
  errorMsg = '';

  addressForm: any = {
    label: 'Home',
    fullName: '',
    phone: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    postalCode: '',
    streetAddress: '',
    isDefault: false,
    latitude: null as number | null,
    longitude: null as number | null,
  };

  map: L.Map | null = null;
  marker: L.Marker | null = null;
  geocoding = false;

  constructor(
    private router: Router,
    private addressService: AddressService,
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['items']) {
      this.checkoutItems = nav.extras.state['items'];
    }
  }

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.checkoutItems.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }
    this.loadAddresses();
  }

  loadAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.addresses = res.data;
          const def = this.addresses.find((a: any) => a.isDefault);
          if (def) this.selectedAddressId = def.id;
          else if (this.addresses.length > 0) this.selectedAddressId = this.addresses[0].id;
        }
        this.cdr.detectChanges();
      },
    });
  }

  get subtotal(): number {
    return this.checkoutItems.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);
  }

  get totalQty(): number {
    return this.checkoutItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  }

  saveAddress() {
    const f = this.addressForm;
    if (!f.fullName || !f.phone || !f.region || !f.province || !f.city || !f.barangay || !f.postalCode || !f.streetAddress) {
      return;
    }
    this.savingAddress = true;
    const obs = this.editingAddress
      ? this.addressService.updateAddress(this.editingAddress.id, f)
      : this.addressService.addAddress(f);

    obs.subscribe({
      next: (res: any) => {
        this.savingAddress = false;
        if (res.success) {
          this.showAddressForm = false;
          this.editingAddress = null;
          this.resetAddressForm();
          this.loadAddresses();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingAddress = false;
        this.cdr.detectChanges();
      },
    });
  }

  editAddress(addr: any, event: Event) {
    event.stopPropagation();
    this.editingAddress = addr;
    this.addressForm = {
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      region: addr.region,
      province: addr.province,
      city: addr.city,
      barangay: addr.barangay,
      postalCode: addr.postalCode,
      streetAddress: addr.streetAddress,
      isDefault: addr.isDefault,
      latitude: addr.latitude || null,
      longitude: addr.longitude || null,
    };
    this.showAddressForm = true;
    this.initMap();
  }

  deleteAddr(addr: any, event: Event) {
    event.stopPropagation();
    this.addressService.deleteAddress(addr.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadAddresses();
        }
        this.cdr.detectChanges();
      },
    });
  }

  setDefault(addr: any, event: Event) {
    event.stopPropagation();
    this.addressService.setDefault(addr.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadAddresses();
        }
        this.cdr.detectChanges();
      },
    });
  }

  cancelAddressForm() {
    this.showAddressForm = false;
    this.editingAddress = null;
    this.destroyMap();
    this.resetAddressForm();
  }

  resetAddressForm() {
    this.addressForm = {
      label: 'Home', fullName: '', phone: '', region: '', province: '',
      city: '', barangay: '', postalCode: '', streetAddress: '', isDefault: false,
      latitude: null, longitude: null,
    };
  }

  openAddressForm() {
    this.showAddressForm = true;
    this.initMap();
  }

  initMap() {
    setTimeout(() => {
      this.destroyMap();

      const lat = this.addressForm.latitude || 12.8797;
      const lng = this.addressForm.longitude || 121.7740;
      const zoom = this.addressForm.latitude ? 16 : 6;

      this.map = L.map('address-map').setView([lat, lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(this.map);

      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.addressForm.latitude = pos.lat;
        this.addressForm.longitude = pos.lng;
        this.cdr.detectChanges();
      });

      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.marker!.setLatLng(e.latlng);
        this.addressForm.latitude = e.latlng.lat;
        this.addressForm.longitude = e.latlng.lng;
        this.cdr.detectChanges();
      });

      // Try GPS if no existing coordinates
      if (!this.addressForm.latitude && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const gLat = pos.coords.latitude;
            const gLng = pos.coords.longitude;
            this.map?.setView([gLat, gLng], 15);
            this.marker?.setLatLng([gLat, gLng]);
            this.addressForm.latitude = gLat;
            this.addressForm.longitude = gLng;
            this.cdr.detectChanges();
          },
          () => {}
        );
      }

      setTimeout(() => this.map?.invalidateSize(), 100);
    }, 50);
  }

  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  locateFromAddress() {
    const f = this.addressForm;
    const parts = [f.streetAddress, f.barangay, f.city, f.province, f.region, 'Philippines'].filter(Boolean);
    const query = parts.join(', ');
    if (!query.replace(/Philippines/i, '').replace(/,\s*/g, '').trim()) return;

    this.geocoding = true;
    this.cdr.detectChanges();

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        this.geocoding = false;
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          this.map?.setView([lat, lng], 16);
          this.marker?.setLatLng([lat, lng]);
          this.addressForm.latitude = lat;
          this.addressForm.longitude = lng;
        }
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.geocoding = false;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  placeOrder() {
    if (!this.selectedAddressId) {
      this.errorMsg = 'Please select a delivery address';
      return;
    }

    this.errorMsg = '';
    this.placingOrder = true;
    const cartItemIds = this.checkoutItems.map((item: any) => item.id);

    this.orderService.placeOrder({
      addressId: this.selectedAddressId,
      cartItemIds,
      notes: this.orderNotes || undefined,
    }).subscribe({
      next: (res: any) => {
        this.placingOrder = false;
        if (res.success) {
          this.orderSuccess = true;
          this.placedOrderNumber = res.data.orderNumber;
          this.placedOrderEta = res.data.estimatedDelivery;
          this.cartService.refreshCartCount();
        } else {
          this.errorMsg = res.message || 'Failed to place order';
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.placingOrder = false;
        this.errorMsg = err.error?.message || 'Failed to place order';
        this.cdr.detectChanges();
      },
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goToOrders() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'orders' } });
  }
}
