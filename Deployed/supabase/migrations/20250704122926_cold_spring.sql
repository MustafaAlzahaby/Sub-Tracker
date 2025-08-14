/*
  # Update user plan types to only include free and pro

  1. Updates
    - Remove business plan type from enum
    - Update existing business users to pro plan
    - Update notification preferences accordingly
    - Remove business-specific features from pro plan

  2. Changes
    - Update user_plan_type enum to only have 'free' and 'pro'
    - Migrate existing business plan users to pro
    - Update features and preferences accordingly
*/

-- First, update any existing business plan users to pro plan
UPDATE user_plans 
SET plan_type = 'pro'
WHERE plan_type = 'business';

-- Update notification preferences for users who were on business plan
UPDATE notification_preferences 
SET 
    reminder_30_days = false,
    reminder_1_day = false
WHERE user_id IN (
    SELECT user_id FROM user_plans WHERE plan_type = 'pro'
);

-- Update user plan features for pro users (remove business-specific features)
UPDATE user_plans 
SET features = jsonb_set(
    jsonb_set(
        features,
        '{team_features}',
        'false'
    ),
    '{api_access}',
    'false'
)
WHERE plan_type = 'pro';

-- Now update the enum type safely
DO $$ 
BEGIN
    -- Step 1: Drop the default constraint temporarily
    ALTER TABLE user_plans ALTER COLUMN plan_type DROP DEFAULT;
    
    -- Step 2: Create new enum type
    CREATE TYPE user_plan_type_new AS ENUM ('free', 'pro');
    
    -- Step 3: Update the column to use the new type
    ALTER TABLE user_plans 
    ALTER COLUMN plan_type TYPE user_plan_type_new 
    USING plan_type::text::user_plan_type_new;
    
    -- Step 4: Drop the old enum type
    DROP TYPE user_plan_type;
    
    -- Step 5: Rename the new type to the original name
    ALTER TYPE user_plan_type_new RENAME TO user_plan_type;
    
    -- Step 6: Restore the default constraint
    ALTER TABLE user_plans ALTER COLUMN plan_type SET DEFAULT 'free'::user_plan_type;
    
EXCEPTION
    WHEN duplicate_object THEN
        -- If the enum already exists with the correct values, just ensure defaults are correct
        ALTER TABLE user_plans ALTER COLUMN plan_type SET DEFAULT 'free'::user_plan_type;
        
    WHEN others THEN
        -- If any other error occurs, try to restore the default and re-raise
        BEGIN
            ALTER TABLE user_plans ALTER COLUMN plan_type SET DEFAULT 'free'::user_plan_type;
        EXCEPTION
            WHEN others THEN NULL;
        END;
        RAISE;
END $$;

-- Ensure all functions that reference the old business type are updated
-- Update the create_default_user_plan function to only use the new enum values
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

-- Update any existing check constraints that might reference the old enum values
DO $$
BEGIN
    -- Check if there are any check constraints on plan_type and update them
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%plan_type%' 
        AND constraint_schema = 'public'
    ) THEN
        -- Drop and recreate any plan_type check constraints
        ALTER TABLE user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_type_check;
        ALTER TABLE user_plans ADD CONSTRAINT user_plans_plan_type_check 
            CHECK (plan_type IN ('free', 'pro'));
    END IF;
END $$;

-- Verify the migration worked correctly
DO $$
DECLARE
    business_count INTEGER;
BEGIN
    -- Check if any business plan users still exist
    SELECT COUNT(*) INTO business_count 
    FROM user_plans 
    WHERE plan_type::text = 'business';
    
    IF business_count > 0 THEN
        RAISE WARNING 'Migration incomplete: % users still have business plan type', business_count;
    ELSE
        RAISE NOTICE 'Migration successful: All business plan users migrated to pro plan';
    END IF;
END $$;