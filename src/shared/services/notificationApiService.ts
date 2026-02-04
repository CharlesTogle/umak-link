/**
 * Notification API Service
 * Wraps backend API calls for notification operations
 */

import api from '@/shared/lib/api';
import type { SendNotificationRequest, NotificationRecord, AnnouncementRecord } from '@/shared/lib/api-types';

export const notificationApiService = {
  /**
   * Send a notification (staff only)
   */
  async sendNotification(params: SendNotificationRequest): Promise<{ success: boolean; notification_id: number }> {
    try {
      return await api.notifications.send(params);
    } catch (error) {
      console.error('[notificationApiService] Send notification error:', error);
      throw error;
    }
  },

  /**
   * List user's notifications
   */
  async listNotifications(): Promise<NotificationRecord[]> {
    try {
      const response = await api.notifications.list();
      return response.notifications;
    } catch (error) {
      console.error('[notificationApiService] List notifications error:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.notifications.getCount();
      return response.unread_count;
    } catch (error) {
      console.error('[notificationApiService] Get unread count error:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<{ success: boolean }> {
    try {
      return await api.notifications.markAsRead(notificationId);
    } catch (error) {
      console.error('[notificationApiService] Mark as read error:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<{ success: boolean }> {
    try {
      return await api.notifications.delete(notificationId);
    } catch (error) {
      console.error('[notificationApiService] Delete notification error:', error);
      throw error;
    }
  },

  /**
   * Send global announcement (staff only)
   */
  async sendAnnouncement(params: {
    userId: string;
    message: string;
    description?: string | null;
    imageUrl?: string | null;
  }): Promise<{ success: boolean }> {
    try {
      return await api.announcements.send({
        user_id: params.userId,
        message: params.message,
        description: params.description,
        image_url: params.imageUrl,
      });
    } catch (error) {
      console.error('[notificationApiService] Send announcement error:', error);
      throw error;
    }
  },

  /**
   * List announcements
   */
  async listAnnouncements(): Promise<AnnouncementRecord[]> {
    try {
      const response = await api.announcements.list();
      return response.announcements;
    } catch (error) {
      console.error('[notificationApiService] List announcements error:', error);
      throw error;
    }
  },
};

export default notificationApiService;
