/**
 * SSE (Server-Sent Events) Service
 *
 * Manages SSE connections for real-time updates.
 * Stores client connections and provides methods to send events to specific users.
 */

// Store active connections: Map<odepuserId, { res, userType }>
const clients = new Map();

/**
 * Add a new client connection
 * @param {string} userId - User's ID
 * @param {string} userType - 'patient' or 'doctor'
 * @param {Response} res - Express response object
 */
export const addClient = (userId, userType, res) => {
  // Close existing connection if any (user reconnecting)
  const existingClient = clients.get(userId);
  if (existingClient) {
    try {
      existingClient.res.end();
    } catch (e) {
      // Connection already closed
    }
  }

  clients.set(userId, { res, userType });
  console.log(`[SSE] Client connected: ${userId} (${userType}). Total clients: ${clients.size}`);
};

/**
 * Remove a client connection
 * @param {string} userId - User's ID
 */
export const removeClient = (userId) => {
  clients.delete(userId);
  console.log(`[SSE] Client disconnected: ${userId}. Total clients: ${clients.size}`);
};

/**
 * Send an event to a specific user
 * @param {string} userId - User's ID
 * @param {string} eventType - Event type (e.g., 'notification', 'message')
 * @param {object} data - Data to send
 * @returns {boolean} - Whether the event was sent successfully
 */
export const sendToUser = (userId, eventType, data) => {
  const client = clients.get(userId);

  if (!client) {
    console.log(`[SSE] User ${userId} not connected, cannot send ${eventType}`);
    return false;
  }

  try {
    client.res.write(`event: ${eventType}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    console.log(`[SSE] Sent ${eventType} to ${userId}`);
    return true;
  } catch (error) {
    console.error(`[SSE] Error sending to ${userId}:`, error.message);
    // Remove dead connection
    removeClient(userId);
    return false;
  }
};

/**
 * Send an event to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {string} eventType - Event type
 * @param {object} data - Data to send
 * @returns {number} - Number of users who received the event
 */
export const sendToUsers = (userIds, eventType, data) => {
  let sentCount = 0;
  for (const userId of userIds) {
    if (sendToUser(userId, eventType, data)) {
      sentCount++;
    }
  }
  return sentCount;
};

/**
 * Check if a user is connected
 * @param {string} userId - User's ID
 * @returns {boolean}
 */
export const isUserConnected = (userId) => {
  return clients.has(userId);
};

/**
 * Get count of connected clients
 * @returns {number}
 */
export const getClientCount = () => {
  return clients.size;
};

/**
 * Broadcast to all connected clients (use sparingly)
 * @param {string} eventType - Event type
 * @param {object} data - Data to send
 */
export const broadcast = (eventType, data) => {
  for (const [userId] of clients) {
    sendToUser(userId, eventType, data);
  }
};

export default {
  addClient,
  removeClient,
  sendToUser,
  sendToUsers,
  isUserConnected,
  getClientCount,
  broadcast
};
