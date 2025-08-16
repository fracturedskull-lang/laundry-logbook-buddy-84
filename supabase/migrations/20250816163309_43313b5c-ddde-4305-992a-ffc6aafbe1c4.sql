
-- First, let's fix the is_admin function to work properly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Create an enum for user roles
CREATE TYPE public.user_role AS ENUM ('owner', 'manager', 'admin', 'user');

-- Add role column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'user';

-- Create a function to check if user has admin-level permissions (owner, manager, or admin)
CREATE OR REPLACE FUNCTION public.has_admin_permissions()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is in admin_users table OR has owner/manager role
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND user_role IN ('owner', 'manager', 'admin')
  );
END;
$$;

-- Update RLS policies to use the new permission function
-- Update customers policies
DROP POLICY IF EXISTS "Admin can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admin can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admin can delete customers" ON public.customers;

CREATE POLICY "Admin level users can insert customers" 
ON public.customers FOR INSERT 
WITH CHECK (public.has_admin_permissions());

CREATE POLICY "Admin level users can update customers" 
ON public.customers FOR UPDATE 
USING (public.has_admin_permissions());

CREATE POLICY "Admin level users can delete customers" 
ON public.customers FOR DELETE 
USING (public.has_admin_permissions());

-- Update machines policies
DROP POLICY IF EXISTS "Admin can insert machines" ON public.machines;
DROP POLICY IF EXISTS "Admin can update machines" ON public.machines;
DROP POLICY IF EXISTS "Admin can delete machines" ON public.machines;

CREATE POLICY "Admin level users can insert machines" 
ON public.machines FOR INSERT 
WITH CHECK (public.has_admin_permissions());

CREATE POLICY "Admin level users can update machines" 
ON public.machines FOR UPDATE 
USING (public.has_admin_permissions()) 
WITH CHECK (public.has_admin_permissions());

CREATE POLICY "Admin level users can delete machines" 
ON public.machines FOR DELETE 
USING (public.has_admin_permissions());

-- Update jobs policies
DROP POLICY IF EXISTS "Admin can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin can delete jobs" ON public.jobs;

CREATE POLICY "Admin level users can insert jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (public.has_admin_permissions());

CREATE POLICY "Admin level users can update jobs" 
ON public.jobs FOR UPDATE 
USING (public.has_admin_permissions());

CREATE POLICY "Admin level users can delete jobs" 
ON public.jobs FOR DELETE 
USING (public.has_admin_permissions());

-- Update payments policies
DROP POLICY IF EXISTS "Admin can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can delete payments" ON public.payments;

CREATE POLICY "Admin level users can insert payments" 
ON public.payments FOR INSERT 
WITH CHECK (public.has_admin_permissions());

CREATE POLICY "Admin level users can update payments" 
ON public.payments FOR UPDATE 
USING (public.has_admin_permissions());

CREATE POLICY "Admin level users can delete payments" 
ON public.payments FOR DELETE 
USING (public.has_admin_permissions());

-- Update user_profiles policies to allow admin-level users to manage roles
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;

CREATE POLICY "Admin level users can insert user profiles" 
ON public.user_profiles FOR INSERT 
WITH CHECK (public.has_admin_permissions());

CREATE POLICY "Admin level users can update user profiles" 
ON public.user_profiles FOR UPDATE 
USING (public.has_admin_permissions());

CREATE POLICY "Admin level users can view all user profiles" 
ON public.user_profiles FOR SELECT 
USING (public.has_admin_permissions());

-- Function to create a new user with role (for admins to add users)
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  user_email text,
  user_password text,
  full_name text DEFAULT NULL,
  role user_role DEFAULT 'user'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Check if current user has admin permissions
  IF NOT public.has_admin_permissions() THEN
    RAISE EXCEPTION 'Insufficient permissions to create users';
  END IF;

  -- This function would need to be implemented via edge function
  -- For now, return instructions for manual user creation
  RETURN json_build_object(
    'message', 'User creation must be done through authentication system',
    'email', user_email,
    'role', role
  );
END;
$$;
