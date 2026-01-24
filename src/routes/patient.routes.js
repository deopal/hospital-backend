/**
 * Patient Routes
 * Patient-related endpoints
 */

import express from 'express';
import {
  getSettings,
  updateSettings,
  uploadImage,
  makeAppointment,
  getAllAppointments,
  getAppointmentByIdHandler,
  getReviews,
  completeAppointmentHandler,
  cancelAppointmentHandler,
  downloadPrescription
} from '../controllers/patient.controller.js';
import {
  getPatientNotifications,
  markPatientNotificationRead,
  markAllPatientNotificationsRead,
  removePatientNotification
} from '../controllers/notification.controller.js';
import { contact } from '../controllers/contact.controller.js';
import { uploadReports } from '../common-middleware/upload.middleware.js';

const router = express.Router();

// Patient profile & settings
router.get('/patient/patientSetting/:id', getSettings);
router.post('/patient/updateSettings/:id', updateSettings);
router.post('/patient/image/:id', uploadImage);

// Appointments (with file upload support)
router.post('/patient/makeAppointment', uploadReports, makeAppointment);
router.get('/patient/allAppointments/:id', getAllAppointments);
router.get('/patient/AppointmentById/:id', getAppointmentByIdHandler);
router.post('/patient/completeAppointment/:id', completeAppointmentHandler);
router.post('/patient/cancelAppointment/:id', cancelAppointmentHandler);
router.get('/patient/prescription/:id', downloadPrescription);

// Reviews
router.get('/patient/getReviews/:id', getReviews);

// Notifications
router.get('/patient/getNotification/:id', getPatientNotifications);
router.post('/patient/markNotificationRead', markPatientNotificationRead);
router.post('/patient/markAllNotificationsRead', markAllPatientNotificationsRead);
router.post('/patient/removeNotification', removePatientNotification);

// Contact
router.post('/patient/contact', contact);

export default router;
