/**
 * Admin Service
 * Business logic for admin authentication and management
 * Note: Admin signin is restricted to ADMIN_EMAIL from environment
 */

import { adminRepository, doctorRepository, patientRepository, appointmentRepository, contactRepository } from '../../repositories/index.js';
import { hashPassword, comparePassword, generateToken, sanitizeUserData } from '../auth/auth.service.js';
import { sendEmail } from '../email/email.service.js';
import { doctorApprovalTemplate, doctorRejectionTemplate } from '../email/email.templates.js';
import { AppointmentStatus, AdminPermission } from '../../config/constants.js';

// Get admin email from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Sign in admin
 * Only allows signin if email matches ADMIN_EMAIL env variable
 */
export const adminSignIn = async (email, password) => {
  // Validate email against environment variable
  if (!ADMIN_EMAIL) {
    return { error: 'Admin authentication not configured' };
  }

  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { error: 'Unauthorized: Invalid admin credentials' };
  }

  // Find admin by email
  let admin = await adminRepository.findByEmail(email);

  // If admin doesn't exist, create on first login with provided password
  if (!admin) {
    const hashedPassword = await hashPassword(password);
    admin = await adminRepository.create({
      email: email.toLowerCase(),
      hash_password: hashedPassword,
      fullName: 'HealOrbit Admin',
      permissions: Object.values(AdminPermission),
      isActive: true
    });
  }

  // Validate password
  const isValidPassword = await comparePassword(password, admin.hash_password);
  if (!isValidPassword) {
    return { error: 'Invalid credentials' };
  }

  // Check if admin is active
  if (!admin.isActive) {
    return { error: 'Admin account is deactivated' };
  }

  // Update last login
  await adminRepository.updateLastLogin(admin._id);

  // Generate token
  const token = generateToken({
    _id: admin._id,
    email: admin.email,
    role: admin.role
  });

  return {
    success: true,
    token,
    admin: sanitizeUserData(admin),
    message: 'Admin signed in successfully'
  };
};

/**
 * Get admin dashboard stats
 */
export const getDashboardStats = async () => {
  const [totalDoctors, approvedDoctors, pendingDoctorApprovals, totalPatients, totalAppointments, pendingAppointments, todayAppointments, contacts] = await Promise.all([
    doctorRepository.count({}),
    doctorRepository.count({ approvalStatus: 'approved' }),
    doctorRepository.count({ approvalStatus: 'pending' }),
    patientRepository.count({}),
    appointmentRepository.count({}),
    appointmentRepository.count({ status: AppointmentStatus.PENDING }),
    appointmentRepository.count({
      scheduledDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    contactRepository.count({ status: 'new' })
  ]);

  const appointmentsByStatus = await appointmentRepository.model.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return {
    success: true,
    stats: {
      totalDoctors,
      approvedDoctors,
      pendingDoctorApprovals,
      totalPatients,
      totalAppointments,
      pendingAppointments,
      todayAppointments,
      newContacts: contacts,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  };
};

/**
 * Get all doctors with pagination and search
 */
export const getAllDoctors = async (page = 1, limit = 20, search = '', filters = {}) => {
  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { speciality: { $regex: search, $options: 'i' } }
    ];
  }

  if (filters.isVerified !== undefined) {
    query.isVerified = filters.isVerified === 'true';
  }

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === 'true';
  }

  if (filters.approvalStatus) {
    query.approvalStatus = filters.approvalStatus;
  }

  const options = {
    select: '-hash_password',
    sort: { createdAt: -1 },
    skip: (page - 1) * limit,
    limit: parseInt(limit)
  };

  const [doctors, total] = await Promise.all([
    doctorRepository.find(query, options),
    doctorRepository.count(query)
  ]);

  return {
    success: true,
    doctors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get all patients with pagination and search
 */
export const getAllPatients = async (page = 1, limit = 20, search = '') => {
  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    select: '-hash_password',
    sort: { createdAt: -1 },
    skip: (page - 1) * limit,
    limit: parseInt(limit)
  };

  const [patients, total] = await Promise.all([
    patientRepository.find(query, options),
    patientRepository.count(query)
  ]);

  return {
    success: true,
    patients,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Approve a doctor registration
 */
export const approveDoctor = async (doctorId) => {
  const doctor = await doctorRepository.approveDoctor(doctorId);

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  // Send approval email to doctor using template
  try {
    await sendEmail({
      to: doctor.email,
      subject: 'Your HealOrbit Registration Has Been Approved!',
      html: doctorApprovalTemplate({ name: doctor.firstName })
    });
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }

  return {
    success: true,
    doctor,
    message: 'Doctor approved successfully'
  };
};

/**
 * Reject a doctor registration
 */
export const rejectDoctor = async (doctorId, reason) => {
  const doctor = await doctorRepository.rejectDoctor(doctorId, reason);

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  // Send rejection email to doctor using template
  try {
    await sendEmail({
      to: doctor.email,
      subject: 'HealOrbit Registration Status Update',
      html: doctorRejectionTemplate({ name: doctor.firstName, reason })
    });
  } catch (error) {
    console.error('Failed to send rejection email:', error);
  }

  return {
    success: true,
    doctor,
    message: 'Doctor registration rejected'
  };
};

/**
 * Get pending doctor approvals
 */
export const getPendingDoctorApprovals = async () => {
  const doctors = await doctorRepository.findPendingApproval({ sort: { createdAt: -1 } });
  return {
    success: true,
    doctors,
    count: doctors.length
  };
};

/**
 * Update doctor status (activate/deactivate)
 */
export const updateDoctorStatus = async (doctorId, isActive) => {
  const doctor = await doctorRepository.updateById(doctorId, { isActive }, { select: '-hash_password' });

  if (!doctor) {
    return { error: 'Doctor not found' };
  }

  return {
    success: true,
    doctor,
    message: `Doctor ${isActive ? 'activated' : 'deactivated'} successfully`
  };
};

/**
 * Update patient status (activate/deactivate)
 */
export const updatePatientStatus = async (patientId, isActive) => {
  const patient = await patientRepository.updateById(patientId, { isActive }, { select: '-hash_password' });

  if (!patient) {
    return { error: 'Patient not found' };
  }

  return {
    success: true,
    patient,
    message: `Patient ${isActive ? 'activated' : 'deactivated'} successfully`
  };
};

/**
 * Get all appointments with pagination and filters
 */
export const getAllAppointments = async (page = 1, limit = 20, filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.doctorId) {
    query.doctorId = filters.doctorId;
  }

  if (filters.patientId) {
    query.patientId = filters.patientId;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.scheduledDate = {};
    if (filters.dateFrom) {
      query.scheduledDate.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.scheduledDate.$lte = new Date(filters.dateTo);
    }
  }

  const options = {
    populate: [
      { path: 'doctorId', select: 'firstName lastName email speciality' },
      { path: 'patientId', select: 'firstName lastName email' }
    ],
    sort: { createdAt: -1 },
    skip: (page - 1) * limit,
    limit: parseInt(limit)
  };

  const [appointments, total] = await Promise.all([
    appointmentRepository.find(query, options),
    appointmentRepository.count(query)
  ]);

  return {
    success: true,
    appointments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get all contacts with pagination
 */
export const getAllContacts = async (page = 1, limit = 20, status = '') => {
  const query = {};

  if (status) {
    query.status = status;
  }

  const options = {
    sort: { createdAt: -1 },
    skip: (page - 1) * limit,
    limit: parseInt(limit)
  };

  const [contacts, total] = await Promise.all([
    contactRepository.find(query, options),
    contactRepository.count(query)
  ]);

  return {
    success: true,
    contacts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update contact status
 */
export const updateContactStatus = async (contactId, status, response = '') => {
  const updateData = { status };
  if (response) {
    updateData.adminResponse = response;
    updateData.respondedAt = new Date();
  }

  const contact = await contactRepository.updateById(contactId, updateData);

  if (!contact) {
    return { error: 'Contact not found' };
  }

  return {
    success: true,
    contact,
    message: 'Contact updated successfully'
  };
};

/**
 * Change admin password
 */
export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  const admin = await adminRepository.findById(adminId);

  if (!admin) {
    return { error: 'Admin not found' };
  }

  const isValidPassword = await comparePassword(currentPassword, admin.hash_password);
  if (!isValidPassword) {
    return { error: 'Current password is incorrect' };
  }

  const hashedPassword = await hashPassword(newPassword);
  await adminRepository.updateById(adminId, { hash_password: hashedPassword });

  return {
    success: true,
    message: 'Password changed successfully'
  };
};

export default {
  adminSignIn,
  getDashboardStats,
  getAllDoctors,
  getAllPatients,
  approveDoctor,
  rejectDoctor,
  getPendingDoctorApprovals,
  updateDoctorStatus,
  updatePatientStatus,
  getAllAppointments,
  getAllContacts,
  updateContactStatus,
  changeAdminPassword
};
