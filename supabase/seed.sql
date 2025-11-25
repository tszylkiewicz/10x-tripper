/*
 * Seed Data: Development/Testing User
 * Purpose: Create a default test user for local development
 * WARNING: This is for development only. Never run in production!
 */

-- Insert test user into auth.users table
-- This user is referenced in API endpoints as a mock during development
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  '20eaee6f-d503-41d9-8ce9-4219f2c06533'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@tripper.dev',
  -- password is 'test123' (bcrypt hashed)
  '$2a$10$rKvvKvvKvvKvvKvvKvvKvOG9pW3aW3aW3aW3aW3aW3aW3aW3aW3aW',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Test User"}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Verify user was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '20eaee6f-d503-41d9-8ce9-4219f2c06533') THEN
    RAISE NOTICE 'Test user created successfully: test@tripper.dev (id: 20eaee6f-d503-41d9-8ce9-4219f2c06533)';
  ELSE
    RAISE NOTICE 'Test user already exists';
  END IF;
END $$;