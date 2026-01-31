/**
 * Doctor Auth Service
 * Doctor-specific authentication operations
 */

import { doctorRepository } from '../../repositories/index.js';
import {
  hashPassword,
  generateToken,
  generateUsername,
  sanitizeUserData,
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  isEmailVerificationExpired
} from './auth.service.js';
import { UserRole } from '../../config/constants.js';
import { sendEmail, isEmailConfigured } from '../email/email.service.js';
import { emailVerificationTemplate } from '../email/email.templates.js';

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

  // Generate email verification token
  const emailVerificationToken = generateEmailVerificationToken();
  const emailVerificationExpires = getEmailVerificationExpiry();

  // Hash password and create doctor
  const hash_password = await hashPassword(password);
  const doctor = await doctorRepository.create({
    firstName,
    lastName,
    username: generateUsername(),
    email,
    hash_password,
    gender,
    number,
    isEmailVerified: false,
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - HealOrbit',
        html: emailVerificationTemplate({
          name: firstName,
          verificationToken: emailVerificationToken,
          isDoctor: true
        })
      });
    } catch (error) {
      console.error('[Doctor Auth] Failed to send verification email:', error);
    }
  }

  return {
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
    requiresVerification: true
  };
};

/**
 * Verify doctor email
 */
export const verifyDoctorEmail = async (token) => {
  const doctor = await doctorRepository.findOne({ emailVerificationToken: token });

  if (!doctor) {
    return { error: 'Invalid verification token' };
  }

  if (isEmailVerificationExpired(doctor.emailVerificationExpires)) {
    return { error: 'Verification token has expired. Please request a new one.' };
  }

  // Mark email as verified
  await doctorRepository.updateById(doctor._id, {
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null
  });

  return { success: true, message: 'Email verified successfully! You can now sign in.' };
};

/**
 * Resend verification email
 */
export const resendDoctorVerificationEmail = async (email) => {
  const doctor = await doctorRepository.findByEmail(email);

  if (!doctor) {
    // Don't reveal if email exists
    return { success: true, message: 'If an account exists with this email, a verification link has been sent.' };
  }

  if (doctor.isEmailVerified) {
    return { error: 'Email is already verified' };
  }

  // Generate new verification token
  const emailVerificationToken = generateEmailVerificationToken();
  const emailVerificationExpires = getEmailVerificationExpiry();

  await doctorRepository.updateById(doctor._id, {
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - HealOrbit',
        html: emailVerificationTemplate({
          name: doctor.firstName,
          verificationToken: emailVerificationToken,
          isDoctor: true
        })
      });
    } catch (error) {
      console.error('[Doctor Auth] Failed to send verification email:', error);
    }
  }

  return { success: true, message: 'If an account exists with this email, a verification link has been sent.' };
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
    return { error: 'Invalid credentials' };
  }

  // Check if email is verified
  if (!doctor.isEmailVerified) {
    return {
      error: 'Please verify your email before signing in',
      requiresVerification: true,
      email: doctor.email
    };
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
  authenticateDoctor,
  verifyDoctorEmail,
  resendDoctorVerificationEmail
};
