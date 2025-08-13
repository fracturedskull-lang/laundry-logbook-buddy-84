import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LaundryEntry } from "@/types/laundry";
import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface RecentEntriesProps {
  entries: LaundryEntry[];
}

export const RecentEntries = ({ entries }: RecentEntriesProps) => {
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className="bg-gradient-card shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEntries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No entries logged yet. Add your first entry above.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedEntries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {entry.type === 'incoming' ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={entry.type === 'incoming' ? 'default' : 'secondary'}
                        className={entry.type === 'incoming' 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-accent text-accent-foreground'
                        }
                      >
                        {entry.type === 'incoming' ? 'In' : 'Out'}
                      </Badge>
                      <span className="font-semibold">{entry.weight} kg</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Signed by {entry.signedBy}
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-muted-foreground italic mt-1">
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {format(new Date(entry.timestamp), 'MMM dd, HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};