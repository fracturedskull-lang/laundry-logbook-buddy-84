
-- Create a function to check if any admin users exist (bypass RLS)
CREATE OR REPLACE FUNCTION public.admin_users_exist()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users);
$$;

-- Add a new RLS policy that allows first admin creation when no admins exist
CREATE POLICY "Allow first admin creation" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  NOT public.admin_users_exist()
);

-- Create a function to safely create the first admin
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS TABLE(id uuid, user_id uuid, created_at timestamptz, created_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
