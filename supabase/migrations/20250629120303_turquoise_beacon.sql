/*
  # Fix user registration trigger

  1. Database Functions
    - Create or replace `handle_new_user()` function to automatically create user_plans entry
    - Ensure proper error handling and security

  2. Triggers
    - Create trigger on auth.users table to call handle_new_user function
    - This will automatically create a user_plans entry for each new user

  3. Security
    - Function runs with SECURITY DEFINER to have proper permissions
    - Ensures new users get default free plan with proper limits
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default user plan for the new user
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
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error creating user plan for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;