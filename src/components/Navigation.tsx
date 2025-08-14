
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Plus, 
  Users, 
  Settings as SettingsIcon, 
  DollarSign, 
  BarChart3, 
  Cog,
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/jobs/new", icon: Plus, label: "New Job" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/machines", icon: Cog, label: "Machines" },
    { path: "/payments", icon: DollarSign, label: "Payments" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  return (
    <nav className="bg-card border-r border-border w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground">Laundry Manager</h2>
      </div>
      
      <div className="space-y-2">
        {navItems.map((item) => {
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
