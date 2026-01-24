/**
 * Message Service
 * Business logic for appointment messaging
 */

import mongoose from 'mongoose';
import { messageRepository, appointmentRepository } from '../../repositories/index.js';

const { ObjectId } = mongoose.Types;

/**
 * Get messages for an appointment
 */
export const getMessages = async (appointmentId) => {
  if (!ObjectId.isValid(appointmentId)) {
    return { error: 'Invalid appointment ID' };
  }

  const messages = await messageRepository.getByAppointmentId(appointmentId);
  return { success: true, messages };
};

/**
 * Send a message
 */
export const sendMessage = async (messageData) => {
  const { appointmentId, senderId, senderType, content, attachment } = messageData;

  // Validate IDs
  if (!ObjectId.isValid(appointmentId) || !ObjectId.isValid(senderId)) {
    return { error: 'Invalid appointment or sender ID' };
  }

  // Verify appointment exists and is approved
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) {
    return { error: 'Appointment not found' };
  }

  if (appointment.status !== 'approved') {
    return { error: 'Messages can only be sent for approved appointments' };
  }

  // Verify sender is part of the appointment
  const isDoctor = senderType === 'Doctors' && appointment.doctorId.toString() === senderId;
  const isPatient = senderType === 'Patients' && appointment.patientId.toString() === senderId;

  if (!isDoctor && !isPatient) {
    return { error: 'You are not authorized to send messages for this appointment' };
  }

  // Create message data
  const messagePayload = {
    appointmentId: new ObjectId(appointmentId),
    senderId: new ObjectId(senderId),
    senderType,
    content
  };

  // Add attachment if present
  if (attachment) {
    messagePayload.attachment = attachment;
  }

  // Create message
  const message = await messageRepository.createMessage(messagePayload);

  return {
    success: true,
    message,
    msg: 'Message sent successfully'
  };
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (appointmentId, recipientType) => {
  if (!ObjectId.isValid(appointmentId)) {
    return { error: 'Invalid appointment ID' };
  }

  await messageRepository.markAsRead(appointmentId, recipientType);
  return { success: true };
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (appointmentId, recipientType) => {
  if (!ObjectId.isValid(appointmentId)) {
    return { error: 'Invalid appointment ID' };
  }

  const count = await messageRepository.getUnreadCount(appointmentId, recipientType);
  return { success: true, count };
};

export default {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount
};
