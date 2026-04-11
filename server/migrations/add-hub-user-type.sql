-- Add 'hub' to user_type enum
ALTER TYPE "enum_users_user_type" ADD VALUE IF NOT EXISTS 'hub';

-- Add userId column to delivery_hubs table
ALTER TABLE delivery_hubs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_hubs_user_id ON delivery_hubs(user_id);
