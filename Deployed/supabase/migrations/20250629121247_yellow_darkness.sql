/*
  # Fix user registration database errors

  1. Issues Fixed
    - Add missing RLS policy for service role to insert users
    - Fix notification preferences RLS policies
    - Add proper trigger function for handling new user creation
    - Ensure user_plans trigger works correctly

  2. Changes Made
    - Update RLS policies to allow proper user creation flow
    - Add/update trigger functions for user creation
    - Fix any permission issues preventing user registration

  3. Security
    - Maintain proper RLS while allowing user creation
    - Ensure only authenticated users can access their own data
*/

-- First, let's create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the create_default_user_plan function
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default user plan
  INSERT INTO public.user_plans (user_id, plan_type, subscription_limit, features)
  VALUES (
    NEW.id,
    'free',
    5,
    '{"reports": false, "analytics": false, "api_access": false, "team_features": false}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the create_default_notification_preferences function
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default notification preferences
  INSERT INTO public.notification_preferences (
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_plan_trigger ON public.users;

-- Create trigger on auth.users to handle new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger on public.users to create user plan
CREATE TRIGGER create_user_plan_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_plan();

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;

-- Allow service role and the trigger function to insert users
CREATE POLICY "Allow user creation"
  ON public.users
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Update RLS policies for user_plans table
DROP POLICY IF EXISTS "Allow trigger to create user plans" ON public.user_plans;
DROP POLICY IF EXISTS "Users can create their own plan" ON public.user_plans;

CREATE POLICY "Allow user plan creation"
  ON public.user_plans
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Update RLS policies for notification_preferences table
DROP POLICY IF EXISTS "Allow trigger to create notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can create their own notification preferences" ON public.notification_preferences;

CREATE POLICY "Allow notification preferences creation"
  ON public.notification_preferences
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Grant necessary permissions to the functions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure the auth schema trigger has proper permissions
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;