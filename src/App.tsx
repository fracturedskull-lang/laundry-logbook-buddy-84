
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import NewJob from "@/pages/NewJob";
import Customers from "@/pages/Customers";
import Machines from "@/pages/Machines";
import Payments from "@/pages/Payments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/UserManagement";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <AuthenticatedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={
                        <ProtectedRoute requireAdminPermissions>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/jobs/new" element={
                        <ProtectedRoute requireAdminPermissions>
                          <NewJob />
                        </ProtectedRoute>
                      } />
                      <Route path="/customers" element={
                        <ProtectedRoute requireAdminPermissions>
                          <Customers />
                        </ProtectedRoute>
                      } />
                      <Route path="/machines" element={
                        <ProtectedRoute requireAdminPermissions>
                          <Machines />
                        </ProtectedRoute>
                      } />
                      <Route path="/payments" element={
                        <ProtectedRoute requireAdminPermissions>
                          <Payments />
                        </ProtectedRoute>
                      } />
                      <Route path="/reports" element={
                        <ProtectedRoute requireAdminPermissions>
                          <Reports />
                        </ProtectedRoute>
                      } />
                      <Route path="/user-management" element={
                        <ProtectedRoute requireAdminPermissions>
                          <UserManagement />
                        </ProtectedRoute>
                      } />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </AuthenticatedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
