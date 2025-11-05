import express from 'express';
import { pool } from '../config/database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed!'));
    }
  }
});

const router = express.Router();

// Get all files for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await pool.query(
      `SELECT f.*, u.name as uploaded_by_name, u.email as uploaded_by_email
       FROM group_files f
       LEFT JOIN users u ON f.uploaded_by = u.user_id
       WHERE f.group_id = $1
       ORDER BY f.created_at DESC`,
      [groupId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file to group
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { group_id, uploaded_by, description } = req.body;
    
    if (!group_id || !uploaded_by) {
      return res.status(400).json({ 
        success: false, 
        error: 'Group ID and user ID are required' 
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = path.extname(req.file.originalname).toLowerCase();

    const result = await pool.query(
      `INSERT INTO group_files (group_id, uploaded_by, file_name, file_url, file_type, file_size, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        group_id,
        uploaded_by,
        req.file.originalname,
        fileUrl,
        fileType,
        req.file.size,
        description || null
      ]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info first
    const fileResult = await pool.query('SELECT * FROM group_files WHERE file_id = $1', [id]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const file = fileResult.rows[0];
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', file.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query('DELETE FROM group_files WHERE file_id = $1', [id]);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

