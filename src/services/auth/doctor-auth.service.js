/**
 * Doctor Auth Service
 * Doctor-specific authentication operations
 */

import { doctorRepository } from '../../repositories/index.js';
import { hashPassword, generateToken, generateUsername, sanitizeUserData } from './auth.service.js';
import { UserRole } from '../../config/constants.js';

/**
 * Register a new doctor
 */
export const registerDoctor = async (doctorData) => {
  const { email, password, firstName, lastName, gender, number } = doctorData;

  // Check if doctor already exists
  const existingDoctor = await doctorRepository.findByEmail(email);
  if (existingDoctor) {
    return { error: 'Doctor already registered' };
  }

  // Hash password and create doctor
  const hash_password = await hashPassword(password);
  const doctor = await doctorRepository.create({
    firstName,
    lastName,
    username: generateUsername(),
    email,
    hash_password,
    gender,
    number
  });

  return { success: true, message: 'Doctor registered successfully!' };
};

/**
 * Authenticate doctor
 */
export const authenticateDoctor = async (email, password) => {
  const doctor = await doctorRepository.findByEmail(email);

  if (!doctor) {
    return { error: 'Invalid credentials' };
  }

  const isValidPassword = await doctor.authenticate(password);

  if (!isValidPassword || doctor.role !== UserRole.DOCTOR) {
    return { error: 'Invalid password' };
  }

  const token = generateToken({
    _id: doctor._id,
    role: doctor.role
  });

  const userData = sanitizeUserData(doctor);

  return {
    success: true,
    message: 'Logged in successfully',
    token,
    user: {
      _id: userData._id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      fullName: userData.fullName,
      gender: userData.gender,
      number: userData.number
    }
  };
};

export default {
  registerDoctor,
  authenticateDoctor
};
