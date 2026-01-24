/**
 * Message Controller
 * Handles message/chat endpoints
 */

import { getMessages, sendMessage, markMessagesAsRead, getUnreadCount } from '../services/message/message.service.js';
import { successResponse, errorResponse, badRequestResponse, createdResponse } from '../utils/response.util.js';

/**
 * Get messages for an appointment
 */
export const getAppointmentMessages = async (req, res) => {
  try {
    const result = await getMessages(req.params.appointmentId);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { messages: result.messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return errorResponse(res, 'Failed to fetch messages');
  }
};

/**
 * Send a message (with optional file attachment)
 */
export const createMessage = async (req, res) => {
  try {
    const { appointmentId, senderId, senderType, content } = req.body;

    // Must have either content or attachment
    if (!appointmentId || !senderId || !senderType || (!content && !req.file)) {
      return badRequestResponse(res, 'Missing required fields');
    }

    // Process uploaded file if any
    const attachment = req.file ? {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null;

    const result = await sendMessage({ appointmentId, senderId, senderType, content: content || '', attachment });

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return createdResponse(res, { message: result.message }, result.msg);
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse(res, 'Failed to send message');
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { appointmentId, recipientType } = req.body;

    if (!appointmentId || !recipientType) {
      return badRequestResponse(res, 'Missing required fields');
    }

    const result = await markMessagesAsRead(appointmentId, recipientType);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, {}, 'Messages marked as read');
  } catch (error) {
    console.error('Mark messages read error:', error);
    return errorResponse(res, 'Failed to mark messages as read');
  }
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = async (req, res) => {
  try {
    const { appointmentId, recipientType } = req.query;

    if (!appointmentId || !recipientType) {
      return badRequestResponse(res, 'Missing required fields');
    }

    const result = await getUnreadCount(appointmentId, recipientType);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return errorResponse(res, 'Failed to get unread count');
  }
};

export default {
  getAppointmentMessages,
  createMessage,
  markAsRead,
  getUnreadMessageCount
};
