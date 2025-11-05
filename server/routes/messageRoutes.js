import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Get all messages for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      `SELECT m.*, u.name as user_name, u.email as user_email, u.profile_picture_url,
              COALESCE(mem.role, CASE WHEN m.user_id = g.creator_id THEN 'owner' ELSE 'member' END) as user_role
       FROM group_messages m
       JOIN users u ON m.user_id = u.user_id
       LEFT JOIN memberships mem ON m.group_id = mem.group_id AND m.user_id = mem.user_id
       LEFT JOIN groups g ON m.group_id = g.group_id
       WHERE m.group_id = $1
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [groupId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new message
router.post('/', async (req, res) => {
  try {
    const { group_id, user_id, message } = req.body;
    
    if (!group_id || !user_id || !message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Group ID, user ID, and message are required' 
      });
    }

    // Check if user is a member of the group (approved or creator)
    const groupCheck = await pool.query(
      'SELECT creator_id FROM groups WHERE group_id = $1',
      [group_id]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Group not found' 
      });
    }

    const isCreator = groupCheck.rows[0].creator_id === user_id;
    
    if (!isCreator) {
      const membershipCheck = await pool.query(
        `SELECT m.*, g.creator_id,
                COALESCE(m.role, CASE WHEN m.user_id = g.creator_id THEN 'owner' ELSE 'member' END) as role
         FROM memberships m
         JOIN groups g ON m.group_id = g.group_id
         WHERE m.group_id = $1 AND m.user_id = $2 AND m.status IN ('approved', 'creator')`,
        [group_id, user_id]
      );

      if (membershipCheck.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          error: 'You must be a member of this group to send messages' 
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO group_messages (group_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [group_id, user_id, message.trim()]
    );

    // Get user info for the response
    const userResult = await pool.query(
      `SELECT u.name, u.email, u.profile_picture_url,
              COALESCE(mem.role, CASE WHEN $2 = g.creator_id THEN 'owner' ELSE 'member' END) as user_role
       FROM users u
       LEFT JOIN memberships mem ON mem.group_id = $1 AND mem.user_id = $2
       LEFT JOIN groups g ON g.group_id = $1 AND g.creator_id = $2
       WHERE u.user_id = $2`,
      [group_id, user_id]
    );

    const messageData = {
      ...result.rows[0],
      user_name: userResult.rows[0]?.name,
      user_email: userResult.rows[0]?.email,
      user_role: userResult.rows[0]?.user_role || 'member'
    };
    
    res.status(201).json({ success: true, data: messageData });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete message (only by owner, admin, or message sender)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, group_id } = req.body;

    // Get message details
    const messageResult = await pool.query(
      'SELECT * FROM group_messages WHERE message_id = $1',
      [id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const message = messageResult.rows[0];

    // Check permissions: owner, admin, or message sender can delete
    const membershipCheck = await pool.query(
      `SELECT m.*, g.creator_id,
              COALESCE(m.role, CASE WHEN m.user_id = g.creator_id THEN 'owner' ELSE 'member' END) as role
       FROM memberships m
       JOIN groups g ON m.group_id = g.group_id
       WHERE m.group_id = $1 AND m.user_id = $2 AND m.status = 'approved'`,
      [group_id || message.group_id, user_id]
    );

    const isOwner = membershipCheck.rows[0]?.creator_id === user_id;
    const isAdmin = membershipCheck.rows[0]?.role === 'admin';
    const isSender = message.user_id === user_id;

    if (!isOwner && !isAdmin && !isSender) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to delete this message' 
      });
    }

    const result = await pool.query(
      'DELETE FROM group_messages WHERE message_id = $1 RETURNING message_id',
      [id]
    );
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

