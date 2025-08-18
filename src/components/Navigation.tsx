
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  LayoutDashboard, 
  Plus, 
  Users, 
  Settings as SettingsIcon, 
  DollarSign, 
  BarChart3, 
  Cog,
  LogOut,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { 
    hasAdminPermissions,
    canViewCustomers,
    canViewJobs,
    canViewMachines,
    canViewPayments,
    canManageUsers
  } = usePermissions();

  const navItems = [
    { 
      path: "/", 
      icon: LayoutDashboard, 
      label: "Dashboard",
      show: hasAdminPermissions
    },
    { 
      path: "/jobs/new", 
      icon: Plus, 
      label: "New Job",
      show: canViewJobs
    },
    { 
      path: "/customers", 
      icon: Users, 
      label: "Customers",
      show: canViewCustomers
    },
    { 
      path: "/machines", 
      icon: Cog, 
      label: "Machines",
      show: canViewMachines
    },
    { 
      path: "/payments", 
      icon: DollarSign, 
      label: "Payments",
      show: canViewPayments
    },
    { 
      path: "/reports", 
      icon: BarChart3, 
      label: "Reports",
      show: hasAdminPermissions
    },
    { 
      path: "/user-management", 
      icon: Shield, 
      label: "User Management",
      show: canManageUsers
    },
    { 
      path: "/settings", 
      icon: SettingsIcon, 
      label: "Settings",
      show: true // Settings is available to all authenticated users
    },
  ];

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  const visibleNavItems = navItems.filter(item => item.show);

  return (
    <nav className="bg-card border-r border-border w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground">Laundry Manager</h2>
      </div>
      
      <div className="space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;
