
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export const logAuditEvent = async (entry: AuditLogEntry) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user.user.id,
        ...entry,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
};

export const fetchAuditLogs = async (limit = 100) => {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
