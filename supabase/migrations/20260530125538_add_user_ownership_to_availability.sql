/*
  # Add User Ownership to Availability Table

  1. New Columns
    - `user_id` (uuid) - references auth.users to track who created each availability entry
    
  2. Security Changes
    - Update RLS policies to check user_id ownership
    - Users can only view, update, and delete their own availability
    - All authenticated users can view all availability (for calendar display)
    - Only the owner can modify their own availability
    
  3. Foreign Key
    - Add foreign key constraint to auth.users
*/

-- Add user_id column to track ownership
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'availability' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE availability ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view all availability" ON availability;
DROP POLICY IF EXISTS "Authenticated users can insert availability" ON availability;
DROP POLICY IF EXISTS "Authenticated users can update availability" ON availability;
DROP POLICY IF EXISTS "Authenticated users can delete availability" ON availability;

-- Create proper restrictive RLS policies with ownership checks

-- SELECT: All authenticated users can view availability (needed for calendar display)
CREATE POLICY "Authenticated users can view availability"
  ON availability FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Users can only insert their own availability
CREATE POLICY "Users can insert own availability"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own availability
CREATE POLICY "Users can update own availability"
  ON availability FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own availability
CREATE POLICY "Users can delete own availability"
  ON availability FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
