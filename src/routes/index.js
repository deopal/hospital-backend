/**
 * Routes module index
 * Combines all routes into a single router
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import doctorRoutes from './doctor.routes.js';
import patientRoutes from './patient.routes.js';
import messageRoutes from './message.routes.js';
import adminRoutes from './admin.routes.js';
import videoRoutes from './video.routes.js';

const router = express.Router();

// Mount all routes
router.use(authRoutes);
router.use(doctorRoutes);
router.use(patientRoutes);
router.use(messageRoutes);
router.use(adminRoutes);
router.use(videoRoutes);

export default router;
