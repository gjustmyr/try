import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="logo-section">
          <i class="pi pi-shopping-bag"></i>
        </div>

        <!-- Step 1: Registration Form -->
        <ng-container *ngIf="step === 'register'">
          <h2>Create Account</h2>
          <p class="subtitle">Sign up to start shopping</p>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form (ngSubmit)="onSubmit()">
            <div class="input-group">
              <label>Full Name</label>
              <input
                type="text"
                [(ngModel)]="fullName"
                name="fullName"
                placeholder="Full Name"
                required
              />
            </div>

            <div class="input-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="email" name="email" placeholder="Email" required />
            </div>

            <div class="input-group">
              <label>Password</label>
              <div class="password-wrapper">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Password (min 6 characters)"
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
              <label>Confirm Password</label>
              <div class="password-wrapper">
                <input
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm Password"
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

            <button type="submit" class="submit-btn" [disabled]="loading">
              {{ loading ? 'Creating Account...' : 'Create Account' }}
            </button>

            <p class="terms">
              By creating an account, you agree to our <a>Terms of service</a> and
              <a>Privacy policy</a>
            </p>
          </form>
        </ng-container>

        <!-- Step 2: OTP Verification -->
        <ng-container *ngIf="step === 'verify'">
          <h2>Verify Your Email</h2>
          <p class="subtitle">We sent a 6-digit code to <strong>{{ email }}</strong></p>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>
          <div class="success-msg" *ngIf="successMessage">{{ successMessage }}</div>

          <form (ngSubmit)="onVerify()">
            <div class="input-group">
              <label>Verification Code</label>
              <input
                type="text"
                [(ngModel)]="otp"
                name="otp"
                placeholder="Enter 6-digit code"
                maxlength="6"
                required
              />
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading">
              {{ loading ? 'Verifying...' : 'Verify Email' }}
            </button>

            <p class="resend-text">
              Didn't receive the code?
              <a (click)="onResendOtp()" [class.disabled]="resendLoading">
                {{ resendLoading ? 'Sending...' : 'Resend Code' }}
              </a>
            </p>
          </form>
        </ng-container>
      </div>

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

      .register-card {
        width: 100%;
        max-width: 400px;
        margin-bottom: 24px;
      }

      .logo-section {
        text-align: center;
        margin-bottom: 32px;
      }

      .logo-section i {
        font-size: 56px;
        color: #000000;
      }

      h2 {
        font-size: 24px;
        font-weight: 700;
        color: #000000;
        margin: 0 0 8px 0;
        text-align: center;
      }

      .subtitle {
        font-size: 14px;
        color: #666666;
        text-align: center;
        margin: 0 0 32px 0;
      }

      .subtitle strong {
        color: #000000;
      }

      .error-msg {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 16px;
        text-align: center;
      }

      .success-msg {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #16a34a;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 16px;
        text-align: center;
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
        color: #000000;
      }

      input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s;
        background: #ffffff;
      }

      input:focus {
        border-color: #000000;
      }

      input::placeholder {
        color: #9ca3af;
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
      }

      .submit-btn:hover:not(:disabled) {
        background: #e55a28;
      }

      .submit-btn:disabled {
        opacity: 0.7;
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
        color: #000000;
        text-decoration: underline;
        cursor: pointer;
      }

      .resend-text {
        font-size: 13px;
        color: #6b7280;
        text-align: center;
        margin: 4px 0 0 0;
      }

      .resend-text a {
        color: #ff6b35;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
      }

      .resend-text a:hover {
        text-decoration: underline;
      }

      .resend-text a.disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      .bottom-link {
        font-size: 14px;
        color: #6b7280;
        text-align: center;
        margin-bottom: 80px;
      }

      .bottom-link a {
        color: #000000;
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
        .register-card {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class RegisterComponent {
  step: 'register' | 'verify' = 'register';
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  otp = '';
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  resendLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onSubmit() {
    this.errorMessage = '';

    if (!this.fullName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.authService.register(this.fullName, this.email, this.password).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success === true) {
          this.step = 'verify';
        } else {
          this.errorMessage = response.message || 'Registration failed';
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  onVerify() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code';
      return;
    }

    this.loading = true;
    this.authService.verifyEmail(this.email, this.otp).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success === true) {
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = response.message || 'Verification failed';
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
      },
    });
  }

  onResendOtp() {
    this.errorMessage = '';
    this.successMessage = '';
    this.resendLoading = true;

    this.authService.resendOtp(this.email).subscribe({
      next: (response: any) => {
        this.resendLoading = false;
        if (response.success === true) {
          this.successMessage = 'A new code has been sent to your email';
        } else {
          this.errorMessage = response.message || 'Failed to resend code';
        }
      },
      error: (error: any) => {
        this.resendLoading = false;
        this.errorMessage = error.error?.message || 'Failed to resend code. Please try again.';
      },
    });
  }
}
