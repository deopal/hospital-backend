/**
 * Message Routes
 * Chat/messaging endpoints for appointments
 */

import express from 'express';
import {
  getAppointmentMessages,
  createMessage,
  markAsRead,
  getUnreadMessageCount
} from '../controllers/message.controller.js';
import { uploadMessageAttachment } from '../common-middleware/upload.middleware.js';

const router = express.Router();

// Get messages for an appointment
router.get('/messages/:appointmentId', getAppointmentMessages);

// Send a message (with optional file attachment)
router.post('/messages', uploadMessageAttachment, createMessage);

// Mark messages as read
router.post('/messages/read', markAsRead);

// Get unread message count
router.get('/messages/unread', getUnreadMessageCount);

export default router;
