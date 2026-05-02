import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ShieldCheck, 
  Receipt, 
  FilePlus, 
  Activity 
} from "lucide-react";
import { useGetBackofficeDashboardStats, useListAuditLog } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetBackofficeDashboardStats();
  const { data: auditLog, isLoading: logLoading } = useListAuditLog({});

  const kpis = [
    { 
      label: "Leads Queue", 
      value: stats?.pending_leads ?? 0, 
      icon: Users, 
      color: "text-blue-500",
      description: "Pending callback requests" 
    },
    { 
      label: "KYC Queue", 
      value: stats?.pending_kyc ?? 0, 
      icon: ShieldCheck, 
      color: "text-yellow-500",
      description: "Users awaiting verification" 
    },
    { 
      label: "Held Quotes", 
      value: stats?.held_quotes ?? 0, 
      icon: Receipt, 
      color: "text-red-500",
      description: "Requires margin approval" 
    },
    { 
      label: "Product Requests", 
      value: stats?.pending_offers ?? 0, // Using pending_offers as proxy for requests in stats
      icon: FilePlus, 
      color: "text-green-500",
      description: "New additions pending" 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of pending operations and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`kpi-value-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {kpi.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {auditLog?.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity_type} {log.entity_id} • by {log.actor_user_id}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              {auditLog?.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">No recent activity found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
