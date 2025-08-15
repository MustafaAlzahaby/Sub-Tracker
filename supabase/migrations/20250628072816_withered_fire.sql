/*
  # Add INSERT policy for notifications table

  1. Security
    - Add policy for authenticated users to insert their own notifications
    - This allows the application to create notifications for users when they hit plan limits or other events

  2. Changes
    - Add INSERT policy to notifications table that allows users to insert notifications for themselves
*/

CREATE POLICY "Users can insert own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);