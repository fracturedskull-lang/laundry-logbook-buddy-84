
-- Add missing columns to existing tables
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing machines to have a name based on type and machine number
UPDATE public.machines 
SET name = type || ' #' || machine_number 
WHERE name IS NULL;

-- Make name column not null after populating it
ALTER TABLE public.machines ALTER COLUMN name SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE public.jobs ADD CONSTRAINT fk_jobs_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.jobs ADD CONSTRAINT fk_jobs_machine FOREIGN KEY (machine_id) REFERENCES public.machines(id);
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_job FOREIGN KEY (job_id) REFERENCES public.jobs(id);

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for jobs table
CREATE POLICY "Authenticated users can view jobs" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update jobs" ON public.jobs
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete jobs" ON public.jobs
  FOR DELETE USING (is_admin());

-- Add RLS policies for payments table
CREATE POLICY "Authenticated users can view payments" ON public.payments
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert payments" ON public.payments
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update payments" ON public.payments
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete payments" ON public.payments
  FOR DELETE USING (is_admin());

-- Add RLS policies for customers table
CREATE POLICY "Admin can insert customers" ON public.customers
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update customers" ON public.customers
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete customers" ON public.customers
  FOR DELETE USING (is_admin());

-- Add RLS policy for machines table to allow viewing
CREATE POLICY "Authenticated users can view machines" ON public.machines
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_machine_id ON public.jobs(machine_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON public.jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_machines_status ON public.machines(status);
