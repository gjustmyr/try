import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SellerService } from '../services/seller.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [SellerService],
  template: `
    <div class="register-container">
      @if (currentStep === 'form') {
        <div class="register-card">
          <div class="logo-section">
            <i class="pi pi-briefcase"></i>
          </div>

          <h2>Become a Seller</h2>
          <p class="subtitle">Start selling on our marketplace</p>

          <form (ngSubmit)="onSubmit()">
            <div class="input-group">
              <label>Store Name <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="shopName"
                name="shopName"
                placeholder="Your store name"
                required
              />
            </div>

            <div class="input-group">
              <label>Full Name <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                placeholder="Your full name"
                required
              />
            </div>

            <div class="input-group">
              <label>Email <span class="required">*</span></label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="Your email address"
                required
              />
            </div>

            <div class="input-group">
              <label>Phone Number <span class="required">*</span></label>
              <input
                type="tel"
                [(ngModel)]="phone"
                name="phone"
                placeholder="Your phone number"
                required
              />
            </div>

            <div class="input-group">
              <label>Business Type <span class="required">*</span></label>
              <select [(ngModel)]="businessType" name="businessType" required>
                <option value="">Select business type</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>

            <div class="input-group">
              <label>Business Registration Number</label>
              <input
                type="text"
                [(ngModel)]="businessRegNumber"
                name="businessRegNumber"
                placeholder="Registration number (if applicable)"
              />
            </div>

            <div class="input-group">
              <label>Business Address <span class="required">*</span></label>
              <textarea
                [(ngModel)]="businessAddress"
                name="businessAddress"
                placeholder="Your business address"
                rows="3"
                required
              ></textarea>
            </div>

            <div class="divider">
              <span>Document Uploads</span>
            </div>

            <div class="upload-section">
              <div class="upload-group">
                <label>
                  <i class="pi pi-id-card"></i>
                  Government ID <span class="required">*</span>
                </label>
                <div class="file-input-wrapper">
                  <input
                    type="file"
                    (change)="onFileSelect($event, 'governmentId')"
                    accept=".pdf,.jpg,.jpeg,.png"
                    id="governmentId"
                  />
                  <label for="governmentId" class="file-label">
                    <i class="pi pi-upload"></i>
                    <span>{{ governmentIdFile ? governmentIdFile.name : 'Choose file' }}</span>
                  </label>
                </div>
                <small>PDF, JPG, PNG (Max 5MB)</small>
              </div>

              <div class="upload-group">
                <label>
                  <i class="pi pi-file"></i>
                  Business License <span class="required">*</span>
                </label>
                <div class="file-input-wrapper">
                  <input
                    type="file"
                    (change)="onFileSelect($event, 'businessLicense')"
                    accept=".pdf,.jpg,.jpeg,.png"
                    id="businessLicense"
                  />
                  <label for="businessLicense" class="file-label">
                    <i class="pi pi-upload"></i>
                    <span>{{
                      businessLicenseFile ? businessLicenseFile.name : 'Choose file'
                    }}</span>
                  </label>
                </div>
                <small>PDF, JPG, PNG (Max 5MB)</small>
              </div>

              <div class="upload-group">
                <label>
                  <i class="pi pi-building"></i>
                  Proof of Address
                </label>
                <div class="file-input-wrapper">
                  <input
                    type="file"
                    (change)="onFileSelect($event, 'proofOfAddress')"
                    accept=".pdf,.jpg,.jpeg,.png"
                    id="proofOfAddress"
                  />
                  <label for="proofOfAddress" class="file-label">
                    <i class="pi pi-upload"></i>
                    <span>{{ proofOfAddressFile ? proofOfAddressFile.name : 'Choose file' }}</span>
                  </label>
                </div>
                <small>Utility bill, bank statement (Optional)</small>
              </div>

              <div class="upload-group">
                <label>
                  <i class="pi pi-money-bill"></i>
                  Tax Certificate
                </label>
                <div class="file-input-wrapper">
                  <input
                    type="file"
                    (change)="onFileSelect($event, 'taxCertificate')"
                    accept=".pdf,.jpg,.jpeg,.png"
                    id="taxCertificate"
                  />
                  <label for="taxCertificate" class="file-label">
                    <i class="pi pi-upload"></i>
                    <span>{{ taxCertificateFile ? taxCertificateFile.name : 'Choose file' }}</span>
                  </label>
                </div>
                <small>Tax ID or certificate (Optional)</small>
              </div>
            </div>

            <div class="divider">
              <span>Account Security</span>
            </div>

            <div class="input-group">
              <label>Password <span class="required">*</span></label>
              <div class="password-wrapper">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Create a password"
                  required
                />
                <i
                  class="pi toggle-icon"
                  [class.pi-eye]="!showPassword"
                  [class.pi-eye-slash]="showPassword"
                  (click)="togglePassword()"
                >
                </i>
              </div>
            </div>

            <div class="input-group">
              <label>Confirm Password <span class="required">*</span></label>
              <div class="password-wrapper">
                <input
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  required
                />
                <i
                  class="pi toggle-icon"
                  [class.pi-eye]="!showConfirmPassword"
                  [class.pi-eye-slash]="showConfirmPassword"
                  (click)="toggleConfirmPassword()"
                >
                </i>
              </div>
            </div>

            <button type="submit" class="submit-btn" [disabled]="isSubmitting">
              @if (isSubmitting) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Submitting...</span>
              } @else {
                <span>Submit Application</span>
              }
            </button>

            <p class="terms">
              By applying, you agree to our <a>Seller Terms</a> and <a>Privacy policy</a>
            </p>
          </form>
        </div>
      }

      @if (currentStep === 'verification') {
        <div class="verification-card">
          <div class="icon-success">
            <i class="pi pi-envelope"></i>
          </div>
          <h2>Verify Your Email</h2>
          <p class="message">We've sent a 6-digit OTP code to:</p>
          <p class="email-display">{{ email }}</p>
          <p class="instruction">Please enter the OTP code below to verify your email.</p>

          <form (ngSubmit)="verifyOtp()">
            <div class="otp-input-group">
              <input
                type="text"
                [(ngModel)]="otpCode"
                name="otpCode"
                placeholder="Enter 6-digit OTP"
                maxlength="6"
                pattern="[0-9]{6}"
                class="otp-input"
                required
              />
            </div>

            @if (otpError) {
              <p class="error-text">{{ otpError }}</p>
            }

            <button
              type="submit"
              class="verify-btn"
              [disabled]="isVerifying || otpCode.length !== 6"
            >
              @if (isVerifying) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Verifying...</span>
              } @else {
                <span>Verify OTP</span>
              }
            </button>
          </form>

          <div class="verification-actions">
            <button
              class="resend-btn"
              (click)="resendOtp()"
              [disabled]="resendCooldown > 0"
              type="button"
            >
              @if (resendCooldown > 0) {
                <span>Resend in {{ resendCooldown }}s</span>
              } @else {
                <i class="pi pi-refresh"></i>
                <span>Resend OTP</span>
              }
            </button>
          </div>

          <p class="note">
            <i class="pi pi-info-circle"></i>
            Didn't receive the OTP? Check your spam folder or try resending.
          </p>
          <p class="note">
            <i class="pi pi-clock"></i>
            OTP expires in 15 minutes.
          </p>
        </div>
      }

      @if (currentStep === 'pending') {
        <div class="pending-card">
          <div class="icon-pending">
            <i class="pi pi-clock"></i>
          </div>
          <h2>Application Under Review</h2>
          <p class="message">Thank you for submitting your seller application!</p>

          <div class="status-info">
            <div class="status-item">
              <i class="pi pi-check-circle"></i>
              <span>Email Verified</span>
            </div>
            <div class="status-item">
              <i class="pi pi-check-circle"></i>
              <span>Documents Submitted</span>
            </div>
            <div class="status-item pending">
              <i class="pi pi-clock"></i>
              <span>Pending Admin Approval</span>
            </div>
          </div>

          <p class="instruction">
            Our team is reviewing your application and documents. This typically takes 2-3 business
            days. We'll send you an email once your application is approved.
          </p>

          <button class="home-btn" (click)="goToHome()">
            <i class="pi pi-home"></i>
            <span>Back to Home</span>
          </button>
        </div>
      }

      <p class="bottom-link">Already have an account? <a (click)="goToLogin()">Sign in</a></p>

      <div class="footer">
        <a>Privacy policy</a>
      </div>
    </div>
  `,
  styles: [
    `
      .register-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        padding: 40px 20px;
      }

      .register-card,
      .verification-card,
      .pending-card {
        width: 100%;
        max-width: 500px;
        margin-bottom: 24px;
      }

      .logo-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .logo-section i {
        font-size: 56px;
        color: #1f2937;
      }

      h2 {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 8px 0;
        text-align: center;
      }

      .subtitle {
        font-size: 14px;
        color: #6b7280;
        text-align: center;
        margin: 0 0 32px 0;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      label {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .required {
        color: #ff6b35;
      }

      input,
      select,
      textarea {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s;
        background: #ffffff;
        color: #1f2937;
        font-family: inherit;
      }

      textarea {
        resize: vertical;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: #ff6b35;
      }

      input::placeholder,
      textarea::placeholder {
        color: #9ca3af;
      }

      select {
        cursor: pointer;
      }

      .password-wrapper {
        position: relative;
      }

      .password-wrapper input {
        padding-right: 45px;
      }

      .toggle-icon {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
        font-size: 18px;
        cursor: pointer;
      }

      .divider {
        display: flex;
        align-items: center;
        text-align: center;
        margin: 16px 0 8px 0;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid #e5e7eb;
      }

      .divider span {
        padding: 0 16px;
        color: #6b7280;
        font-size: 13px;
        font-weight: 600;
      }

      .upload-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #f9fafb;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .upload-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .file-input-wrapper input[type='file'] {
        display: none;
      }

      .file-label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: white;
        border: 1px dashed #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        color: #6b7280;
      }

      .file-label:hover {
        border-color: #ff6b35;
        background: #fff5f2;
      }

      .file-label i {
        color: #ff6b35;
        font-size: 16px;
      }

      .upload-group small {
        color: #9ca3af;
        font-size: 12px;
      }

      .submit-btn {
        width: 100%;
        padding: 13px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .submit-btn:hover:not(:disabled) {
        background: #e55a28;
      }

      .submit-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      .terms {
        font-size: 13px;
        color: #6b7280;
        text-align: center;
        margin: 8px 0 0 0;
        line-height: 1.5;
      }

      .terms a {
        color: #1f2937;
        text-decoration: underline;
        cursor: pointer;
      }

      /* Verification Card */
      .verification-card,
      .pending-card {
        text-align: center;
      }

      .icon-success,
      .icon-pending {
        width: 80px;
        height: 80px;
        background: #f9fafb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
      }

      .icon-success i {
        font-size: 40px;
        color: #ff6b35;
      }

      .icon-pending i {
        font-size: 40px;
        color: #6b7280;
      }

      .message {
        font-size: 15px;
        color: #6b7280;
        margin-bottom: 16px;
      }

      .email-display {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 24px;
      }

      .instruction {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 32px;
      }

      .otp-input-group {
        margin: 24px 0;
      }

      .otp-input {
        width: 100%;
        padding: 16px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 24px;
        font-weight: 600;
        text-align: center;
        letter-spacing: 8px;
        outline: none;
        transition: border-color 0.2s;
      }

      .otp-input:focus {
        border-color: #ff6b35;
      }

      .error-text {
        color: #ef4444;
        font-size: 14px;
        text-align: center;
        margin: 12px 0;
      }

      .verify-btn {
        width: 100%;
        padding: 13px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .verify-btn:hover:not(:disabled) {
        background: #e55a28;
      }

      .verify-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      .verification-actions {
        margin: 24px 0;
      }

      .resend-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 24px;
        background: #f9fafb;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
      }

      .resend-btn:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
      }

      .resend-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .note {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        color: #9ca3af;
        padding: 16px;
        background: #f9fafb;
        border-radius: 6px;
      }

      .note i {
        color: #6b7280;
      }

      /* Pending Card */
      .status-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 32px 0;
        padding: 24px;
        background: #f9fafb;
        border-radius: 8px;
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #1f2937;
        font-weight: 500;
      }

      .status-item i {
        font-size: 18px;
        color: #10b981;
      }

      .status-item.pending i {
        color: #f59e0b;
      }

      .home-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 32px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 14px;
        margin-top: 16px;
      }

      .home-btn:hover {
        background: #e55a28;
      }

      .bottom-link {
        font-size: 14px;
        color: #6b7280;
        text-align: center;
        margin-bottom: 80px;
      }

      .bottom-link a {
        color: #1f2937;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
      }

      .bottom-link a:hover {
        text-decoration: underline;
      }

      .footer {
        text-align: center;
      }

      .footer a {
        font-size: 13px;
        color: #6b7280;
        text-decoration: none;
        cursor: pointer;
      }

      .footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .register-card,
        .verification-card,
        .pending-card {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class SellerRegisterComponent {
  currentStep: 'form' | 'verification' | 'pending' = 'form';

  // Form fields
  shopName = '';
  fullName = '';
  email = '';
  phone = '';
  businessType = '';
  businessRegNumber = '';
  businessAddress = '';
  password = '';
  confirmPassword = '';

  // File uploads
  governmentIdFile: File | null = null;
  businessLicenseFile: File | null = null;
  proofOfAddressFile: File | null = null;
  taxCertificateFile: File | null = null;

  // UI states
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  isVerifying = false;
  resendCooldown = 0;
  errorMessage = '';
  otpCode = '';
  otpError = '';

  constructor(
    private router: Router,
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef,
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onFileSelect(event: any, fileType: string) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      switch (fileType) {
        case 'governmentId':
          this.governmentIdFile = file;
          break;
        case 'businessLicense':
          this.businessLicenseFile = file;
          break;
        case 'proofOfAddress':
          this.proofOfAddressFile = file;
          break;
        case 'taxCertificate':
          this.taxCertificateFile = file;
          break;
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  verifyOtp() {
    if (this.otpCode.length !== 6) {
      this.otpError = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.isVerifying = true;
    this.otpError = '';

    this.sellerService.verifyOtp(this.email, this.otpCode).subscribe({
      next: (response) => {
        console.log('OTP verification response:', response);
        this.isVerifying = false;

        if (!response.success) {
          this.otpError = response.message || 'Invalid or expired OTP. Please try again.';
          this.cdr.detectChanges();
          return;
        }

        this.currentStep = 'pending';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('OTP verification error:', error);
        this.isVerifying = false;
        this.otpError = error.error?.message || 'Invalid or expired OTP. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  resendOtp() {
    if (this.resendCooldown > 0) return;

    this.sellerService.resendOtp(this.email).subscribe({
      next: (response) => {
        console.log('Resend OTP response:', response);

        if (!response.success) {
          this.otpError = response.message || 'Failed to resend OTP. Please try again.';
          return;
        }

        this.otpCode = '';
        this.otpError = '';
        this.resendCooldown = 60;
        const interval = setInterval(() => {
          this.resendCooldown--;
          if (this.resendCooldown <= 0) {
            clearInterval(interval);
          }
        }, 1000);
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        this.otpError = 'Failed to resend OTP. Please try again.';
      },
    });
  }

  onSubmit() {
    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      alert(this.errorMessage);
      return;
    }

    // Validate required files
    if (!this.governmentIdFile || !this.businessLicenseFile) {
      this.errorMessage =
        'Please upload all required documents (Government ID and Business License)';
      alert(this.errorMessage);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Create FormData
    const formData = new FormData();
    formData.append('shopName', this.shopName);
    formData.append('fullName', this.fullName);
    formData.append('email', this.email);
    formData.append('phone', this.phone);
    formData.append('businessType', this.businessType);
    formData.append('businessRegNumber', this.businessRegNumber);
    formData.append('businessAddress', this.businessAddress);
    formData.append('password', this.password);

    // Append files
    formData.append('governmentId', this.governmentIdFile);
    formData.append('businessLicense', this.businessLicenseFile);
    if (this.proofOfAddressFile) {
      formData.append('proofOfAddress', this.proofOfAddressFile);
    }
    if (this.taxCertificateFile) {
      formData.append('taxCertificate', this.taxCertificateFile);
    }

    // Submit to backend
    this.sellerService.registerSeller(formData).subscribe({
      next: (response) => {
        console.log('Registration response:', response);
        this.isSubmitting = false;

        if (!response.success) {
          this.errorMessage = response.message || 'Registration failed. Please try again.';
          alert(this.errorMessage);
          this.cdr.detectChanges();
          return;
        }

        this.currentStep = 'verification';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        alert(this.errorMessage);
        this.cdr.detectChanges();
      },
    });
  }
}
