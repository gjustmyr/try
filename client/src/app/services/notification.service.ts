import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  // Signal for unread count
  unreadCount = signal<number>(0);

  // Signal for notifications list
  notifications = signal<Notification[]>([]);

  constructor(private http: HttpClient) {
    // Poll for new notifications every 30 seconds
    interval(30000).subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  getNotifications(limit = 50, offset = 0, unreadOnly = false): Observable<any> {
    return this.http.get(`${this.apiUrl}`, {
      params: {
        limit: limit.toString(),
        offset: offset.toString(),
        unreadOnly: unreadOnly.toString(),
      },
    });
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  deleteAllRead(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/read/all`);
  }

  // Helper method to refresh unread count
  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (res) => {
        if (res.success) {
          this.unreadCount.set(res.data.count);
        }
      },
      error: (err) => console.error('Failed to refresh unread count:', err),
    });
  }

  // Helper method to refresh notifications list
  refreshNotifications(limit = 50, unreadOnly = false): void {
    this.getNotifications(limit, 0, unreadOnly).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.data);
          this.unreadCount.set(res.unreadCount);
        }
      },
      error: (err) => console.error('Failed to refresh notifications:', err),
    });
  }
}
