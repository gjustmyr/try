import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>About EzyMart</h4>
            <p>
              Your trusted multi-vendor marketplace connecting buyers with quality sellers
              worldwide.
            </p>
            <div class="social-links">
              <a><i class="pi pi-facebook"></i></a>
              <a><i class="pi pi-twitter"></i></a>
              <a><i class="pi pi-instagram"></i></a>
              <a><i class="pi pi-youtube"></i></a>
            </div>
          </div>
          <div class="footer-section">
            <h4>Customer Service</h4>
            <ul>
              <li><i class="pi pi-angle-right"></i> Help Center</li>
              <li><i class="pi pi-angle-right"></i> Track Order</li>
              <li><i class="pi pi-angle-right"></i> Returns & Refunds</li>
              <li><i class="pi pi-angle-right"></i> Shipping Info</li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>For Sellers</h4>
            <ul>
              <li routerLink="/seller-register">
                <i class="pi pi-angle-right"></i> Sell on Platform
              </li>
              <li><i class="pi pi-angle-right"></i> Seller Dashboard</li>
              <li><i class="pi pi-angle-right"></i> Guidelines</li>
              <li><i class="pi pi-angle-right"></i> Fees & Pricing</li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><i class="pi pi-angle-right"></i> About Us</li>
              <li><i class="pi pi-angle-right"></i> Contact</li>
              <li><i class="pi pi-angle-right"></i> Privacy Policy</li>
              <li><i class="pi pi-angle-right"></i> Terms of Service</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 EzyMart Marketplace. All rights reserved.</p>
          <div class="payment-methods">
            <i class="pi pi-credit-card"></i>
            <i class="pi pi-paypal"></i>
            <i class="pi pi-wallet"></i>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background: #f9fafb;
        color: #6b7280;
        padding: 64px 0 32px;
        border-top: 1px solid #e5e7eb;
      }
      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .footer-content {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 48px;
        margin-bottom: 32px;
      }
      .footer-section h4 {
        font-size: 16px;
        margin-bottom: 16px;
        font-weight: 600;
        color: #1f2937;
      }
      .footer-section p {
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .social-links {
        display: flex;
        gap: 8px;
      }
      .social-links a {
        width: 36px;
        height: 36px;
        background: #e5e7eb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }
      .social-links a:hover {
        background: #ff6b35;
        color: white;
      }
      .footer-section ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .footer-section li {
        color: #6b7280;
        margin-bottom: 10px;
        cursor: pointer;
        transition: color 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
      }
      .footer-section li:hover {
        color: #ff6b35;
      }
      .footer-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 13px;
      }
      .footer-bottom p {
        margin: 0;
      }
      .payment-methods {
        display: flex;
        gap: 12px;
        font-size: 20px;
        color: #6b7280;
      }

      @media (max-width: 1024px) {
        .footer-content {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 768px) {
        .footer-content {
          grid-template-columns: 1fr;
        }
        .footer-bottom {
          flex-direction: column;
          gap: 12px;
          text-align: center;
        }
      }
    `,
  ],
})
export class FooterComponent {}
