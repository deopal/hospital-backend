/**
 * Base Notification Channel
 *
 * Abstract base class that defines the interface for all notification channels.
 * Implements the Strategy Pattern - each channel is a strategy for delivering notifications.
 *
 * SOLID Principles:
 * - SRP: Each channel handles one delivery method
 * - OCP: Add new channels without modifying existing code
 * - LSP: All channels are interchangeable through this interface
 * - DIP: Services depend on this abstraction, not concrete implementations
 */

export class BaseChannel {
  constructor(name) {
    if (new.target === BaseChannel) {
      throw new Error('BaseChannel is abstract and cannot be instantiated directly');
    }
    this.name = name;
    this.enabled = true;
  }

  /**
   * Send a notification through this channel
   * Must be implemented by subclasses
   *
   * @param {Object} notification - The notification to send
   * @param {string} notification.recipientId - ID of the recipient
   * @param {string} notification.recipientType - Type of recipient (Doctors/Patients)
   * @param {string} notification.type - Notification type
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {Object} notification.metadata - Additional data
   * @returns {Promise<Object>} Result of the send operation
   */
  async send(notification) {
    throw new Error('send() method must be implemented by subclass');
  }

  /**
   * Check if this channel can handle the notification
   * Override in subclasses for custom logic (e.g., check user preferences)
   *
   * @param {Object} notification - The notification to check
   * @returns {Promise<boolean>} Whether this channel should handle the notification
   */
  async canHandle(notification) {
    return this.enabled;
  }

  /**
   * Enable this channel
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable this channel
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get channel name
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Check if channel is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}

export default BaseChannel;
