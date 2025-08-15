
import { supabase } from "@/integrations/supabase/client";
import { Customer, Machine, Job, Payment } from "@/types/business";

// Customers
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

// Machines
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

// Jobs
export const fetchJobs = async (status?: string) => {
  let query = supabase
    .from("jobs")
    .select(`
      *,
      customer:customer_id(*),
      machine:machine_id(*)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Job[];
};

export const createJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'customer' | 'machine'>) => {
  const { data, error } = await supabase
    .from("jobs")
    .insert(jobData)
    .select(`
      *,
      customer:customer_id(*),
      machine:machine_id(*)
    `)
    .single();

  if (error) throw error;
  return data as Job;
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

// Payments
export const fetchPayments = async () => {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      job:job_id(
        *,
        customer:customer_id(*),
        machine:machine_id(*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Payment[];
};

export const recordPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'job'>) => {
  // Start a transaction to record payment and update job status
  const { data, error } = await supabase
    .from("payments")
    .insert(paymentData)
    .select(`
      *,
      job:job_id(
        *,
        customer:customer_id(*),
        machine:machine_id(*)
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

  return data as Payment;
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
