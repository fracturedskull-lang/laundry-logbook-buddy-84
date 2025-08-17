
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchPayments, formatCurrency } from "@/services/database";
import { Payment } from "@/types/business";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface RevenueData {
  date: string;
  amount: number;
}

const Reports = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<RevenueData[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<RevenueData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const paymentsData = await fetchPayments();
      setPayments(paymentsData);
      
      // Process data for different periods
      processDailyRevenue(paymentsData);
      processWeeklyRevenue(paymentsData);
      processMonthlyRevenue(paymentsData);
    } catch (error) {
      console.error("Error loading reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processDailyRevenue = (payments: Payment[]) => {
    const dailyData: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      const date = format(new Date(payment.created_at), 'yyyy-MM-dd');
      dailyData[date] = (dailyData[date] || 0) + payment.amount;
    });

    const sortedData = Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    setDailyRevenue(sortedData);
  };

  const processWeeklyRevenue = (payments: Payment[]) => {
    const weeklyData: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.created_at);
      const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd');
      const weekKey = `${weekStart} to ${weekEnd}`;
      
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + payment.amount;
    });

    const sortedData = Object.entries(weeklyData)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-12); // Last 12 weeks

    setWeeklyRevenue(sortedData);
  };

  const processMonthlyRevenue = (payments: Payment[]) => {
    const monthlyData: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.created_at);
      const monthKey = format(date, 'yyyy-MM');
      
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
    });

    const sortedData = Object.entries(monthlyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12); // Last 12 months

    setMonthlyRevenue(sortedData);
  };

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'daily':
        return dailyRevenue;
      case 'weekly':
        return weeklyRevenue;
      case 'monthly':
        return monthlyRevenue;
      default:
        return dailyRevenue;
    }
  };

  const exportToCSV = () => {
    const data = getCurrentData();
    const headers = ['Date', 'Revenue'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => `${item.date},${item.amount.toFixed(2)}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPeriod}_revenue_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const averageTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;

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
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{payments.length}</p>
            <p className="text-sm text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(averageTransaction)}</p>
            <p className="text-sm text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trends
            </div>
            <div className="flex gap-2">
              <Button 
                variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('daily')}
              >
                Daily
              </Button>
              <Button 
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button 
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('monthly')}
              >
                Monthly
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getCurrentData().length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No revenue data available for the selected period.
            </p>
          ) : (
            <div className="space-y-4">
              {getCurrentData().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">{item.date}</span>
                  <span className="text-lg font-semibold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
