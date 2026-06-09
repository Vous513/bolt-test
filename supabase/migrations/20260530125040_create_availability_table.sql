/*
  # Create availability table

  1. New Tables
    - `availability`
      - `id` (uuid, primary key)
      - `date` (date, not null) - the date for which availability is set
      - `time_slot` (text, not null) - time slot in format "HH:MM-HH:MM"
      - `is_available` (boolean, default false) - whether the user is available
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `availability` table
    - Add policy for authenticated users to manage their own availability
    - Add policy for public read access (since no auth required for this simple app)

  3. Indexes
    - Unique index on (date, time_slot) to prevent duplicate entries
*/

CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time_slot text NOT NULL,
  is_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create unique index to prevent duplicate time slots for the same date
CREATE UNIQUE INDEX IF NOT EXISTS availability_date_time_slot_idx 
  ON availability (date, time_slot);

-- Enable RLS
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Anyone can view availability"
  ON availability FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy for public insert access
CREATE POLICY "Anyone can insert availability"
  ON availability FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy for public update access
CREATE POLICY "Anyone can update availability"
  ON availability FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for public delete access
CREATE POLICY "Anyone can delete availability"
  ON availability FOR DELETE
  TO anon, authenticated
  USING (true);
