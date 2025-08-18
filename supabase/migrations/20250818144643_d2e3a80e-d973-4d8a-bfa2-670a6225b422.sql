
-- Phase 1: Critical Data Access Control Fixes

-- 1. Fix admin_users table RLS policies - remove the overly permissive policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON public.admin_users;

-- Create more secure admin_users policies
CREATE POLICY "Admin level users can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (has_admin_permissions());

CREATE POLICY "Admin level users can insert admin users" 
  ON public.admin_users 
  FOR INSERT 
  WITH CHECK (has_admin_permissions());

CREATE POLICY "Admin level users can delete admin users" 
  ON public.admin_users 
  FOR DELETE 
  USING (has_admin_permissions());

-- 2. Implement role-based data access for business tables
-- Update customers policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated users view customers" ON public.customers;
CREATE POLICY "Admin level users can view customers" 
  ON public.customers 
  FOR SELECT 
  USING (has_admin_permissions());

-- Update jobs policies to be more restrictive  
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON public.jobs;
CREATE POLICY "Admin level users can view jobs" 
  ON public.jobs 
  FOR SELECT 
  USING (has_admin_permissions());

-- Update machines policies to be more restrictive for viewing
DROP POLICY IF EXISTS "Authenticated users can view machines" ON public.machines;
CREATE POLICY "Admin level users can view machines" 
  ON public.machines 
  FOR SELECT 
  USING (has_admin_permissions());

-- Update payments policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
CREATE POLICY "Admin level users can view payments" 
  ON public.payments 
  FOR SELECT 
  USING (has_admin_permissions());

-- 3. Secure database functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.has_admin_permissions()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Check if user is in admin_users table OR has owner/manager/admin role
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND user_role IN ('owner', 'manager', 'admin')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Check if the current user is an admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_users_exist()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.admin_users);
$function$;

CREATE OR REPLACE FUNCTION public.create_first_admin()
 RETURNS TABLE(id uuid, user_id uuid, created_at timestamp with time zone, created_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_user_id uuid;
  result_record RECORD;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();

  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Check if any admin users already exist
  IF public.admin_users_exist() THEN
    RAISE EXCEPTION 'Admin users already exist. Contact an existing admin.';
  END IF;

  -- Insert the first admin
  INSERT INTO public.admin_users (user_id, created_by)
  VALUES (current_user_id, current_user_id)
  RETURNING * INTO result_record;

  -- Return the result
  RETURN QUERY SELECT result_record.id, result_record.user_id, result_record.created_at, result_record.created_by;
END;
$function$;

-- 4. Add database-level input validation triggers
CREATE OR REPLACE FUNCTION validate_customer_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate name length
  IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Validate phone number (basic validation)
  IF NEW.phone IS NOT NULL AND length(NEW.phone) < 10 THEN
    RAISE EXCEPTION 'Phone number must be at least 10 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_customer_data
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION validate_customer_input();

-- Add validation for jobs
CREATE OR REPLACE FUNCTION validate_job_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate load weight
  IF NEW.load_weight IS NOT NULL AND (NEW.load_weight <= 0 OR NEW.load_weight > 1000) THEN
    RAISE EXCEPTION 'Load weight must be between 0 and 1000 kg';
  END IF;
  
  -- Validate status values
  IF NEW.status NOT IN ('pending', 'active', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid job status';
  END IF;
  
  -- Validate payment status
  IF NEW.payment_status NOT IN ('pending', 'paid', 'overdue') THEN
    RAISE EXCEPTION 'Invalid payment status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_job_data
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION validate_job_input();

-- Add validation for payments
CREATE OR REPLACE FUNCTION validate_payment_input()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate amount
  IF NEW.amount <= 0 OR NEW.amount > 1000000 THEN
    RAISE EXCEPTION 'Payment amount must be between 0 and 1,000,000';
  END IF;
  
  -- Validate payment method
  IF NEW.method NOT IN ('cash', 'card', 'transfer', 'mobile') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_payment_data
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION validate_payment_input();

-- 5. Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admin-level users can view audit logs
CREATE POLICY "Admin level users can view audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (has_admin_permissions());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  WITH CHECK (true);
