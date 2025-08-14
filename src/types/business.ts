
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  user_id: string;
}

export interface Machine {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'maintenance';
  current_job_id?: string;
  created_at: string;
  user_id: string;
}

export interface Job {
  id: string;
  customer_id: string;
  customer?: Customer;
  machine_id: string;
  machine?: Machine;
  weight: number;
  detergent: string;
  status: 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid';
  created_at: string;
  completed_at?: string;
  user_id: string;
}

export interface Payment {
  id: string;
  job_id: string;
  job?: Job;
  amount: number;
  method: 'cash' | 'card' | 'mobile';
  created_at: string;
  user_id: string;
}

export interface DashboardStats {
  activeJobs: number;
  idleMachines: number;
  runningMachines: number;
  maintenanceMachines: number;
  totalRevenue: number;
  todayRevenue: number;
}
