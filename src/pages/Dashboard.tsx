
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJobs, fetchMachines, fetchDashboardStats } from "@/services/database";
import { Job, Machine, DashboardStats } from "@/types/business";
import { 
  Users, 
  Cog, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [jobsData, machinesData, statsData] = await Promise.all([
        fetchJobs('active'),
        fetchMachines(),
        fetchDashboardStats()
      ]);
      
      setActiveJobs(jobsData);
      setMachines(machinesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate('/jobs/new')}>
          <Clock className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Machines</CardTitle>
            <Cog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.availableMachines || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.todayRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Today's earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Jobs ({activeJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active jobs. Create a new job to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {activeJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{job.customer?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.machine?.name} • {job.load_weight}kg • {job.detergent_used}
                      </p>
                    </div>
                    <Badge variant={job.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {job.payment_status}
                    </Badge>
                  </div>
                ))}
                {activeJobs.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All Jobs
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Machine Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              Machine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {machines.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No machines configured. Add machines to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {machines.map((machine) => (
                  <div key={machine.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {machine.status === 'available' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {machine.status === 'in_use' && <Clock className="h-5 w-5 text-orange-500" />}
                      {machine.status === 'maintenance' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      <div>
                        <p className="font-medium">{machine.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{machine.status}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        machine.status === 'available' ? 'default' : 
                        machine.status === 'in_use' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {machine.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
