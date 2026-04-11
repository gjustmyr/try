import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SellerService } from '../services/seller.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-seller-settings',
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
          <a class="nav-item" (click)="navigate('/seller/orders')">
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
          <a class="nav-item active">
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
            <h1>Settings</h1>
            <p class="breadcrumb">Home / Settings</p>
          </div>
        </header>

        <div class="dashboard-content">
          <!-- Shop Profile Section -->
          <div class="settings-section">
            <h3><i class="pi pi-shop" style="margin-right: 8px;"></i>Store Profile</h3>
            <p class="section-desc">Update your store information visible to customers</p>

            @if (isLoadingProfile) {
              <div class="loading-state" style="padding: 20px 0;">
                <i class="pi pi-spin pi-spinner"></i>
                <p>Loading profile...</p>
              </div>
            } @else {
              <div class="settings-form-group">
                <label>Store Name</label>
                <input
                  type="text"
                  [(ngModel)]="profileForm.shopName"
                  placeholder="Your store name"
                />
              </div>
              <div class="settings-form-group">
                <label>Store Description</label>
                <textarea
                  [(ngModel)]="profileForm.shopDescription"
                  placeholder="Tell customers about your store..."
                  rows="3"
                  style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; box-sizing: border-box;"
                ></textarea>
              </div>
              <div class="settings-form-group">
                <label>Phone</label>
                <input type="text" [(ngModel)]="profileForm.phone" placeholder="Contact number" />
              </div>
              <div class="settings-form-group">
                <label>Business Address</label>
                <textarea
                  [(ngModel)]="profileForm.businessAddress"
                  placeholder="Your business address"
                  rows="2"
                  style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; box-sizing: border-box;"
                ></textarea>
              </div>

              <!-- Store Location Map -->
              <div class="settings-form-group">
                <label
                  ><i class="pi pi-map-marker" style="margin-right: 6px; color: #ff6b35;"></i>Store
                  Location</label
                >
                <p style="font-size: 12px; color: #6b7280; margin: 0 0 10px;">
                  Click on the map to set your store's location. This is used for shipping route
                  display.
                </p>
                <div
                  id="sellerLocationMap"
                  style="width: 100%; height: 300px; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden;"
                ></div>
                <div
                  style="display: flex; gap: 12px; margin-top: 8px;"
                  *ngIf="profileForm.latitude && profileForm.longitude"
                >
                  <span
                    style="font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 4px 10px; border-radius: 6px;"
                  >
                    <i class="pi pi-map-marker" style="color: #ff6b35; margin-right: 4px;"></i>
                    {{ profileForm.latitude | number: '1.5-5' }},
                    {{ profileForm.longitude | number: '1.5-5' }}
                  </span>
                </div>
              </div>

              <div class="settings-actions">
                <button class="save-btn" (click)="updateProfile()" [disabled]="isSavingProfile">
                  @if (isSavingProfile) {
                    <i class="pi pi-spin pi-spinner"></i> Saving...
                  } @else {
                    <i class="pi pi-check"></i> Save Profile
                  }
                </button>
              </div>
              @if (profileMsg) {
                <p [class]="profileMsgType === 'success' ? 'success-msg' : 'error-msg'">
                  {{ profileMsg }}
                </p>
              }
            }
          </div>

          <!-- Change Password Section -->
          <div class="settings-section">
            <h3><i class="pi pi-lock" style="margin-right: 8px;"></i>Change Password</h3>
            <p class="section-desc">Update your account password for security</p>

            <div class="settings-form-group">
              <label>Current Password</label>
              <input
                type="password"
                [(ngModel)]="passwordForm.currentPassword"
                placeholder="Enter current password"
              />
            </div>
            <div class="settings-form-group">
              <label>New Password</label>
              <input
                type="password"
                [(ngModel)]="passwordForm.newPassword"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div class="settings-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                [(ngModel)]="passwordForm.confirmPassword"
                placeholder="Confirm new password"
              />
            </div>
            <div class="settings-actions">
              <button class="save-btn" (click)="changePassword()" [disabled]="isChangingPassword">
                @if (isChangingPassword) {
                  <i class="pi pi-spin pi-spinner"></i> Changing...
                } @else {
                  <i class="pi pi-lock"></i> Change Password
                }
              </button>
            </div>
            @if (passwordMsg) {
              <p [class]="passwordMsgType === 'success' ? 'success-msg' : 'error-msg'">
                {{ passwordMsg }}
              </p>
            }
          </div>

          <!-- Account Info Section -->
          <div class="settings-section">
            <h3><i class="pi pi-info-circle" style="margin-right: 8px;"></i>Account Information</h3>
            <p class="section-desc">Your account details</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <span
                  style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;"
                  >Email</span
                >
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1f2937;">{{ userEmail }}</p>
              </div>
              <div>
                <span
                  style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;"
                  >Account Type</span
                >
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1f2937;">Seller</p>
              </div>
              <div>
                <span
                  style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;"
                  >Seller ID</span
                >
                <p
                  style="margin: 4px 0 0 0; font-size: 14px; color: #1f2937; font-family: monospace;"
                >
                  {{ sellerId }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class SellerSettingsComponent implements OnInit, OnDestroy {
  shopName = '';
  sellerId = '';
  userId = '';
  userEmail = '';
  isLoadingProfile = false;
  isSavingProfile = false;
  isChangingPassword = false;
  profileMsg = '';
  profileMsgType = '';
  passwordMsg = '';
  passwordMsgType = '';

  profileForm: any = {
    shopName: '',
    shopDescription: '',
    phone: '',
    businessAddress: '',
    latitude: null as number | null,
    longitude: null as number | null,
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  private locationMap: any = null;
  private locationMarker: any = null;

  constructor(
    private authService: AuthService,
    private sellerService: SellerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.seller) {
      this.shopName = user.seller.shopName;
      this.sellerId = user.seller.id;
      this.userId = user.id;
      this.userEmail = user.email;
      this.loadProfile();
    }
  }

  loadProfile() {
    this.isLoadingProfile = true;
    this.sellerService.getSellerProfile(this.userId).subscribe({
      next: (res: any) => {
        this.isLoadingProfile = false;
        if (res.success && res.data) {
          this.profileForm = {
            shopName: res.data.shopName || '',
            shopDescription: res.data.shopDescription || '',
            phone: res.data.phone || '',
            businessAddress: res.data.businessAddress || '',
            latitude: res.data.latitude ? parseFloat(res.data.latitude) : null,
            longitude: res.data.longitude ? parseFloat(res.data.longitude) : null,
          };
        }
        this.cdr.detectChanges();
        setTimeout(() => this.initLocationMap(), 200);
      },
      error: () => {
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
        setTimeout(() => this.initLocationMap(), 200);
      },
    });
  }

  initLocationMap() {
    if (this.locationMap) return;
    const mapEl = document.getElementById('sellerLocationMap');
    if (!mapEl) return;

    const defaultLat = this.profileForm.latitude || 14.5995;
    const defaultLng = this.profileForm.longitude || 120.9842;
    const defaultZoom = this.profileForm.latitude ? 15 : 6;

    this.locationMap = L.map('sellerLocationMap').setView([defaultLat, defaultLng], defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.locationMap);

    // Place existing marker if lat/lng saved
    if (this.profileForm.latitude && this.profileForm.longitude) {
      this.placeMarker(this.profileForm.latitude, this.profileForm.longitude);
    }

    // Click to set location
    this.locationMap.on('click', (e: any) => {
      this.profileForm.latitude = parseFloat(e.latlng.lat.toFixed(7));
      this.profileForm.longitude = parseFloat(e.latlng.lng.toFixed(7));
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.cdr.detectChanges();
    });
  }

  placeMarker(lat: number, lng: number) {
    const icon = L.divIcon({
      html: '<div style="background:#ff6b35;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:white;border-radius:50%"></div></div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (this.locationMarker) {
      this.locationMarker.setLatLng([lat, lng]);
    } else {
      this.locationMarker = L.marker([lat, lng], { icon }).addTo(this.locationMap);
    }
  }

  ngOnDestroy() {
    if (this.locationMap) this.locationMap.remove();
  }

  updateProfile() {
    this.isSavingProfile = true;
    this.profileMsg = '';
    this.sellerService.updateSellerProfile(this.sellerId, this.profileForm).subscribe({
      next: (res: any) => {
        this.isSavingProfile = false;
        if (res.success) {
          this.shopName = this.profileForm.shopName;
          const stored = localStorage.getItem('currentUser');
          if (stored) {
            const user = JSON.parse(stored);
            if (user.seller) {
              user.seller.shopName = this.profileForm.shopName;
            }
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.authService.updateCurrentUser(user);
          }
          this.profileMsg = 'Profile updated successfully!';
          this.profileMsgType = 'success';
        } else {
          this.profileMsg = res.message || 'Failed to update profile.';
          this.profileMsgType = 'error';
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.profileMsg = error.error?.message || 'Failed to update profile.';
        this.profileMsgType = 'error';
        this.cdr.detectChanges();
      },
    });
  }

  changePassword() {
    this.passwordMsg = '';

    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      this.passwordMsg = 'Please fill in all password fields.';
      this.passwordMsgType = 'error';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordMsg = 'New password must be at least 6 characters.';
      this.passwordMsgType = 'error';
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordMsg = 'New passwords do not match.';
      this.passwordMsgType = 'error';
      return;
    }

    this.isChangingPassword = true;
    this.sellerService
      .changePassword({
        currentPassword: this.passwordForm.currentPassword,
        newPassword: this.passwordForm.newPassword,
      })
      .subscribe({
        next: (res: any) => {
          this.isChangingPassword = false;
          if (res.success) {
            this.passwordMsg = 'Password changed successfully!';
            this.passwordMsgType = 'success';
            this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          } else {
            this.passwordMsg = res.message || 'Failed to change password.';
            this.passwordMsgType = 'error';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isChangingPassword = false;
          this.passwordMsg = error.error?.message || 'Failed to change password.';
          this.passwordMsgType = 'error';
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
