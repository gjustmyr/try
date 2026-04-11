import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <i class="pi pi-shopping-bag"></i>
        </div>

        <h2>Sign in</h2>
        <p class="subtitle">Sign in or create an account</p>

        <form (ngSubmit)="onSubmit()">
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
                placeholder="Password"
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

          <button type="submit" class="submit-btn" [disabled]="isLoading">
            @if (isLoading) {
              <i class="pi pi-spin pi-spinner"></i>
              <span>Signing in...</span>
            } @else {
              <span>Continue</span>
            }
          </button>

          <p class="terms">By continuing, you agree to our <a>Terms of service</a></p>
        </form>
      </div>

      <p class="bottom-link">Don't have an account? <a (click)="goToRegister()">Sign up</a></p>

      <div class="footer">
        <a>Privacy policy</a>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        padding: 40px 20px;
      }

      .login-card {
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
        color: #000000;
        text-decoration: underline;
        cursor: pointer;
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
        .login-card {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      alert(this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.isLoading = false;

        if (!response.success) {
          this.errorMessage = response.message || 'Login failed. Please try again.';
          alert(this.errorMessage);
          return;
        }

        const userType = response.data.user.userType;

        if (userType === 'seller') {
          this.router.navigate(['/seller/dashboard']);
        } else if (userType === 'admin') {
          this.router.navigate(['/admin']);
        } else if (userType === 'driver') {
          this.router.navigate(['/driver']);
        } else if (userType === 'hub') {
          this.router.navigate(['/hub-dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        alert(this.errorMessage);
      },
    });
  }
}
