import { supabase } from "@/integrations/supabase/client";
import { UserProfile, AdminUser } from "@/types/user";

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

// Check if any admin users exist in the system
export const checkAdminExists = async () => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .limit(1);

  if (error) throw error;
  return data && data.length > 0;
};

// Bootstrap function to make the first admin
export const bootstrapFirstAdmin = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  // Check if any admins exist
  const adminExists = await checkAdminExists();
  if (adminExists) {
    throw new Error("Admin users already exist. Contact an existing admin.");
  }

  // Direct insert for the first admin (bypassing RLS by being the first)
  const { data, error } = await supabase
    .from("admin_users")
    .insert({ user_id: user.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as AdminUser;
};

// Make yourself admin (for initial setup)
export const makeCurrentUserAdmin = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  try {
    // First try the bootstrap function
    return await bootstrapFirstAdmin();
  } catch (bootstrapError) {
    // If bootstrap fails, try regular admin creation
    const { data, error } = await supabase
      .from("admin_users")
      .insert({ user_id: user.user.id })
      .select()
      .single();

    if (error) throw error;
    return data as AdminUser;
  }
};
