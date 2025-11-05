import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Get all RSVPs for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.name, u.email, u.university
       FROM rsvps r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.session_id = $1
       ORDER BY r.responded_at DESC`,
      [sessionId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get RSVP by user and session
router.get('/user/:userId/session/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM rsvps WHERE user_id = $1 AND session_id = $2',
      [userId, sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching RSVP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update RSVP
router.post('/', async (req, res) => {
  try {
    const { session_id, user_id, status } = req.body;
    
    if (!session_id || !user_id || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID, user ID, and status are required' 
      });
    }

    if (!['attending', 'maybe', 'not_attending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid RSVP status' });
    }

    // Check if RSVP already exists
    const existing = await pool.query(
      'SELECT * FROM rsvps WHERE session_id = $1 AND user_id = $2',
      [session_id, user_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing RSVP
      result = await pool.query(
        'UPDATE rsvps SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE session_id = $2 AND user_id = $3 RETURNING *',
        [status, session_id, user_id]
      );
    } else {
      // Create new RSVP
      result = await pool.query(
        'INSERT INTO rsvps (session_id, user_id, status) VALUES ($1, $2, $3) RETURNING *',
        [session_id, user_id, status]
      );
    }
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'RSVP already exists' });
    }
    console.error('Error creating RSVP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete RSVP
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM rsvps WHERE rsvp_id = $1 RETURNING rsvp_id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'RSVP not found' });
    }
    
    res.json({ success: true, message: 'RSVP deleted successfully' });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

