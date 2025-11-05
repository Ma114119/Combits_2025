import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Get all memberships for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      `SELECT m.*, u.name, u.email, u.university, u.semester, u.profile_picture_url,
              COALESCE(m.role, CASE WHEN m.status = 'creator' THEN 'owner' ELSE 'member' END) as role
       FROM memberships m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.group_id = $1
       ORDER BY 
         CASE WHEN COALESCE(m.role, CASE WHEN m.status = 'creator' THEN 'owner' ELSE 'member' END) = 'owner' THEN 1
              WHEN COALESCE(m.role, 'member') = 'admin' THEN 2
              WHEN COALESCE(m.role, 'member') = 'moderator' THEN 3
              ELSE 4 END,
         m.joined_at ASC`,
      [groupId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all groups for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT m.*, g.*, u.name as creator_name
       FROM memberships m
       JOIN groups g ON m.group_id = g.group_id
       JOIN users u ON g.creator_id = u.user_id
       WHERE m.user_id = $1
       ORDER BY m.joined_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join a group (create membership request)
router.post('/', async (req, res) => {
  try {
    const { user_id, group_id } = req.body;
    
    if (!user_id || !group_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and Group ID are required' 
      });
    }

    // Check if group exists and has space
    const groupResult = await pool.query(
      `SELECT g.*, COUNT(m.user_id) as current_members
       FROM groups g
       LEFT JOIN memberships m ON g.group_id = m.group_id AND m.status IN ('approved', 'creator')
       WHERE g.group_id = $1
       GROUP BY g.group_id`,
      [group_id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const group = groupResult.rows[0];
    if (parseInt(group.current_members) >= group.max_capacity) {
      return res.status(400).json({ success: false, error: 'Group is full' });
    }

    // Check if already a member
    const existing = await pool.query(
      'SELECT * FROM memberships WHERE user_id = $1 AND group_id = $2',
      [user_id, group_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Already a member of this group' });
    }

    // Determine status based on group type
    // Public groups: auto-approve, Private groups: pending
    const status = group.group_type === 'public' ? 'approved' : 'pending';

    const result = await pool.query(
      'INSERT INTO memberships (user_id, group_id, status) VALUES ($1, $2, $3) RETURNING *',
      [user_id, group_id, status]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'Already a member of this group' });
    }
    console.error('Error creating membership:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update membership status (approve/reject) or role
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;
    
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (status && ['pending', 'approved'].includes(status)) {
      updateFields.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (role && ['owner', 'admin', 'moderator', 'member'].includes(role)) {
      updateFields.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE memberships SET ${updateFields.join(', ')} WHERE membership_id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating membership:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave group / Remove membership
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM memberships WHERE membership_id = $1 RETURNING membership_id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Membership not found' });
    }
    
    res.json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    console.error('Error deleting membership:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

