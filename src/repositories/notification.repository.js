/**
 * Notification Repository
 * Data access layer for notification-related operations
 */

import { Notification } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  /**
   * Get notifications for a recipient with pagination
   */
  async getByRecipient(recipientId, recipientType, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false
    } = options;

    const criteria = { recipientId, recipientType };

    if (unreadOnly) {
      criteria.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.model.find(criteria)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('appointmentId')
        .lean(),
      this.count(criteria),
      this.getUnreadCount(recipientId, recipientType)
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, recipientId) {
    return await this.model.findOneAndUpdate(
      { _id: notificationId, recipientId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a recipient
   */
  async markAllAsRead(recipientId, recipientType) {
    return await this.model.updateMany(
      { recipientId, recipientType, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Delete notification (with ownership check)
   */
  async deleteByIdAndRecipient(notificationId, recipientId) {
    return await this.model.findOneAndDelete({
      _id: notificationId,
      recipientId
    });
  }

  /**
   * Get unread count for a recipient
   */
  async getUnreadCount(recipientId, recipientType) {
    return await this.count({
      recipientId,
      recipientType,
      isRead: false
    });
  }

  /**
   * Delete all notifications for an appointment
   */
  async deleteByAppointmentId(appointmentId) {
    return await this.deleteMany({ appointmentId });
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
export default notificationRepository;
