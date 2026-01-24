/**
 * Video Consultation Service
 *
 * Handles video room creation, management, and signaling coordination.
 */

import { v4 as uuidv4 } from 'uuid';
import { videoRoomRepository, appointmentRepository, notificationRepository } from '../../repositories/index.js';
import { AppointmentStatus, NotificationType, RecipientType } from '../../config/constants.js';

/**
 * Create a new video room for an appointment
 *
 * @param {string} appointmentId - The appointment ID
 * @param {string} startedBy - 'doctor' or 'patient'
 * @returns {Promise<Object>} The created video room
 */
export const createVideoRoom = async (appointmentId, startedBy) => {
  // Get appointment details
  const appointment = await appointmentRepository.findByIdWithDetails(appointmentId);

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  if (appointment.status !== AppointmentStatus.APPROVED) {
    throw new Error('Video consultation is only available for approved appointments');
  }

  // Check if there's already an active room for this appointment
  const existingRoom = await videoRoomRepository.findActiveRoomByAppointment(appointmentId);
  if (existingRoom) {
    return existingRoom;
  }

  // Create new room
  const roomId = uuidv4();
  const room = await videoRoomRepository.createRoom({
    roomId,
    appointmentId,
    doctorId: appointment.doctorId._id || appointment.doctorId,
    patientId: appointment.patientId._id || appointment.patientId,
    status: 'waiting',
    startedBy,
    participants: []
  });

  // Send notification to the other party
  const recipientType = startedBy === 'doctor' ? RecipientType.PATIENT : RecipientType.DOCTOR;
  const recipientId = startedBy === 'doctor'
    ? (appointment.patientId._id || appointment.patientId)
    : (appointment.doctorId._id || appointment.doctorId);

  await notificationRepository.create({
    recipientId,
    recipientType,
    type: NotificationType.VIDEO_CALL_STARTED,
    title: 'Video Call Started',
    message: startedBy === 'doctor'
      ? `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName} has started a video consultation. Click to join.`
      : `${appointment.patientId.fullName} is waiting for you in the video consultation room.`,
    data: {
      appointmentId,
      roomId,
      startedBy
    }
  });

  return await videoRoomRepository.getRoomWithDetails(roomId);
};

/**
 * Get video room details
 *
 * @param {string} roomId - The room UUID
 * @returns {Promise<Object>} Room details
 */
export const getVideoRoom = async (roomId) => {
  const room = await videoRoomRepository.getRoomWithDetails(roomId);
  if (!room) {
    throw new Error('Video room not found');
  }
  return room;
};

/**
 * Get active video room for an appointment
 *
 * @param {string} appointmentId - The appointment ID
 * @returns {Promise<Object|null>} Active room or null
 */
export const getActiveRoomForAppointment = async (appointmentId) => {
  return await videoRoomRepository.findActiveRoomByAppointment(appointmentId);
};

/**
 * Join a video room
 *
 * @param {string} roomId - The room UUID
 * @param {Object} participant - Participant details
 * @returns {Promise<Object>} Updated room
 */
export const joinVideoRoom = async (roomId, participant) => {
  const room = await videoRoomRepository.findByRoomId(roomId);

  if (!room) {
    throw new Error('Video room not found');
  }

  if (room.status === 'ended') {
    throw new Error('This video consultation has ended');
  }

  // Add participant to room
  await videoRoomRepository.addParticipant(roomId, {
    userId: participant.userId,
    userType: participant.userType,
    joinedAt: new Date(),
    socketId: participant.socketId
  });

  // If both participants are present, mark room as active
  const updatedRoom = await videoRoomRepository.findByRoomId(roomId);
  if (updatedRoom.participants.length >= 2 && room.status === 'waiting') {
    await videoRoomRepository.updateRoomStatus(roomId, 'active', {
      startedAt: new Date()
    });
  }

  return await videoRoomRepository.getRoomWithDetails(roomId);
};

/**
 * Leave a video room
 *
 * @param {string} roomId - The room UUID
 * @param {string} socketId - The socket ID of the leaving participant
 * @returns {Promise<Object>} Updated room
 */
export const leaveVideoRoom = async (roomId, socketId) => {
  await videoRoomRepository.removeParticipant(roomId, socketId);
  return await videoRoomRepository.getRoomWithDetails(roomId);
};

/**
 * End a video consultation
 *
 * @param {string} roomId - The room UUID
 * @param {string} endedBy - 'doctor' or 'patient'
 * @returns {Promise<Object>} Ended room
 */
export const endVideoRoom = async (roomId, endedBy) => {
  const room = await videoRoomRepository.findByRoomId(roomId);

  if (!room) {
    throw new Error('Video room not found');
  }

  if (room.status === 'ended') {
    return room;
  }

  const endedRoom = await videoRoomRepository.endRoom(roomId, endedBy);

  // Send notification that call ended
  const recipientType = endedBy === 'doctor' ? RecipientType.PATIENT : RecipientType.DOCTOR;
  const recipientId = endedBy === 'doctor' ? room.patientId._id : room.doctorId._id;

  await notificationRepository.create({
    recipientId,
    recipientType,
    type: NotificationType.VIDEO_CALL_ENDED,
    title: 'Video Call Ended',
    message: `The video consultation has ended. Duration: ${formatDuration(endedRoom.duration)}`,
    data: {
      appointmentId: room.appointmentId,
      roomId,
      duration: endedRoom.duration
    }
  });

  return endedRoom;
};

/**
 * Validate if user can access a video room
 *
 * @param {string} roomId - The room UUID
 * @param {string} userId - The user ID
 * @param {string} userType - 'doctor' or 'patient'
 * @returns {Promise<boolean>} Whether user can access
 */
export const canAccessRoom = async (roomId, userId, userType) => {
  const room = await videoRoomRepository.findByRoomId(roomId);

  if (!room) {
    return false;
  }

  if (userType === 'doctor') {
    return room.doctorId._id?.toString() === userId || room.doctorId.toString() === userId;
  } else {
    return room.patientId._id?.toString() === userId || room.patientId.toString() === userId;
  }
};

/**
 * Format duration in seconds to human readable string
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes} min ${remainingSeconds} sec`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export default {
  createVideoRoom,
  getVideoRoom,
  getActiveRoomForAppointment,
  joinVideoRoom,
  leaveVideoRoom,
  endVideoRoom,
  canAccessRoom
};
