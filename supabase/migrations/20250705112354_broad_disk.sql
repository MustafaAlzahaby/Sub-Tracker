/*
  # Create email logs table for tracking sent emails

  1. New Tables
    - `email_logs` table for tracking sent renewal emails

  2. Security
    - Enable RLS on email_logs table
    - Add policies for service role to manage email logs

  3. Indexes
    - Add indexes for efficient email log queries
*/

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  email_subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email logs
CREATE POLICY "Service role can manage email logs"
  ON email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS email_logs_user_id_idx ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS email_logs_subscription_id_idx ON email_logs(subscription_id);
CREATE INDEX IF NOT EXISTS email_logs_sent_at_idx ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS email_logs_type_idx ON email_logs(email_type);