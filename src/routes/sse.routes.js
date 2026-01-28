/**
 * SSE (Server-Sent Events) Routes
 *
 * HTTP endpoint for establishing SSE connections.
 */

import { Router } from 'express';
import { addClient, removeClient } from '../services/sse/sse.service.js';

const router = Router();

/**
 * SSE Connection Endpoint
 *
 * GET /api/sse/:userId/:userType
 *
 * Establishes a persistent SSE connection for real-time updates.
 */
router.get('/:userId/:userType', (req, res) => {
  const { userId, userType } = req.params;

  // Validate userType
  if (!['patient', 'doctor'].includes(userType)) {
    return res.status(400).json({ error: 'Invalid userType' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Prevent response timeout
  req.socket.setTimeout(0);

  // Send initial connection event
  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify({ message: 'SSE connection established', userId, userType })}\n\n`);

  // Register client
  addClient(userId, userType, res);

  // Heartbeat to keep connection alive (every 30 seconds)
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    removeClient(userId);
  });

  req.on('error', () => {
    clearInterval(heartbeatInterval);
    removeClient(userId);
  });
});

export default router;
