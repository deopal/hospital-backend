/**
 * Admin Routes
 * Administrative endpoints for system management
 */

import express from 'express';
import { triggerReminders } from '../services/reminder/reminder.service.js';

const router = express.Router();

/**
 * Manually trigger appointment reminders
 * POST /api/admin/trigger-reminders
 */
router.post('/admin/trigger-reminders', async (req, res) => {
  try {
    const result = await triggerReminders();
    res.json({
      success: true,
      message: 'Reminders processed',
      data: result
    });
  } catch (error) {
    console.error('Trigger reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger reminders'
    });
  }
});

export default router;
