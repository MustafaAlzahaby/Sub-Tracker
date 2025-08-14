-- Create users table if it doesn't exist (mirrors auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to insert users (for triggers)
DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Populate users table with existing auth.users data
INSERT INTO users (id, email, full_name, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id);

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create default user plan
  INSERT INTO user_plans (user_id, plan_type, subscription_limit, features)
  VALUES (
    NEW.id,
    'free',
    5,
    '{"reports": false, "analytics": false, "api_access": false, "team_features": false}'::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    reminder_30_days,
    reminder_7_days,
    reminder_1_day,
    overdue_alerts,
    email_time
  )
  VALUES (
    NEW.user_id,
    true,
    true,
    false,
    true,
    false,
    true,
    '09:00:00'::time
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user plan creation
    RAISE LOG 'Error in create_default_notification_preferences trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON user_plans;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create trigger for notification preferences (after user plan is created)
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Update foreign key constraints safely
-- First, remove any orphaned records that don't have corresponding users

-- Remove orphaned user_plans records
DELETE FROM user_plans 
WHERE user_id NOT IN (SELECT id FROM users);

-- Remove orphaned notification_preferences records
DELETE FROM notification_preferences 
WHERE user_id NOT IN (SELECT id FROM users);

-- Remove orphaned notifications records
DELETE FROM notifications 
WHERE user_id NOT IN (SELECT id FROM users);

-- Remove orphaned subscriptions records
DELETE FROM subscriptions 
WHERE user_id NOT IN (SELECT id FROM users);

-- Now safely update foreign key constraints

-- Update user_plans foreign key
DO $$
BEGIN
  -- Check if the foreign key constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_plans_user_id_fkey' 
    AND table_name = 'user_plans'
  ) THEN
    ALTER TABLE user_plans DROP CONSTRAINT user_plans_user_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE user_plans ADD CONSTRAINT user_plans_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Update notification_preferences foreign key
DO $$
BEGIN
  -- Check if the foreign key constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notification_preferences_user_id_fkey' 
    AND table_name = 'notification_preferences'
  ) THEN
    ALTER TABLE notification_preferences DROP CONSTRAINT notification_preferences_user_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Update notifications foreign key
DO $$
BEGIN
  -- Check if the foreign key constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_user_id_fkey' 
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Update subscriptions foreign key
DO $$
BEGIN
  -- Check if the foreign key constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscriptions_user_id_fkey' 
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;
  END IF;
  
  -- Add the correct foreign key constraint
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Update RLS policies to allow service role operations for triggers
DROP POLICY IF EXISTS "Service role can manage user plans" ON user_plans;
CREATE POLICY "Service role can manage user plans"
  ON user_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage notification preferences" ON notification_preferences;
CREATE POLICY "Service role can manage notification preferences"
  ON notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to create their own plans and preferences (needed for existing policies)
DROP POLICY IF EXISTS "Users can create their own plan" ON user_plans;
CREATE POLICY "Users can create their own plan"
  ON user_plans
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow trigger to create user plans" ON user_plans;
CREATE POLICY "Allow trigger to create user plans"
  ON user_plans
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can create their own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow trigger to create notification preferences" ON notification_preferences;
CREATE POLICY "Allow trigger to create notification preferences"
  ON notification_preferences
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);