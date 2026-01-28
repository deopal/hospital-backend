/**
 * Notification Dispatcher Service
 *
 * Central service for dispatching notifications to multiple channels.
 * Implements the Strategy Pattern - channels are interchangeable strategies.
 *
 * Features:
 * - Register multiple notification channels
 * - Dispatch to all enabled channels
 * - Dispatch to specific channels
 * - Automatic channel selection based on notification type
 * - Error handling and logging for each channel
 */

import { inAppChannel } from './channels/inapp.channel.js';
import { emailChannel } from './channels/email.channel.js';
import { smsChannel } from './channels/sms.channel.js';
import { pushChannel } from './channels/push.channel.js';
import { sseChannel } from './channels/sse.channel.js';

class NotificationDispatcher {
  constructor() {
    // Registry of available channels
    this.channels = new Map();

    // Register default channels
    this.registerChannel(inAppChannel);
    this.registerChannel(emailChannel);
    this.registerChannel(smsChannel);
    this.registerChannel(pushChannel);
    this.registerChannel(sseChannel);
  }

  /**
   * Register a notification channel
   *
   * @param {BaseChannel} channel - The channel to register
   */
  registerChannel(channel) {
    this.channels.set(channel.getName(), channel);
    console.log(`[Dispatcher] Registered channel: ${channel.getName()}`);
  }

  /**
   * Unregister a notification channel
   *
   * @param {string} channelName - The name of the channel to remove
   */
  unregisterChannel(channelName) {
    this.channels.delete(channelName);
    console.log(`[Dispatcher] Unregistered channel: ${channelName}`);
  }

  /**
   * Get a channel by name
   *
   * @param {string} channelName - The channel name
   * @returns {BaseChannel|undefined}
   */
  getChannel(channelName) {
    return this.channels.get(channelName);
  }

  /**
   * Get all registered channels
   *
   * @returns {BaseChannel[]}
   */
  getAllChannels() {
    return Array.from(this.channels.values());
  }

  /**
   * Get all enabled channels
   *
   * @returns {BaseChannel[]}
   */
  getEnabledChannels() {
    return this.getAllChannels().filter(channel => channel.isEnabled());
  }

  /**
   * Dispatch notification to all enabled channels that can handle it
   *
   * @param {Object} notification - The notification to dispatch
   * @returns {Promise<Object>} Results from all channels
   */
  async dispatch(notification) {
    const results = {
      success: true,
      notification,
      channels: {}
    };

    const enabledChannels = this.getEnabledChannels();

    if (enabledChannels.length === 0) {
      console.warn('[Dispatcher] No enabled channels to dispatch notification');
      return {
        success: false,
        error: 'No enabled channels available',
        notification
      };
    }

    // First, run inApp channel to save to database and get the _id
    // This ensures other channels (like SSE) have the correct notification ID
    const inAppChannel = this.getChannel('inapp');
    let savedNotification = notification;

    if (inAppChannel && inAppChannel.isEnabled()) {
      try {
        const canHandle = await inAppChannel.canHandle(notification);
        if (canHandle) {
          const inAppResult = await inAppChannel.send(notification);
          results.channels['inapp'] = inAppResult;

          // Use the saved notification with _id for other channels
          if (inAppResult.success && inAppResult.notification) {
            savedNotification = {
              ...notification,
              _id: inAppResult.notification._id,
              createdAt: inAppResult.notification.createdAt
            };
          }
        }
      } catch (error) {
        console.error('[Dispatcher] Error in inapp channel:', error);
        results.channels['inapp'] = { success: false, error: error.message };
      }
    }

    // Process remaining channels concurrently (excluding inapp which already ran)
    const otherChannels = enabledChannels.filter(c => c.getName() !== 'inapp');

    const channelPromises = otherChannels.map(async (channel) => {
      const channelName = channel.getName();

      try {
        // Check if channel can handle this notification
        const canHandle = await channel.canHandle(savedNotification);

        if (!canHandle) {
          return {
            channelName,
            result: { success: true, skipped: true, reason: 'Channel cannot handle this notification type' }
          };
        }

        // Send through channel with saved notification (includes _id)
        const result = await channel.send(savedNotification);
        return { channelName, result };
      } catch (error) {
        console.error(`[Dispatcher] Error in channel ${channelName}:`, error);
        return {
          channelName,
          result: { success: false, error: error.message }
        };
      }
    });

    // Wait for all other channels to complete
    const channelResults = await Promise.all(channelPromises);

    // Compile results
    let hasSuccess = results.channels['inapp']?.success || false;
    let hasFailure = results.channels['inapp']?.success === false;

    channelResults.forEach(({ channelName, result }) => {
      results.channels[channelName] = result;

      if (result.success && !result.skipped) {
        hasSuccess = true;
      } else if (!result.success) {
        hasFailure = true;
      }
    });

    // Overall success if at least one channel succeeded
    results.success = hasSuccess;
    if (hasFailure && !hasSuccess) {
      results.error = 'All channels failed to deliver notification';
    }

    return results;
  }

  /**
   * Dispatch notification to specific channels only
   *
   * @param {Object} notification - The notification to dispatch
   * @param {string[]} channelNames - Array of channel names to use
   * @returns {Promise<Object>} Results from specified channels
   */
  async dispatchTo(notification, channelNames) {
    const results = {
      success: true,
      notification,
      channels: {}
    };

    const channelPromises = channelNames.map(async (channelName) => {
      const channel = this.getChannel(channelName);

      if (!channel) {
        return {
          channelName,
          result: { success: false, error: `Channel '${channelName}' not found` }
        };
      }

      if (!channel.isEnabled()) {
        return {
          channelName,
          result: { success: false, error: `Channel '${channelName}' is disabled` }
        };
      }

      try {
        const result = await channel.send(notification);
        return { channelName, result };
      } catch (error) {
        return {
          channelName,
          result: { success: false, error: error.message }
        };
      }
    });

    const channelResults = await Promise.all(channelPromises);

    let hasSuccess = false;
    channelResults.forEach(({ channelName, result }) => {
      results.channels[channelName] = result;
      if (result.success) {
        hasSuccess = true;
      }
    });

    results.success = hasSuccess;

    return results;
  }

  /**
   * Dispatch notification to in-app channel only (convenience method)
   *
   * @param {Object} notification - The notification to dispatch
   * @returns {Promise<Object>}
   */
  async dispatchInApp(notification) {
    return this.dispatchTo(notification, ['inapp']);
  }

  /**
   * Enable a channel by name
   *
   * @param {string} channelName
   */
  enableChannel(channelName) {
    const channel = this.getChannel(channelName);
    if (channel) {
      channel.enable();
      console.log(`[Dispatcher] Enabled channel: ${channelName}`);
    }
  }

  /**
   * Disable a channel by name
   *
   * @param {string} channelName
   */
  disableChannel(channelName) {
    const channel = this.getChannel(channelName);
    if (channel) {
      channel.disable();
      console.log(`[Dispatcher] Disabled channel: ${channelName}`);
    }
  }

  /**
   * Get status of all channels
   *
   * @returns {Object}
   */
  getStatus() {
    const status = {};
    this.channels.forEach((channel, name) => {
      status[name] = {
        enabled: channel.isEnabled()
      };
    });
    return status;
  }
}

// Export singleton instance
export const notificationDispatcher = new NotificationDispatcher();
export default notificationDispatcher;
