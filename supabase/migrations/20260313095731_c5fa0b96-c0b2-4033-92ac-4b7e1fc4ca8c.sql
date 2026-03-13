
-- Update existing hospital with a default slug
UPDATE public.hospitals SET slug = 'city-general' WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE public.hospitals ALTER COLUMN slug SET NOT NULL;

-- Allow super_admin to view ALL hospitals
CREATE POLICY "Super admins can view all hospitals"
  ON public.hospitals FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to manage all hospitals
CREATE POLICY "Super admins can manage hospitals"
  ON public.hospitals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to view/manage all user_roles
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow anonymous access to hospitals for slug lookup (patients need before login)
CREATE POLICY "Public can lookup hospital by slug"
  ON public.hospitals FOR SELECT
  TO anon
  USING (true);

-- Super admin cross-hospital visibility
CREATE POLICY "Super admins can view all patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all doctors"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));
