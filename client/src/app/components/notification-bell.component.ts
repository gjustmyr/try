import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notification-bell">
      <button
        class="bell-button"
        (click)="toggleDropdown()"
        [class.has-notifications]="unreadCount() > 0"
      >
        <i class="pi pi-bell"></i>
        @if (unreadCount() > 0) {
          <span class="badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
        }
      </button>

      @if (showDropdown()) {
        <div class="notification-dropdown">
          <div class="dropdown-header">
            <h3>Notifications</h3>
            @if (notifications().length > 0) {
              <button class="mark-all-read" (click)="markAllAsRead()">Mark all read</button>
            }
          </div>

          <div class="notification-list">
            @if (loading()) {
              <div class="loading">Loading...</div>
            } @else if (notifications().length === 0) {
              <div class="empty-state">
                <i class="pi pi-bell-slash"></i>
                <p>No notifications yet</p>
              </div>
            } @else {
              @for (notification of notifications(); track notification.id) {
                <div
                  class="notification-item"
                  [class.unread]="!notification.isRead"
                  (click)="handleNotificationClick(notification)"
                >
                  <div class="notification-icon">
                    <i [class]="getNotificationIcon(notification.type)"></i>
                  </div>
                  <div class="notification-content">
                    <h4>{{ notification.title }}</h4>
                    <p>{{ notification.message }}</p>
                    <span class="time">{{ getTimeAgo(notification.createdAt) }}</span>
                  </div>
                  @if (!notification.isRead) {
                    <div class="unread-dot"></div>
                  }
                </div>
              }
            }
          </div>

          @if (notifications().length > 0) {
            <div class="dropdown-footer">
              <button class="clear-all" (click)="clearAllRead()">Clear read notifications</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .notification-bell {
        position: relative;
      }

      .bell-button {
        position: relative;
        background: none;
        border: none;
        color: #666;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.3s;
      }

      .bell-button:hover {
        background: #f5f5f5;
        color: #333;
      }

      .bell-button.has-notifications {
        color: #ff6b6b;
      }

      .badge {
        position: absolute;
        top: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        font-size: 0.65rem;
        font-weight: bold;
        padding: 0.15rem 0.35rem;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }

      .notification-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        width: 380px;
        max-height: 500px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        flex-direction: column;
      }

      .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
      }

      .dropdown-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .mark-all-read {
        background: none;
        border: none;
        color: #007bff;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
      }

      .mark-all-read:hover {
        text-decoration: underline;
      }

      .notification-list {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
      }

      .loading,
      .empty-state {
        padding: 2rem;
        text-align: center;
        color: #999;
      }

      .empty-state i {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        opacity: 0.3;
      }

      .notification-item {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        border-bottom: 1px solid #f5f5f5;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
      }

      .notification-item:hover {
        background: #f9f9f9;
      }

      .notification-item.unread {
        background: #f0f8ff;
      }

      .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e3f2fd;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2196f3;
      }

      .notification-content {
        flex: 1;
        min-width: 0;
      }

      .notification-content h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #333;
      }

      .notification-content p {
        margin: 0 0 0.25rem 0;
        font-size: 0.85rem;
        color: #666;
        line-height: 1.4;
      }

      .notification-content .time {
        font-size: 0.75rem;
        color: #999;
      }

      .unread-dot {
        position: absolute;
        top: 1.25rem;
        right: 1rem;
        width: 8px;
        height: 8px;
        background: #2196f3;
        border-radius: 50%;
      }

      .dropdown-footer {
        padding: 0.75rem;
        border-top: 1px solid #eee;
        text-align: center;
      }

      .clear-all {
        background: none;
        border: none;
        color: #666;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.5rem;
      }

      .clear-all:hover {
        color: #333;
        text-decoration: underline;
      }
    `,
  ],
})
export class NotificationBellComponent implements OnInit {
  showDropdown = signal(false);
  loading = signal(false);
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    // Load initial notifications if user is logged in
    if (this.authService.isAuthenticated()) {
      this.loadNotifications();
      this.notificationService.refreshUnreadCount();
    }

    // Subscribe to unread count changes
    this.unreadCount = this.notificationService.unreadCount;
  }

  toggleDropdown() {
    this.showDropdown.update((v) => !v);
    if (this.showDropdown()) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.loading.set(true);
    this.notificationService.getNotifications(20, 0, false).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.data);
          this.unreadCount.set(res.unreadCount);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.loading.set(false);
      },
    });
  }

  handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.loadNotifications();
        },
      });
    }

    // Navigate to order if orderId exists
    if (notification.orderId) {
      window.location.href = `/profile?tab=orders`;
    }

    this.showDropdown.set(false);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
    });
  }

  clearAllRead() {
    this.notificationService.deleteAllRead().subscribe({
      next: () => {
        this.loadNotifications();
      },
    });
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      order_placed: 'pi pi-shopping-cart',
      order_confirmed: 'pi pi-check-circle',
      order_processing: 'pi pi-cog',
      order_shipped: 'pi pi-truck',
      order_delivered: 'pi pi-check',
      order_cancelled: 'pi pi-times-circle',
      delivery_assigned: 'pi pi-user',
      delivery_picked_up: 'pi pi-box',
      delivery_in_transit: 'pi pi-map-marker',
      delivery_out_for_delivery: 'pi pi-send',
      delivery_at_hub: 'pi pi-building',
      payment_success: 'pi pi-dollar',
      payment_failed: 'pi pi-exclamation-triangle',
    };
    return iconMap[type] || 'pi pi-bell';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}
