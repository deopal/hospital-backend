/**
 * Message Repository
 * Data access layer for message-related operations
 */

import { Message } from '../models/index.js';
import { BaseRepository } from './base.repository.js';

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  /**
   * Get messages for an appointment
   */
  async getByAppointmentId(appointmentId, options = {}) {
    const { limit = 100, before } = options;

    const query = { appointmentId };
    if (before) {
      query.createdAt = { $lt: before };
    }

    return await this.model.find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  /**
   * Create a new message
   */
  async createMessage(messageData) {
    return await this.create(messageData);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(appointmentId, recipientType) {
    // Mark messages as read where the sender is NOT the recipient
    const senderType = recipientType === 'Doctors' ? 'Patients' : 'Doctors';

    return await this.model.updateMany(
      {
        appointmentId,
        senderType,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );
  }

  /**
   * Get unread message count for an appointment
   */
  async getUnreadCount(appointmentId, recipientType) {
    const senderType = recipientType === 'Doctors' ? 'Patients' : 'Doctors';

    return await this.count({
      appointmentId,
      senderType,
      isRead: false
    });
  }

  /**
   * Delete all messages for an appointment
   */
  async deleteByAppointmentId(appointmentId) {
    return await this.deleteMany({ appointmentId });
  }
}

// Export singleton instance
export const messageRepository = new MessageRepository();
export default messageRepository;
