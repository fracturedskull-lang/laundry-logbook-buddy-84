
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

export const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'user_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("customers")
    .insert({ ...customer, user_id: user.id })
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
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Machine[];
};

export const addMachine = async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("machines")
    .insert({ name, status: 'idle', user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Machine;
};

export const updateMachineStatus = async (machineId: string, status: Machine['status'], currentJobId?: string) => {
  const { data, error } = await supabase
    .from("machines")
    .update({ status, current_job_id: currentJobId })
    .eq("id", machineId)
    .select()
    .single();

  if (error) throw error;
  return data as Machine;
};

// Jobs
export const fetchJobs = async (status?: Job['status']) => {
  let query = supabase
    .from("jobs")
    .select(`
      *,
      customer:customers(*),
      machine:machines(*)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Job[];
};

export const createJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'user_id' | 'customer' | 'machine'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if machine is available
  const { data: machine } = await supabase
    .from("machines")
    .select("status")
    .eq("id", jobData.machine_id)
    .single();

  if (machine?.status !== 'idle') {
    throw new Error("Machine is not available");
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...jobData, user_id: user.id })
    .select(`
      *,
      customer:customers(*),
      machine:machines(*)
    `)
    .single();

  if (error) throw error;

  // Update machine status
  await updateMachineStatus(jobData.machine_id, 'running', data.id);

  return data as Job;
};

export const completeJob = async (jobId: string) => {
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .select("machine_id")
    .single();

  if (jobError) throw jobError;

  // Update machine status back to idle
  await updateMachineStatus(job.machine_id, 'idle');

  return job;
};

// Payments
export const fetchPayments = async () => {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      job:jobs(
        *,
        customer:customers(*),
        machine:machines(*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Payment[];
};

export const recordPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'user_id' | 'job'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("payments")
    .insert({ ...paymentData, user_id: user.id })
    .select(`
      *,
      job:jobs(
        *,
        customer:customers(*),
        machine:machines(*)
      )
    `)
    .single();

  if (error) throw error;

  // Update job payment status
  await supabase
    .from("jobs")
    .update({ payment_status: 'paid' })
    .eq("id", paymentData.job_id);

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
    activeJobs: jobs.filter(j => j.status === 'active').length,
    idleMachines: machines.filter(m => m.status === 'idle').length,
    runningMachines: machines.filter(m => m.status === 'running').length,
    maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    todayRevenue: todayPayments.reduce((sum, p) => sum + p.amount, 0)
  };
};
