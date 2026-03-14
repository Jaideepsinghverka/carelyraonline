-- Add user_id column to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update RLS: patients can view their own record
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update RLS: patients can insert their own record  
CREATE POLICY "Patients can insert own record"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());