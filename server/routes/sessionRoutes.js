import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Get all sessions for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      `SELECT s.*, u.name as creator_name, u.email as creator_email,
              COUNT(r.rsvp_id) as total_rsvps,
              COUNT(CASE WHEN r.status = 'attending' THEN 1 END) as attending_count
       FROM sessions s
       LEFT JOIN users u ON s.creator_id = u.user_id
       LEFT JOIN rsvps r ON s.session_id = r.session_id
       WHERE s.group_id = $1
       GROUP BY s.session_id, u.name, u.email
       ORDER BY s.session_date ASC`,
      [groupId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.*, u.name as creator_name, u.email as creator_email
       FROM sessions s
       LEFT JOIN users u ON s.creator_id = u.user_id
       WHERE s.session_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const { group_id, creator_id, title, session_date, duration_minutes, location, agenda } = req.body;
    
    if (!group_id || !creator_id || !title || !session_date || !duration_minutes) {
      return res.status(400).json({ 
        success: false, 
        error: 'Group ID, creator ID, title, session date, and duration are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO sessions (group_id, creator_id, title, session_date, duration_minutes, location, agenda)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [group_id, creator_id, title, session_date, duration_minutes, location || null, agenda || null]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update session
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, session_date, duration_minutes, location, agenda } = req.body;
    
    const result = await pool.query(
      `UPDATE sessions 
       SET title = COALESCE($1, title),
           session_date = COALESCE($2, session_date),
           duration_minutes = COALESCE($3, duration_minutes),
           location = COALESCE($4, location),
           agenda = COALESCE($5, agenda)
       WHERE session_id = $6
       RETURNING *`,
      [title, session_date, duration_minutes, location, agenda, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sessions WHERE session_id = $1 RETURNING session_id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

