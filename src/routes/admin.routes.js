/**
 * Admin Routes
 * Administrative endpoints for system management
 */

import express from 'express';
import {
  signIn,
  getDashboardStats,
  getDoctors,
  getDoctor,
  approveDoctor,
  rejectDoctor,
  getPendingDoctorApprovals,
  updateDoctorStatus,
  getPatients,
  getPatient,
  updatePatientStatus,
  getAppointments,
  getContacts,
  updateContactStatus,
  changePassword,
  getCurrentAdmin
} from '../controllers/admin.controller.js';
import { requireAdminAuth } from '../common-middleware/adminAuth.middleware.js';
import { triggerReminders } from '../services/reminder/reminder.service.js';

const router = express.Router();

// Auth routes (no auth required)
router.post('/admin/signin', signIn);

// Protected routes (require admin auth)
router.get('/admin/me', requireAdminAuth, getCurrentAdmin);
router.post('/admin/change-password', requireAdminAuth, changePassword);

// Dashboard
router.get('/admin/stats', requireAdminAuth, getDashboardStats);

// Doctor management
router.get('/admin/doctors', requireAdminAuth, getDoctors);
router.get('/admin/doctors/pending', requireAdminAuth, getPendingDoctorApprovals);
router.get('/admin/doctors/:id', requireAdminAuth, getDoctor);
router.put('/admin/doctors/:id/approve', requireAdminAuth, approveDoctor);
router.put('/admin/doctors/:id/reject', requireAdminAuth, rejectDoctor);
router.put('/admin/doctors/:id/status', requireAdminAuth, updateDoctorStatus);

// Patient management
router.get('/admin/patients', requireAdminAuth, getPatients);
router.get('/admin/patients/:id', requireAdminAuth, getPatient);
router.put('/admin/patients/:id/status', requireAdminAuth, updatePatientStatus);

// Appointment management
router.get('/admin/appointments', requireAdminAuth, getAppointments);

// Contact management
router.get('/admin/contacts', requireAdminAuth, getContacts);
router.put('/admin/contacts/:id', requireAdminAuth, updateContactStatus);

// System management
router.post('/admin/trigger-reminders', requireAdminAuth, async (req, res) => {
  try {
    const result = await triggerReminders();
    res.json({
      success: true,
      message: 'Reminders processed',
      data: result
    });
  } catch (error) {
    console.error('Trigger reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger reminders'
    });
  }
});

export default router;
