
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { checkHasAdminPermissions } from "@/services/userService";

export const usePermissions = () => {
  const [hasAdminPermissions, setHasAdminPermissions] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setHasAdminPermissions(false);
        setLoading(false);
        return;
      }

      try {
        const permissions = await checkHasAdminPermissions();
        setHasAdminPermissions(permissions);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasAdminPermissions(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user]);

  return {
    hasAdminPermissions,
    loading,
    canViewCustomers: hasAdminPermissions,
    canViewJobs: hasAdminPermissions,
    canViewMachines: hasAdminPermissions,
    canViewPayments: hasAdminPermissions,
    canManageUsers: hasAdminPermissions,
    canCreateJobs: hasAdminPermissions,
    canModifyMachines: hasAdminPermissions,
    canRecordPayments: hasAdminPermissions
  };
};
