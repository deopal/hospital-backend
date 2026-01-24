/**
 * Auth Routes
 * Authentication endpoints for doctors and patients
 */

import express from 'express';
import {
  doctorSignup,
  doctorSignin,
  doctorSignout,
  patientSignup,
  patientSignin,
  patientSignout,
  forgotPassword,
  verifyResetToken,
  resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

// Doctor auth
router.post('/doctor/signup', doctorSignup);
router.post('/doctor/signin', doctorSignin);
router.post('/doctor/signout', doctorSignout);

// Patient auth
router.post('/patient/signup', patientSignup);
router.post('/patient/signin', patientSignin);
router.post('/patient/signout', patientSignout);

// Password reset (shared)
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-reset-token', verifyResetToken);
router.post('/auth/reset-password', resetPassword);

export default router;
