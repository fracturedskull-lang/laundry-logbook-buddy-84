import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LaundryEntry, LaundryStats } from "@/types/laundry";
import { StatsCard } from "@/components/StatsCard";
import { LaundryEntryForm } from "@/components/LaundryEntryForm";
import { RecentEntries } from "@/components/RecentEntries";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Scale, TrendingUp, TrendingDown, Package, LogOut } from "lucide-react";

const Index = () => {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load entries from database
  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("laundry_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedEntries: LaundryEntry[] = data.map(entry => ({
        id: entry.id,
        type: entry.type as 'incoming' | 'outgoing',
        weight: Number(entry.weight),
        signedBy: entry.signed_by,
        timestamp: new Date(entry.created_at),
        notes: entry.notes || undefined,
      }));

      setEntries(formattedEntries);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load laundry entries.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (entryData: Omit<LaundryEntry, 'id' | 'timestamp'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("laundry_entries")
        .insert({
          user_id: user.id,
          type: entryData.type,
          weight: entryData.weight,
          signed_by: entryData.signedBy,
          notes: entryData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: LaundryEntry = {
        id: data.id,
        type: data.type as 'incoming' | 'outgoing',
        weight: Number(data.weight),
        signedBy: data.signed_by,
        timestamp: new Date(data.created_at),
        notes: data.notes || undefined,
      };

      setEntries(prev => [newEntry, ...prev]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add laundry entry.",
        variant: "destructive",
      });
      throw error; // Re-throw so the form can handle it
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold mb-2">Laundry Logbook</h1>
              <p className="text-primary-foreground/80 text-lg">
                Professional laundry tracking and management system
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="ml-4 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
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