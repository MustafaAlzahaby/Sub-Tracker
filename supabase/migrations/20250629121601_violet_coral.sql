-- First, let's recreate the trigger functions with proper error handling

-- Function to create default user plan
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan_type, subscription_limit, features)
  VALUES (
    NEW.id,
    'free'::user_plan_type,
    5,
    '{"reports": false, "analytics": false, "api_access": false, "team_features": false}'::jsonb
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create default user plan for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    RAISE WARNING 'Failed to create default notification preferences for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation (if it doesn't exist)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to recreate them
DROP TRIGGER IF EXISTS create_user_plan_trigger ON public.users;
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON public.user_plans;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Recreate triggers with proper error handling
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER create_user_plan_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_plan();

CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Drop existing service role policies and recreate them
DROP POLICY IF EXISTS "Service role can manage users during signup" ON public.users;
DROP POLICY IF EXISTS "Service role can manage user plans during signup" ON public.user_plans;
DROP POLICY IF EXISTS "Service role can manage notification preferences during signup" ON public.notification_preferences;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Allow user plan creation" ON public.user_plans;
DROP POLICY IF EXISTS "Allow notification preferences creation" ON public.notification_preferences;

-- Create new service role policies for user creation
CREATE POLICY "Allow user creation"
  ON public.users
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow user plan creation"
  ON public.user_plans
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow notification preferences creation"
  ON public.notification_preferences
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to the functions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION create_default_user_plan() TO service_role;
GRANT EXECUTE ON FUNCTION create_default_notification_preferences() TO service_role;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;

-- Ensure the service role can insert into all necessary tables
GRANT INSERT ON public.users TO service_role;
GRANT INSERT ON public.user_plans TO service_role;
GRANT INSERT ON public.notification_preferences TO service_role;
GRANT SELECT ON public.users TO service_role;
GRANT SELECT ON public.user_plans TO service_role;
GRANT SELECT ON public.notification_preferences TO service_role;