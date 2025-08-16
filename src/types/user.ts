
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  user_role: 'owner' | 'manager' | 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
  created_by?: string;
}

export type UserRole = 'owner' | 'manager' | 'admin' | 'user';
