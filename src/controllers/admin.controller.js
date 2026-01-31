/**
 * Admin Controller
 * Handles admin panel endpoints
 */

import * as adminService from '../services/admin/admin.service.js';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  createdResponse
} from '../utils/response.util.js';

/**
 * Admin Sign In
 */
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return badRequestResponse(res, 'Email and password are required');
    }

    const result = await adminService.adminSignIn(email, password);

    if (result.error) {
      return unauthorizedResponse(res, result.error);
    }

    return successResponse(res, {
      token: result.token,
      admin: result.admin
    }, result.message);
  } catch (error) {
    console.error('Admin sign in error:', error);
    return errorResponse(res, 'Failed to sign in');
  }
};

/**
 * Get Dashboard Stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const result = await adminService.getDashboardStats();
    return successResponse(res, { stats: result.stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, 'Failed to fetch dashboard stats');
  }
};

/**
 * Get All Doctors
 */
export const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', isVerified, isActive, approvalStatus } = req.query;
    const result = await adminService.getAllDoctors(page, limit, search, { isVerified, isActive, approvalStatus });
    return successResponse(res, {
      doctors: result.doctors,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    return errorResponse(res, 'Failed to fetch doctors');
  }
};

/**
 * Get Single Doctor
 */
export const getDoctor = async (req, res) => {
  try {
    const { doctorRepository } = await import('../repositories/index.js');
    const doctor = await doctorRepository.findByIdSafe(req.params.id);

    if (!doctor) {
      return badRequestResponse(res, 'Doctor not found');
    }

    return successResponse(res, { doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    return errorResponse(res, 'Failed to fetch doctor');
  }
};

/**
 * Approve Doctor Registration
 */
export const approveDoctor = async (req, res) => {
  try {
    const result = await adminService.approveDoctor(req.params.id);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor }, result.message);
  } catch (error) {
    console.error('Approve doctor error:', error);
    return errorResponse(res, 'Failed to approve doctor');
  }
};

/**
 * Reject Doctor Registration
 */
export const rejectDoctor = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await adminService.rejectDoctor(req.params.id, reason);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor }, result.message);
  } catch (error) {
    console.error('Reject doctor error:', error);
    return errorResponse(res, 'Failed to reject doctor');
  }
};

/**
 * Get Pending Doctor Approvals
 */
export const getPendingDoctorApprovals = async (req, res) => {
  try {
    const result = await adminService.getPendingDoctorApprovals();
    return successResponse(res, {
      doctors: result.doctors,
      count: result.count
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return errorResponse(res, 'Failed to fetch pending approvals');
  }
};

/**
 * Update Doctor Status
 */
export const updateDoctorStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return badRequestResponse(res, 'isActive is required');
    }

    const result = await adminService.updateDoctorStatus(req.params.id, isActive);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { doctor: result.doctor }, result.message);
  } catch (error) {
    console.error('Update doctor status error:', error);
    return errorResponse(res, 'Failed to update doctor status');
  }
};

/**
 * Get All Patients
 */
export const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await adminService.getAllPatients(page, limit, search);
    return successResponse(res, {
      patients: result.patients,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get patients error:', error);
    return errorResponse(res, 'Failed to fetch patients');
  }
};

/**
 * Get Single Patient
 */
export const getPatient = async (req, res) => {
  try {
    const { patientRepository } = await import('../repositories/index.js');
    const patient = await patientRepository.findByIdSafe(req.params.id);

    if (!patient) {
      return badRequestResponse(res, 'Patient not found');
    }

    return successResponse(res, { patient });
  } catch (error) {
    console.error('Get patient error:', error);
    return errorResponse(res, 'Failed to fetch patient');
  }
};

/**
 * Update Patient Status
 */
export const updatePatientStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return badRequestResponse(res, 'isActive is required');
    }

    const result = await adminService.updatePatientStatus(req.params.id, isActive);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { patient: result.patient }, result.message);
  } catch (error) {
    console.error('Update patient status error:', error);
    return errorResponse(res, 'Failed to update patient status');
  }
};

/**
 * Get All Appointments
 */
export const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, doctorId, patientId, dateFrom, dateTo } = req.query;
    const result = await adminService.getAllAppointments(page, limit, {
      status,
      doctorId,
      patientId,
      dateFrom,
      dateTo
    });
    return successResponse(res, {
      appointments: result.appointments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return errorResponse(res, 'Failed to fetch appointments');
  }
};

/**
 * Get All Contacts
 */
export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const result = await adminService.getAllContacts(page, limit, status);
    return successResponse(res, {
      contacts: result.contacts,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    return errorResponse(res, 'Failed to fetch contacts');
  }
};

/**
 * Update Contact Status
 */
export const updateContactStatus = async (req, res) => {
  try {
    const { status, response } = req.body;

    if (!status) {
      return badRequestResponse(res, 'Status is required');
    }

    const result = await adminService.updateContactStatus(req.params.id, status, response);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, { contact: result.contact }, result.message);
  } catch (error) {
    console.error('Update contact status error:', error);
    return errorResponse(res, 'Failed to update contact');
  }
};

/**
 * Change Admin Password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return badRequestResponse(res, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return badRequestResponse(res, 'New password must be at least 6 characters');
    }

    const result = await adminService.changeAdminPassword(req.admin._id, currentPassword, newPassword);

    if (result.error) {
      return badRequestResponse(res, result.error);
    }

    return successResponse(res, {}, result.message);
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Failed to change password');
  }
};

/**
 * Get Current Admin
 */
export const getCurrentAdmin = async (req, res) => {
  try {
    return successResponse(res, { admin: req.admin });
  } catch (error) {
    console.error('Get current admin error:', error);
    return errorResponse(res, 'Failed to fetch admin');
  }
};

export default {
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
};
