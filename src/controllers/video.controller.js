/**
 * Video Consultation Controller
 *
 * Handles HTTP requests for video consultation management.
 */

import {
  createVideoRoom,
  getVideoRoom,
  getActiveRoomForAppointment,
  endVideoRoom,
  canAccessRoom
} from '../services/video/video.service.js';
import { HttpStatus } from '../config/constants.js';

/**
 * Create or get a video room for an appointment
 *
 * POST /api/video/room
 * Body: { appointmentId, userType }
 */
export const createRoom = async (req, res) => {
  try {
    const { appointmentId, userType } = req.body;

    if (!appointmentId || !userType) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'appointmentId and userType are required'
      });
    }

    if (!['doctor', 'patient'].includes(userType)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'userType must be "doctor" or "patient"'
      });
    }

    const room = await createVideoRoom(appointmentId, userType);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Video room created successfully',
      data: room
    });
  } catch (error) {
    console.error('[Video Controller] Error creating room:', error);
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get video room details
 *
 * GET /api/video/room/:roomId
 */
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await getVideoRoom(roomId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('[Video Controller] Error getting room:', error);
    res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get active video room for an appointment
 *
 * GET /api/video/appointment/:appointmentId/room
 */
export const getAppointmentRoom = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const room = await getActiveRoomForAppointment(appointmentId);

    if (!room) {
      return res.status(HttpStatus.OK).json({
        success: true,
        data: null,
        message: 'No active video room for this appointment'
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('[Video Controller] Error getting appointment room:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Validate if user can access a video room
 *
 * POST /api/video/room/:roomId/validate
 * Body: { userId, userType }
 */
export const validateAccess = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'userId and userType are required'
      });
    }

    const hasAccess = await canAccessRoom(roomId, userId, userType);

    res.status(HttpStatus.OK).json({
      success: true,
      data: { hasAccess }
    });
  } catch (error) {
    console.error('[Video Controller] Error validating access:', error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * End a video consultation
 *
 * POST /api/video/room/:roomId/end
 * Body: { userType }
 */
export const endRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userType } = req.body;

    if (!userType) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'userType is required'
      });
    }

    const room = await endVideoRoom(roomId, userType);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Video consultation ended',
      data: room
    });
  } catch (error) {
    console.error('[Video Controller] Error ending room:', error);
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  createRoom,
  getRoom,
  getAppointmentRoom,
  validateAccess,
  endRoom
};
