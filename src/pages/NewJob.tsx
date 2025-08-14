
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchCustomers, fetchMachines, createJob } from "@/services/database";
import { Customer, Machine } from "@/types/business";
import { sanitizeTextInput } from "@/lib/security";
import { Plus } from "lucide-react";

const NewJob = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    machine_id: "",
    load_weight: "",
    detergent_used: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersData, machinesData] = await Promise.all([
        fetchCustomers(),
        fetchMachines()
      ]);
      
      setCustomers(customersData);
      setMachines(machinesData.filter(m => m.status === 'available'));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedData = {
        customer_id: formData.customer_id,
        machine_id: formData.machine_id,
        load_weight: parseFloat(formData.load_weight),
        detergent_used: sanitizeTextInput(formData.detergent_used),
        status: 'pending',
        start_time: new Date().toISOString()
      };

      if (sanitizedData.load_weight <= 0) {
        throw new Error("Weight must be greater than 0");
      }

      await createJob(sanitizedData);
      
      toast({
        title: "Success",
        description: "Job created successfully"
      });
      
      navigate("/");
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Job</h1>
        <p className="text-muted-foreground">Start a new laundry job</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select 
                onValueChange={(value) => setFormData({...formData, customer_id: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="machine">Machine *</Label>
              <Select 
                onValueChange={(value) => setFormData({...formData, machine_id: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an available machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      Machine #{machine.machine_number} - {machine.type} ({machine.capacity_kg}kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={formData.load_weight}
                onChange={(e) => setFormData({...formData, load_weight: e.target.value})}
                placeholder="Enter weight in kg"
                required
              />
            </div>

            <div>
              <Label htmlFor="detergent">Detergent *</Label>
              <Input
                id="detergent"
                type="text"
                maxLength={50}
                value={formData.detergent_used}
                onChange={(e) => setFormData({...formData, detergent_used: e.target.value})}
                placeholder="Enter detergent type"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Job"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewJob;
