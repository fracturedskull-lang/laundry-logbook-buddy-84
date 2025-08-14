
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchPayments, recordPayment, fetchJobs } from "@/services/database";
import { Payment, Job } from "@/types/business";
import { DollarSign, Plus } from "lucide-react";

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidJobs, setUnpaidJobs] = useState<Job[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    job_id: "",
    amount: "",
    method: "cash" as const
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, jobsData] = await Promise.all([
        fetchPayments(),
        fetchJobs()
      ]);
      
      setPayments(paymentsData);
      setUnpaidJobs(jobsData.filter(job => job.payment_status === 'pending'));
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
      const paymentData = {
        job_id: formData.job_id,
        amount: parseFloat(formData.amount),
        method: formData.method,
        date: new Date().toISOString()
      };

      if (paymentData.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      await recordPayment(paymentData);
      
      toast({
        title: "Success",
        description: "Payment recorded successfully"
      });
      
      setFormData({ job_id: "", amount: "", method: "cash" });
      setShowAddForm(false);
      loadData();
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Record Payment Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="job">Job *</Label>
                <Select 
                  onValueChange={(value) => setFormData({...formData, job_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an unpaid job" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidJobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.customer?.name} - {job.machine?.name} ({job.load_weight}kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method *</Label>
                  <Select 
                    onValueChange={(value: any) => setFormData({...formData, method: value})}
                    defaultValue="cash"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile">Mobile Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Recording..." : "Record Payment"}
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

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No payments recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">
                      {payment.job?.customer?.name} - {payment.job?.machine?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.job?.load_weight}kg • {payment.job?.detergent_used}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${payment.amount.toFixed(2)}</p>
                    <Badge variant="outline" className="capitalize">
                      {payment.method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
