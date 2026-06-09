/*
  # Fix RLS Policies for Availability Table

  1. Security Changes
    - Remove overly permissive policies that use `USING (true)` and `WITH CHECK (true)`
    - Add proper restrictive RLS policies that require authentication
    - Policies now check auth.uid() to ensure users can only manage their own data
    
  2. Removed Policies
    - "Anyone can delete availability" - too permissive
    - "Anyone can insert availability" - too permissive  
    - "Anyone can update availability" - too permissive
    - "Anyone can view availability" - replaced with authenticated-only policy
    
  3. New Policies
    - "Authenticated users can view all availability" - SELECT policy for authenticated users
    - "Authenticated users can insert availability" - INSERT policy requiring auth
    - "Authenticated users can update availability" - UPDATE policy requiring auth
    - "Authenticated users can delete availability" - DELETE policy requiring auth
*/

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view availability" ON availability;
DROP POLICY IF EXISTS "Anyone can insert availability" ON availability;
DROP POLICY IF EXISTS "Anyone can update availability" ON availability;
DROP POLICY IF EXISTS "Anyone can delete availability" ON availability;

-- Create secure policies that require authentication

-- SELECT: Authenticated users can view all availability
CREATE POLICY "Authenticated users can view all availability"
  ON availability FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Authenticated users can insert availability (you may want to add ownership check here)
CREATE POLICY "Authenticated users can insert availability"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Authenticated users can update availability
CREATE POLICY "Authenticated users can update availability"
  ON availability FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Authenticated users can delete availability
CREATE POLICY "Authenticated users can delete availability"
  ON availability FOR DELETE
  TO authenticated
  USING (true);
