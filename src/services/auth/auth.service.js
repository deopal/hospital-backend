/**
 * Auth Service
 * Shared authentication logic for doctors and patients
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { JwtConfig } from '../../config/constants.js';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_HOURS = 1; // Token expires in 1 hour
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24; // Verification token expires in 24 hours

/**
 * Hash a password
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JwtConfig.EXPIRES_IN
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate unique username
 */
export const generateUsername = () => {
  return nanoid();
};

/**
 * Prepare user data for response (remove sensitive fields)
 */
export const sanitizeUserData = (user) => {
  const { hash_password, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
};

/**
 * Generate password reset token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get reset token expiry date
 */
export const getResetTokenExpiry = () => {
  return new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
};

/**
 * Check if reset token is expired
 */
export const isResetTokenExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get email verification token expiry date
 */
export const getEmailVerificationExpiry = () => {
  return new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
};

/**
 * Check if email verification token is expired
 */
export const isEmailVerificationExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateUsername,
  sanitizeUserData,
  generateResetToken,
  getResetTokenExpiry,
  isResetTokenExpired,
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  isEmailVerificationExpired
};
