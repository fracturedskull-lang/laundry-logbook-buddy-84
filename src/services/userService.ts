
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, AdminUser, UserRole } from "@/types/user";

// User Profiles
export const fetchUserProfiles = async () => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as UserProfile[];
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ user_role: role, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
};

export const deleteUserProfile = async (userId: string) => {
  const { error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
};

// Admin Users
export const fetchAdminUsers = async () => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AdminUser[];
};

export const makeUserAdmin = async (userId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("admin_users")
    .insert({ user_id: userId, created_by: user.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as AdminUser;
};

export const removeUserAdmin = async (userId: string) => {
  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
};

// Check if current user is admin
export const checkIsAdmin = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Check if current user has admin-level permissions
export const checkHasAdminPermissions = async () => {
  const { data, error } = await supabase.rpc('has_admin_permissions');
  if (error) throw error;
  return data as boolean;
};

// Check if any admin users exist in the system
export const checkAdminExists = async () => {
  const { data, error } = await supabase.rpc('admin_users_exist');
  if (error) throw error;
  return data as boolean;
};

// Bootstrap function to make the first admin using the new database function
export const bootstrapFirstAdmin = async () => {
  const { data, error } = await supabase.rpc('create_first_admin');
  if (error) throw error;
  return data[0] as AdminUser;
};

// Make yourself admin (for initial setup)
export const makeCurrentUserAdmin = async () => {
  try {
    return await bootstrapFirstAdmin();
  } catch (error) {
    console.error("Error in makeCurrentUserAdmin:", error);
    throw error;
  }
};

// Create user invitation (placeholder for now)
export const inviteUser = async (email: string, role: UserRole, fullName?: string) => {
  // This would typically send an invitation email
  // For now, we'll return instructions
  return {
    success: true,
    message: `Invitation would be sent to ${email} with role ${role}`,
    email,
    role,
    fullName
  };
};
