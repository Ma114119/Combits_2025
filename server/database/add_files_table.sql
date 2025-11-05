-- Add files table for group file sharing
-- Run this in pgAdmin Query Tool

CREATE TABLE IF NOT EXISTS group_files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_group_files_group ON group_files(group_id);
CREATE INDEX IF NOT EXISTS idx_group_files_uploader ON group_files(uploaded_by);

