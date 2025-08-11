/*
  # Fix User Signup Database Triggers

  This migration ensures that when a new user signs up through Supabase Auth,
  the necessary associated records are automatically created in our application tables.

  1. Database Functions
     - `handle_new_user()` - Creates user_plans and notification_preferences records
     - `update_updated_at_column()` - Updates the updated_at timestamp
     - `create_default_notification_preferences()` - Creates default notification settings

  2. Triggers
     - Trigger on auth.users to create associated records
     - Triggers to update timestamps on record changes

  3. Security
     - Ensures proper RLS policies for new user record creation
*/

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    reminder_30_days,
    reminder_7_days,
    reminder_1_day,
    overdue_alerts,
    email_time
  ) VALUES (
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

-- Main function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default user plan
  INSERT INTO public.user_plans (
    user_id,
    plan_type,
    subscription_limit,
    features
  ) VALUES (
    NEW.id,
    'free'::user_plan_type,
    5,
    '{"reports": false, "analytics": false, "api_access": false, "team_features": false}'::jsonb
  );
  
  -- Create default notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    reminder_30_days,
    reminder_7_days,
    reminder_1_day,
    overdue_alerts,
    email_time
  ) VALUES (
    NEW.id,
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies allow the trigger to insert records
-- Temporarily disable RLS for the trigger operations by using SECURITY DEFINER

-- Update existing RLS policies to ensure they work with the trigger
DROP POLICY IF EXISTS "Users can create their own plan" ON public.user_plans;
CREATE POLICY "Users can create their own plan" 
  ON public.user_plans 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow trigger to create user plans" ON public.user_plans;
CREATE POLICY "Allow trigger to create user plans" 
  ON public.user_plans 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can create their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can create their own notification preferences" 
  ON public.notification_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow trigger to create notification preferences" ON public.notification_preferences;
CREATE POLICY "Allow trigger to create notification preferences" 
  ON public.notification_preferences 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- Ensure the trigger function has proper permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT INSERT ON public.user_plans TO anon, authenticated;
GRANT INSERT ON public.notification_preferences TO anon, authenticated;