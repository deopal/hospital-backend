/**
 * Video Consultation Routes
 *
 * Endpoints for video consultation management.
 */

import express from 'express';
import {
  createRoom,
  getRoom,
  getAppointmentRoom,
  validateAccess,
  endRoom
} from '../controllers/video.controller.js';

const router = express.Router();

// Create a video room for an appointment
router.post('/video/room', createRoom);

// Get video room details by room ID
router.get('/video/room/:roomId', getRoom);

// Get active video room for an appointment
router.get('/video/appointment/:appointmentId/room', getAppointmentRoom);

// Validate if user can access a room
router.post('/video/room/:roomId/validate', validateAccess);

// End a video consultation
router.post('/video/room/:roomId/end', endRoom);

export default router;
