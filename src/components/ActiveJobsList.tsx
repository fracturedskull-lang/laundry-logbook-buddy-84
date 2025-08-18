
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/types/business";
import { Clock, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActiveJobsListProps {
  jobs: Job[];
  onViewAll?: () => void;
}

const ActiveJobsList = ({ jobs, onViewAll }: ActiveJobsListProps) => {
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const formatStartTime = (dateString?: string) => {
    if (!dateString) return 'Not started';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Jobs ({jobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No active jobs. Create a new job to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
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
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Started by: {job.created_by_user?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Started: {formatStartTime(job.start_time)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Created {formatTimeAgo(job.created_at)}
                </p>
              </div>
            ))}
            {jobs.length > 5 && onViewAll && (
              <Button variant="outline" className="w-full" onClick={onViewAll}>
                View All {jobs.length} Jobs
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveJobsList;
