
-- Remove the restrictive check constraint on machines type
ALTER TABLE public.machines DROP CONSTRAINT IF EXISTS machines_type_check;

-- Also check if there are any other constraints that might be causing issues
-- Let's make sure the type field can accept any text value
ALTER TABLE public.machines ALTER COLUMN type TYPE text;
