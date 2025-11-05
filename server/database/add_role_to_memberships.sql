-- Add role column to memberships table
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member'));

-- Update existing creator memberships to have role 'owner'
UPDATE memberships 
SET role = 'owner' 
WHERE status = 'creator';

-- Make creator status and role consistent
ALTER TABLE memberships 
DROP CONSTRAINT IF EXISTS memberships_status_check;

CREATE TYPE membership_status_new AS ENUM ('pending', 'approved');
ALTER TABLE memberships 
ALTER COLUMN status TYPE VARCHAR(20);

UPDATE memberships 
SET status = 'approved' 
WHERE status = 'creator';

ALTER TABLE memberships 
ADD CONSTRAINT memberships_status_check 
CHECK (status IN ('pending', 'approved'));

-- Set role to owner for all approved memberships where user is creator of the group
UPDATE memberships m
SET role = 'owner'
FROM groups g
WHERE m.group_id = g.group_id 
  AND m.user_id = g.creator_id 
  AND m.status = 'approved';

