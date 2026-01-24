/**
 * Notification services index
 * Export all notification-related services and channels
 */

// Main notification service
export * from './notification.service.js';

// Dispatcher
export { notificationDispatcher } from './dispatcher.service.js';

// Channels
export {
  BaseChannel,
  InAppChannel,
  inAppChannel,
  EmailChannel,
  emailChannel,
  SMSChannel,
  smsChannel,
  PushChannel,
  pushChannel
} from './channels/index.js';
