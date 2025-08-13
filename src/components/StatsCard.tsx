import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  className,
  trend = 'neutral'
}: StatsCardProps) => {
  return (
    <Card className={cn("bg-gradient-card shadow-card border-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className={cn(
            "text-xs mt-1",
            trend === 'up' && "text-success",
            trend === 'down' && "text-destructive", 
            trend === 'neutral' && "text-muted-foreground"
          )}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};