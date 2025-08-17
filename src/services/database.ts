
import { supabase } from "@/integrations/supabase/client";
import { Customer, Machine, Job, Payment } from "@/types/business";

// Customers - Now accessible to all authenticated users
export const fetchCustomers = async (searchQuery?: string) => {
  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Customer[];
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
};

// Machines - Restricted to admin-level users
export const fetchMachines = async () => {
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .order("machine_number", { ascending: true });

  if (error) throw error;
  return data as Machine[];
};

export const addMachine = async (machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from("machines")
    .insert(machine)
    .select()
    .single();

  if (error) throw error;
  return data as Machine;
};

export const updateMachineStatus = async (machineId: string, status: string) => {
  const { data, error } = await supabase
    .from("machines")
    .update({ status })
    .eq("id", machineId)
    .select()
    .single();

  if (error) throw error;
  return data as Machine;
};

// Jobs - Now accessible to all authenticated users
export const fetchJobs = async (status?: string) => {
  let query = supabase
    .from("jobs")
    .select(`
      *,
      customers!jobs_customer_id_fkey(*),
      machines!jobs_machine_id_fkey(*)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Transform the data to match our Job interface
  const transformedData = data.map(job => ({
    ...job,
    customer: job.customers,
    machine: job.machines
  }));

  return transformedData as Job[];
};

export const createJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'customer' | 'machine'>) => {
  const { data, error } = await supabase
    .from("jobs")
    .insert(jobData)
    .select(`
      *,
      customers!jobs_customer_id_fkey(*),
      machines!jobs_machine_id_fkey(*)
    `)
    .single();

  if (error) throw error;
  
  // Transform the data to match our Job interface
  const transformedData = {
    ...data,
    customer: data.customers,
    machine: data.machines
  };

  return transformedData as Job;
};

export const completeJob = async (jobId: string) => {
  const { data, error } = await supabase
    .from("jobs")
    .update({ 
      status: 'completed', 
      end_time: new Date().toISOString() 
    })
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Payments - Restricted to admin-level users
export const fetchPayments = async () => {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      jobs!payments_job_id_fkey(
        *,
        customers!jobs_customer_id_fkey(*),
        machines!jobs_machine_id_fkey(*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Transform the data to match our Payment interface
  const transformedData = data.map(payment => ({
    ...payment,
    job: {
      ...payment.jobs,
      customer: payment.jobs.customers,
      machine: payment.jobs.machines
    }
  }));

  return transformedData as Payment[];
};

export const recordPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'job'>) => {
  // Start a transaction to record payment and update job status
  const { data, error } = await supabase
    .from("payments")
    .insert(paymentData)
    .select(`
      *,
      jobs!payments_job_id_fkey(
        *,
        customers!jobs_customer_id_fkey(*),
        machines!jobs_machine_id_fkey(*)
      )
    `)
    .single();

  if (error) throw error;

  // Update the job's payment status to 'paid'
  const { error: updateError } = await supabase
    .from("jobs")
    .update({ payment_status: 'paid' })
    .eq("id", paymentData.job_id);

  if (updateError) throw updateError;

  // Transform the data to match our Payment interface
  const transformedData = {
    ...data,
    job: {
      ...data.jobs,
      customer: data.jobs.customers,
      machine: data.jobs.machines
    }
  };

  return transformedData as Payment;
};

// Dashboard stats
export const fetchDashboardStats = async () => {
  const [jobsResult, machinesResult, paymentsResult] = await Promise.all([
    supabase.from("jobs").select("*"),
    supabase.from("machines").select("*"),
    supabase.from("payments").select("amount, created_at")
  ]);

  const jobs = jobsResult.data || [];
  const machines = machinesResult.data || [];
  const payments = paymentsResult.data || [];

  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => p.created_at.startsWith(today));

  return {
    activeJobs: jobs.filter(j => j.status === 'active' || j.status === 'pending').length,
    availableMachines: machines.filter(m => m.status === 'available').length,
    runningMachines: machines.filter(m => m.status === 'in_use').length,
    maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    todayRevenue: todayPayments.reduce((sum, p) => sum + p.amount, 0)
  };
};

// Utility function to format currency as South African Rands
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
};
