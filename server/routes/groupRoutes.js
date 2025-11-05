import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Get all groups
router.get('/', async (req, res) => {
  try {
    const { type, course_name } = req.query;
    let query = `
      SELECT g.*, u.name as creator_name, u.email as creator_email,
             COUNT(m.user_id) as current_members
      FROM groups g
      LEFT JOIN users u ON g.creator_id = u.user_id
      LEFT JOIN memberships m ON g.group_id = m.group_id AND m.status = 'approved'
      WHERE 1=1
    `;
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND g.group_type = $${params.length}`;
    }
    
    if (course_name) {
      params.push(`%${course_name}%`);
      query += ` AND g.course_name ILIKE $${params.length}`;
    }
    
    query += ` GROUP BY g.group_id, u.name, u.email ORDER BY g.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get group by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.*, u.name as creator_name, u.email as creator_email,
              COUNT(m.user_id) as current_members
       FROM groups g
       LEFT JOIN users u ON g.creator_id = u.user_id
       LEFT JOIN memberships m ON g.group_id = m.group_id AND m.status = 'approved'
       WHERE g.group_id = $1
       GROUP BY g.group_id, u.name, u.email`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new group
router.post('/', async (req, res) => {
  try {
    const { creator_id, name, course_name, course_code, description, max_capacity, group_type, meeting_schedule, meeting_location } = req.body;
    
    if (!creator_id || !name || !course_name || !max_capacity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Creator ID, name, course name, and max capacity are required' 
      });
    }

    if (max_capacity < 3 || max_capacity > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Max capacity must be between 3 and 10' 
      });
    }

    const result = await pool.query(
      `INSERT INTO groups (creator_id, name, course_name, course_code, description, max_capacity, group_type, meeting_schedule, meeting_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [creator_id, name, course_name, course_code || null, description || null, max_capacity, group_type || 'public', meeting_schedule || null, meeting_location || null]
    );
    
    // Auto-add creator as approved member
    await pool.query(
      'INSERT INTO memberships (user_id, group_id, status) VALUES ($1, $2, $3)',
      [creator_id, result.rows[0].group_id, 'creator']
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, course_name, course_code, description, max_capacity, group_type, meeting_schedule, meeting_location } = req.body;
    
    const result = await pool.query(
      `UPDATE groups 
       SET name = COALESCE($1, name),
           course_name = COALESCE($2, course_name),
           course_code = COALESCE($3, course_code),
           description = COALESCE($4, description),
           max_capacity = COALESCE($5, max_capacity),
           group_type = COALESCE($6, group_type),
           meeting_schedule = COALESCE($7, meeting_schedule),
           meeting_location = COALESCE($8, meeting_location)
       WHERE group_id = $9
       RETURNING *`,
      [name, course_name, course_code, description, max_capacity, group_type, meeting_schedule, meeting_location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM groups WHERE group_id = $1 RETURNING group_id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

