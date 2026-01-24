/**
 * Application-wide constants
 * Centralized location for all magic strings and configuration values
 */

// User roles
export const UserRole = Object.freeze({
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  ADMIN: 'admin'
});

// Model names (for MongoDB collections)
export const ModelName = Object.freeze({
  DOCTOR: 'Doctors',
  PATIENT: 'Patients',
  APPOINTMENT: 'Appointments',
  NOTIFICATION: 'Notifications',
  CONTACT: 'Contacts',
  VIDEO_ROOM: 'VideoRooms'
});

// Appointment statuses
export const AppointmentStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

// Notification types
export const NotificationType = Object.freeze({
  APPOINTMENT_REQUEST: 'appointment_request',
  APPOINTMENT_APPROVED: 'appointment_approved',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  REVIEW_ADDED: 'review_added',
  MESSAGE: 'message',
  REMINDER: 'reminder',
  VIDEO_CALL_STARTED: 'video_call_started',
  VIDEO_CALL_ENDED: 'video_call_ended'
});

// Video room statuses
export const VideoRoomStatus = Object.freeze({
  WAITING: 'waiting',
  ACTIVE: 'active',
  ENDED: 'ended'
});

// Recipient types for notifications
export const RecipientType = Object.freeze({
  DOCTOR: 'Doctors',
  PATIENT: 'Patients'
});

// Pagination defaults
export const Pagination = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});

// JWT configuration
export const JwtConfig = Object.freeze({
  EXPIRES_IN: '1d',
  COOKIE_NAME: 'token'
});

// HTTP status codes
export const HttpStatus = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
});

// Error messages
export const ErrorMessage = Object.freeze({
  INTERNAL_ERROR: 'Something went wrong',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  VALIDATION_ERROR: 'Validation failed',
  DUPLICATE_ENTRY: 'Resource already exists'
});
