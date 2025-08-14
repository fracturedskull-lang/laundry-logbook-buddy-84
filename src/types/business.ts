
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: string;
  machine_number: number;
  type: string;
  name: string;
  capacity_kg: number;
  status: string;
  last_service_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  customer?: Customer;
  machine_id: string;
  machine?: Machine;
  load_weight: number;
  detergent_used: string;
  status: string;
  payment_status: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  job_id: string;
  job?: Job;
  amount: number;
  method: string;
  date: string;
  created_at: string;
}

export interface DashboardStats {
  activeJobs: number;
  availableMachines: number;
  runningMachines: number;
  maintenanceMachines: number;
  totalRevenue: number;
  todayRevenue: number;
}
