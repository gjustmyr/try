import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../components/navbar.component';
import { FooterComponent } from '../components/footer.component';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="cart-page">
      <div class="container">
        <h2 class="page-title">
          <i class="pi pi-shopping-cart"></i> My Cart
          <span class="item-count" *ngIf="cartItems.length">({{ cartItems.length }} item{{ cartItems.length > 1 ? 's' : '' }})</span>
        </h2>

        <!-- Loading -->
        <div class="loading-state" *ngIf="isLoading">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading your cart...</p>
        </div>

        <!-- Empty Cart -->
        <div class="empty-cart" *ngIf="!isLoading && cartItems.length === 0">
          <i class="pi pi-shopping-cart"></i>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <button class="shop-btn" (click)="goHome()">
            <i class="pi pi-arrow-left"></i> Continue Shopping
          </button>
        </div>

        <!-- Cart Content -->
        <div class="cart-layout" *ngIf="!isLoading && cartItems.length > 0">
          <div class="cart-items">
            <!-- Select All -->
            <div class="select-all-bar">
              <label class="checkbox-label">
                <input type="checkbox" [checked]="isAllSelected" (change)="toggleSelectAll()" />
                <span class="custom-checkbox" [class.checked]="isAllSelected"><i class="pi pi-check" *ngIf="isAllSelected"></i></span>
                <span>Select All ({{ cartItems.length }})</span>
              </label>
              <span class="selected-info" *ngIf="selectedCount > 0">{{ selectedCount }} selected</span>
            </div>

            <div class="cart-item" *ngFor="let item of cartItems" [class.selected]="item.selected">
              <label class="item-checkbox">
                <input type="checkbox" [(ngModel)]="item.selected" />
                <span class="custom-checkbox" [class.checked]="item.selected"><i class="pi pi-check" *ngIf="item.selected"></i></span>
              </label>
              <div class="item-image" (click)="goToProduct(item.product.id)">
                <img *ngIf="item.product.images?.length" [src]="item.product.images[0].url" [alt]="item.product.name" />
                <div class="no-img" *ngIf="!item.product.images?.length">
                  <i class="pi pi-image"></i>
                </div>
              </div>

              <div class="item-details">
                <div class="item-top">
                  <div>
                    <h4 class="item-name" (click)="goToProduct(item.product.id)">{{ item.product.name }}</h4>
                    <p class="item-seller" *ngIf="item.product.seller" (click)="goToShop(item.product.seller.id)">{{ item.product.seller.shopName }}</p>
                  </div>
                  <button class="remove-btn" (click)="removeItem(item.id)">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>

                <div class="item-bottom">
                  <div class="qty-controls">
                    <button (click)="updateQuantity(item, item.quantity - 1)" [disabled]="item.quantity <= 1">
                      <i class="pi pi-minus"></i>
                    </button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button (click)="updateQuantity(item, item.quantity + 1)" [disabled]="item.quantity >= item.product.quantity">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>
                  <div class="item-price">
                    <span class="current-price">₱{{ (item.product.price * item.quantity) | number:'1.2-2' }}</span>
                    <span class="unit-price" *ngIf="item.quantity > 1">₱{{ item.product.price | number:'1.2-2' }} each</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="order-summary">
            <h3>Order Summary</h3>
            <div class="no-selection" *ngIf="selectedCount === 0">
              <p>Select items to checkout</p>
            </div>
            <ng-container *ngIf="selectedCount > 0">
              <div class="summary-row">
                <span>Subtotal ({{ selectedTotalItems }} item{{ selectedTotalItems > 1 ? 's' : '' }})</span>
                <span>₱{{ selectedSubtotal | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span class="free-shipping">Free</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total-row">
                <span>Total</span>
                <span>₱{{ selectedSubtotal | number:'1.2-2' }}</span>
              </div>
            </ng-container>
            <button class="checkout-btn" [disabled]="selectedCount === 0" (click)="proceedToCheckout()">
              <i class="pi pi-credit-card"></i> Proceed to Checkout{{ selectedCount > 0 ? ' (' + selectedCount + ')' : '' }}
            </button>
            <button class="continue-btn" (click)="goHome()">
              <i class="pi pi-arrow-left"></i> Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    .cart-page {
      min-height: calc(100vh - 120px);
      background: #f9fafb;
      padding: 32px 0;
    }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
    .page-title {
      font-size: 22px; font-weight: 700; color: #1f2937;
      display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
    }
    .page-title i { font-size: 24px; }
    .item-count { font-size: 15px; font-weight: 400; color: #6b7280; }

    .loading-state, .empty-cart {
      text-align: center; padding: 80px 20px; background: white;
      border-radius: 12px; border: 1px solid #e5e7eb;
    }
    .loading-state i, .empty-cart > i {
      font-size: 48px; color: #d1d5db; margin-bottom: 16px;
    }
    .loading-state i { color: #ff6b35; }
    .empty-cart h3 { font-size: 18px; color: #1f2937; margin-bottom: 8px; }
    .empty-cart p { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .shop-btn {
      display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
      background: #ff6b35; color: white; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .shop-btn:hover { background: #e55a28; }

    .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }

    .cart-items { display: flex; flex-direction: column; gap: 12px; }
    .cart-item {
      display: flex; gap: 16px; padding: 16px; background: white;
      border-radius: 12px; border: 1px solid #e5e7eb; transition: box-shadow 0.2s;
    }
    .cart-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

    .item-image {
      width: 110px; height: 110px; border-radius: 8px; overflow: hidden;
      flex-shrink: 0; cursor: pointer; background: #f3f4f6;
    }
    .item-image img { width: 100%; height: 100%; object-fit: cover; }
    .no-img {
      width: 100%; height: 100%; display: flex; align-items: center;
      justify-content: center; color: #d1d5db; font-size: 28px;
    }

    .item-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .item-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .item-name {
      font-size: 15px; font-weight: 600; color: #1f2937; cursor: pointer;
      margin: 0 0 4px 0;
    }
    .item-name:hover { color: #ff6b35; }
    .item-seller { font-size: 13px; color: #6b7280; margin: 0; cursor: pointer; transition: color 0.15s; }
    .item-seller:hover { color: #ff6b35; text-decoration: underline; }
    .remove-btn {
      background: none; border: none; color: #9ca3af; cursor: pointer;
      padding: 4px; border-radius: 4px; transition: all 0.2s;
    }
    .remove-btn:hover { color: #ef4444; background: #fef2f2; }
    .remove-btn i { font-size: 15px; }

    .item-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .qty-controls {
      display: flex; align-items: center; gap: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
    }
    .qty-controls button {
      width: 32px; height: 32px; border: none; background: #f9fafb;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #374151; transition: background 0.2s;
    }
    .qty-controls button:hover:not(:disabled) { background: #e5e7eb; }
    .qty-controls button:disabled { color: #d1d5db; cursor: not-allowed; }
    .qty-controls i { font-size: 11px; }
    .qty-value { width: 40px; text-align: center; font-size: 14px; font-weight: 600; color: #1f2937; }

    .item-price { text-align: right; }
    .current-price { font-size: 16px; font-weight: 700; color: #ff6b35; display: block; }
    .unit-price { font-size: 12px; color: #9ca3af; }

    /* Order Summary */
    .order-summary {
      background: white; border-radius: 12px; border: 1px solid #e5e7eb;
      padding: 24px; position: sticky; top: 24px;
    }
    .order-summary h3 { font-size: 17px; font-weight: 700; color: #1f2937; margin: 0 0 20px 0; }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 14px; color: #4b5563; padding: 8px 0;
    }
    .free-shipping { color: #16a34a; font-weight: 500; }
    .summary-divider { height: 1px; background: #e5e7eb; margin: 12px 0; }
    .total-row span { font-size: 16px; font-weight: 700; color: #1f2937; }
    .checkout-btn {
      width: 100%; padding: 14px; background: #ff6b35; color: white; border: none;
      border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
      margin-top: 20px; display: flex; align-items: center; justify-content: center;
      gap: 8px; transition: background 0.2s;
    }
    .checkout-btn:hover:not(:disabled) { background: #e55a28; }
    .checkout-btn:disabled { background: #d1d5db; cursor: not-allowed; }
    .continue-btn {
      width: 100%; padding: 12px; background: transparent; color: #6b7280;
      border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; font-weight: 500;
      cursor: pointer; margin-top: 10px; display: flex; align-items: center;
      justify-content: center; gap: 8px; transition: all 0.2s;
    }
    .continue-btn:hover { border-color: #1f2937; color: #1f2937; }

    /* Select All Bar */
    .select-all-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: white; border-radius: 10px;
      border: 1px solid #e5e7eb;
    }
    .checkbox-label {
      display: flex; align-items: center; gap: 10px; cursor: pointer;
      font-size: 14px; font-weight: 500; color: #374151; user-select: none;
    }
    .checkbox-label input, .item-checkbox input { display: none; }
    .custom-checkbox {
      width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s; flex-shrink: 0;
    }
    .custom-checkbox.checked {
      background: #ff6b35; border-color: #ff6b35;
    }
    .custom-checkbox i { font-size: 12px; color: white; font-weight: 700; }
    .selected-info { font-size: 13px; color: #ff6b35; font-weight: 500; }
    .item-checkbox {
      display: flex; align-items: center; cursor: pointer; flex-shrink: 0; align-self: center;
    }
    .cart-item.selected { border-color: #ff6b35; background: #fff7f3; }
    .no-selection { text-align: center; padding: 12px 0; }
    .no-selection p { color: #9ca3af; font-size: 14px; margin: 0; }


    @media (max-width: 768px) {
      .cart-layout { grid-template-columns: 1fr; }
      .order-summary { position: static; }
      .item-image { width: 80px; height: 80px; }
    }
  `],
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCart();
  }

  loadCart() {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.cartItems = res.data || [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cartItems = [];
        this.cdr.detectChanges();
      },
    });
  }

  get selectedItems(): any[] {
    return this.cartItems.filter((item) => item.selected);
  }

  get selectedCount(): number {
    return this.selectedItems.length;
  }

  get isAllSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every((item) => item.selected);
  }

  get selectedSubtotal(): number {
    return this.selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  get selectedTotalItems(): number {
    return this.selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  toggleSelectAll() {
    const newVal = !this.isAllSelected;
    this.cartItems.forEach((item) => (item.selected = newVal));
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateQuantity(item: any, newQty: number) {
    if (newQty < 1 || newQty > item.product.quantity) return;
    this.cartService.updateCartItem(item.id, newQty).subscribe({
      next: (res: any) => {
        if (res.success) {
          item.quantity = newQty;
          this.cdr.detectChanges();
        }
      },
    });
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.cartItems = this.cartItems.filter((i) => i.id !== itemId);
          this.cdr.detectChanges();
        }
      },
    });
  }

  goToProduct(productId: string) {
    this.router.navigate(['/product', productId]);
  }

  goToShop(sellerId: string) {
    if (sellerId) {
      this.router.navigate(['/shop', sellerId]);
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  proceedToCheckout() {
    if (this.selectedCount === 0) return;
    this.router.navigate(['/checkout'], { state: { items: this.selectedItems } });
  }
}
