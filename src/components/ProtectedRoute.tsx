
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdminPermissions?: boolean;
  fallback?: ReactNode;
}

const ProtectedRoute = ({ 
  children, 
  requireAdminPermissions = false, 
  fallback 
}: ProtectedRouteProps) => {
  const { hasAdminPermissions, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (requireAdminPermissions && !hasAdminPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Insufficient Permissions</span>
            </div>
            <p className="text-muted-foreground">
              You need admin-level permissions to access this feature. Contact an administrator to request access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
