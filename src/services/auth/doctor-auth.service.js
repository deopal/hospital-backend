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
  generateEmailVerificationCode,
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  isEmailVerificationExpired
} from './auth.service.js';
import { UserRole } from '../../config/constants.js';
import { sendEmail, isEmailConfigured } from '../email/email.service.js';
import { emailVerificationCodeTemplate, doctorRegistrationPendingTemplate } from '../email/email.templates.js';

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

  // Generate 6-digit verification code and token for link
  const emailVerificationCode = generateEmailVerificationCode();
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
    emailVerificationCode,
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email with code and link
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Your Verification Code - HealOrbit',
        html: emailVerificationCodeTemplate({
          name: firstName,
          code: emailVerificationCode,
          verificationToken: emailVerificationToken,
          isDoctor: true,
          email
        })
      });
    } catch (error) {
      console.error('[Doctor Auth] Failed to send verification email:', error);
    }

    // Send pending approval email
    try {
      await sendEmail({
        to: email,
        subject: 'Registration Received - Pending Approval - HealOrbit',
        html: doctorRegistrationPendingTemplate({
          name: firstName
        })
      });
    } catch (error) {
      console.error('[Doctor Auth] Failed to send pending approval email:', error);
    }
  }

  return {
    success: true,
    message: 'Registration successful! Please check your email for the verification code. Your account is pending admin approval.',
    requiresVerification: true,
    pendingApproval: true,
    email
  };
};

/**
 * Verify doctor email with code
 */
export const verifyDoctorEmail = async (email, code) => {
  const doctor = await doctorRepository.findByEmail(email);

  if (!doctor) {
    return { error: 'Invalid email or code' };
  }

  if (doctor.isEmailVerified) {
    return { error: 'Email is already verified' };
  }

  if (doctor.emailVerificationCode !== code) {
    return { error: 'Invalid verification code' };
  }

  if (isEmailVerificationExpired(doctor.emailVerificationExpires)) {
    return { error: 'Verification code has expired. Please request a new one.' };
  }

  // Mark email as verified
  await doctorRepository.updateById(doctor._id, {
    isEmailVerified: true,
    emailVerificationCode: null,
    emailVerificationToken: null,
    emailVerificationExpires: null
  });

  return { success: true, message: 'Email verified successfully! You can now sign in.' };
};

/**
 * Verify doctor email with token (link-based)
 */
export const verifyDoctorEmailByToken = async (token) => {
  const doctor = await doctorRepository.findOne({ emailVerificationToken: token });

  if (!doctor) {
    return { error: 'Invalid verification link' };
  }

  if (doctor.isEmailVerified) {
    return { error: 'Email is already verified' };
  }

  if (isEmailVerificationExpired(doctor.emailVerificationExpires)) {
    return { error: 'Verification link has expired. Please request a new one.' };
  }

  // Mark email as verified
  await doctorRepository.updateById(doctor._id, {
    isEmailVerified: true,
    emailVerificationCode: null,
    emailVerificationToken: null,
    emailVerificationExpires: null
  });

  return { success: true, message: 'Email verified successfully! You can now sign in.' };
};

/**
 * Resend verification code
 */
export const resendDoctorVerificationEmail = async (email) => {
  const doctor = await doctorRepository.findByEmail(email);

  if (!doctor) {
    // Don't reveal if email exists
    return { success: true, message: 'If an account exists with this email, a verification code has been sent.' };
  }

  if (doctor.isEmailVerified) {
    return { error: 'Email is already verified' };
  }

  // Generate new verification code and token
  const emailVerificationCode = generateEmailVerificationCode();
  const emailVerificationToken = generateEmailVerificationToken();
  const emailVerificationExpires = getEmailVerificationExpiry();

  await doctorRepository.updateById(doctor._id, {
    emailVerificationCode,
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email with code and link
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Your Verification Code - HealOrbit',
        html: emailVerificationCodeTemplate({
          name: doctor.firstName,
          code: emailVerificationCode,
          verificationToken: emailVerificationToken,
          isDoctor: true,
          email
        })
      });
    } catch (error) {
      console.error('[Doctor Auth] Failed to send verification email:', error);
    }
  }

  return { success: true, message: 'If an account exists with this email, a verification code has been sent.' };
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
  verifyDoctorEmailByToken,
  resendDoctorVerificationEmail
};
