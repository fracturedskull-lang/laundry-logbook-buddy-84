
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchMachines, addMachine, updateMachineStatus } from "@/services/database";
import { Machine } from "@/types/business";
import { sanitizeInput } from "@/lib/security";
import { Cog, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";

const Machines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const data = await fetchMachines();
      setMachines(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load machines",
        variant: "destructive"
      });
    }
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedName = sanitizeInput(newMachineName);
      await addMachine(sanitizedName);
      
      toast({
        title: "Success",
        description: "Machine added successfully"
      });
      
      setNewMachineName("");
      setShowAddForm(false);
      loadMachines();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (machineId: string, newStatus: Machine['status']) => {
    try {
      await updateMachineStatus(machineId, newStatus);
      toast({
        title: "Success",
        description: "Machine status updated"
      });
      loadMachines();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: Machine['status']) => {
    switch (status) {
      case 'idle':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadgeVariant = (status: Machine['status']) => {
    switch (status) {
      case 'idle':
        return 'default';
      case 'running':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Machines</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </div>

      {/* Add Machine Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Machine</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMachine} className="space-y-4">
              <div>
                <Label htmlFor="machineName">Machine Name *</Label>
                <Input
                  id="machineName"
                  type="text"
                  maxLength={50}
                  value={newMachineName}
                  onChange={(e) => setNewMachineName(e.target.value)}
                  placeholder="e.g., Washer #1, Dryer A"
                  required
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Machine"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Machines List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="h-5 w-5" />
            Machine Status ({machines.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {machines.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No machines added yet. Add your first machine to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((machine) => (
                <Card key={machine.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{machine.name}</h3>
                      {getStatusIcon(machine.status)}
                    </div>
                    
                    <div className="space-y-3">
                      <Badge variant={getStatusBadgeVariant(machine.status)}>
                        {machine.status}
                      </Badge>
                      
                      <div>
                        <Label htmlFor={`status-${machine.id}`}>Update Status</Label>
                        <Select 
                          onValueChange={(value) => handleStatusChange(machine.id, value as Machine['status'])}
                          defaultValue={machine.status}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="idle">Idle</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(machine.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Machines;
