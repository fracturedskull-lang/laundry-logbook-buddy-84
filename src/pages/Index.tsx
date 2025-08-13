import { useState, useMemo } from "react";
import { LaundryEntry, LaundryStats } from "@/types/laundry";
import { StatsCard } from "@/components/StatsCard";
import { LaundryEntryForm } from "@/components/LaundryEntryForm";
import { RecentEntries } from "@/components/RecentEntries";
import { Scale, TrendingUp, TrendingDown, Package } from "lucide-react";

const Index = () => {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);

  const stats: LaundryStats = useMemo(() => {
    const totalIncoming = entries
      .filter(e => e.type === 'incoming')
      .reduce((sum, e) => sum + e.weight, 0);
    
    const totalOutgoing = entries
      .filter(e => e.type === 'outgoing')
      .reduce((sum, e) => sum + e.weight, 0);

    return {
      totalIncoming,
      totalOutgoing,
      netBalance: totalIncoming - totalOutgoing,
      totalEntries: entries.length,
    };
  }, [entries]);

  const handleAddEntry = (entryData: Omit<LaundryEntry, 'id' | 'timestamp'>) => {
    const newEntry: LaundryEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setEntries(prev => [...prev, newEntry]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Laundry Logbook</h1>
            <p className="text-primary-foreground/80 text-lg">
              Professional laundry tracking and management system
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Incoming"
            value={`${stats.totalIncoming.toFixed(1)} kg`}
            subtitle="Laundry received"
            icon={<TrendingUp className="h-4 w-4" />}
            trend="up"
          />
          <StatsCard
            title="Total Outgoing"
            value={`${stats.totalOutgoing.toFixed(1)} kg`}
            subtitle="Laundry dispatched"
            icon={<TrendingDown className="h-4 w-4" />}
            trend="down"
          />
          <StatsCard
            title="Net Balance"
            value={`${stats.netBalance.toFixed(1)} kg`}
            subtitle={stats.netBalance >= 0 ? "In inventory" : "Over-dispatched"}
            icon={<Scale className="h-4 w-4" />}
            trend={stats.netBalance >= 0 ? 'up' : 'down'}
          />
          <StatsCard
            title="Total Entries"
            value={stats.totalEntries.toString()}
            subtitle="Logged transactions"
            icon={<Package className="h-4 w-4" />}
            trend="neutral"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Entry Form */}
          <div>
            <LaundryEntryForm onAddEntry={handleAddEntry} />
          </div>

          {/* Recent Entries */}
          <div>
            <RecentEntries entries={entries} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;