/*
  # Fix user signup trigger

  1. Database Functions
    - Create or replace `handle_new_user()` function to create default user plan
    - Create or replace `create_default_notification_preferences()` function
    - Create or replace `update_updated_at_column()` function for timestamps

  2. Triggers
    - Ensure trigger on auth.users table calls handle_new_user function
    - This will automatically create user_plans and notification_preferences for new users

  3. Security
    - Functions are created with SECURITY DEFINER to bypass RLS during trigger execution
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default user plan
  INSERT INTO public.user_plans (user_id, plan_type, subscription_limit, features)
  VALUES (
    NEW.id,
    'free'::user_plan_type,
    5,
    '{"reports": false, "analytics": false, "api_access": false, "team_features": false}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default notification preferences (called by trigger on user_plans)
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
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

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the user_plans trigger exists (should already be there based on schema)
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON public.user_plans;
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();

-- Ensure the updated_at triggers exist
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON public.user_plans;
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();