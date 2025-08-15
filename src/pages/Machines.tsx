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
import { sanitizeTextInput } from "@/lib/security";
import { Cog, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";

const Machines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    machine_number: "",
    type: "",
    capacity_kg: ""
  });
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
      const sanitizedData = {
        machine_number: parseInt(formData.machine_number),
        type: sanitizeTextInput(formData.type),
        capacity_kg: parseFloat(formData.capacity_kg),
        name: `${sanitizeTextInput(formData.type)} #${formData.machine_number}`,
        status: 'available'
      };

      await addMachine(sanitizedData);
      
      toast({
        title: "Success",
        description: "Machine added successfully"
      });
      
      setFormData({ machine_number: "", type: "", capacity_kg: "" });
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

  const handleStatusChange = async (machineId: string, newStatus: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_use':
      case 'running':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'available':
        return 'default';
      case 'in_use':
      case 'running':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      default:
        return 'default';
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="machineNumber">Machine Number *</Label>
                  <Input
                    id="machineNumber"
                    type="number"
                    min="1"
                    value={formData.machine_number}
                    onChange={(e) => setFormData({...formData, machine_number: e.target.value})}
                    placeholder="e.g., 1, 2, 3"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Input
                    id="type"
                    type="text"
                    maxLength={50}
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder="e.g., Washer, Dryer"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity (kg) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.capacity_kg}
                    onChange={(e) => setFormData({...formData, capacity_kg: e.target.value})}
                    placeholder="e.g., 8.0"
                    required
                  />
                </div>
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
                      <h3 className="font-semibold">Machine #{machine.machine_number}</h3>
                      {getStatusIcon(machine.status)}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Type: {machine.type}</p>
                        <p className="text-sm text-muted-foreground">Capacity: {machine.capacity_kg}kg</p>
                      </div>
                      
                      <Badge variant={getStatusBadgeVariant(machine.status)}>
                        {machine.status}
                      </Badge>
                      
                      <div>
                        <Label htmlFor={`status-${machine.id}`}>Update Status</Label>
                        <Select 
                          onValueChange={(value) => handleStatusChange(machine.id, value)}
                          defaultValue={machine.status}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="in_use">In Use</SelectItem>
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
