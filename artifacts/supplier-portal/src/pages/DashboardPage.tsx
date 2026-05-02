import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetDashboardStats, useListMyQuotes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Quote, ShoppingCart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const StatCard = ({ title, value, icon: Icon, description, isLoading }: any) => (
  <Card className="border-card-border">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: quotesData, isLoading: quotesLoading } = useListMyQuotes();

  const quotes = quotesData?.data || [];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Supplier Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Open RFQs"
          value={stats?.open_rfqs || 0}
          icon={FileText}
          description="Awaiting your quote"
          isLoading={statsLoading}
        />
        <StatCard
          title="Submitted Quotes"
          value={stats?.pending_quotes || 0}
          icon={Quote}
          description="In review"
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Orders"
          value={stats?.active_orders || 0}
          icon={ShoppingCart}
          description="Needs delivery"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.total_spend_sar || 0).toLocaleString()}`}
          icon={TrendingUp}
          description="All time"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent quotes.</p>
            ) : (
              <div className="space-y-4">
                {quotes.slice(0, 5).map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">Quote #{quote.quote_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {quote.submitted_at ? formatDistanceToNow(new Date(quote.submitted_at), { addSuffix: true }) : 'Not submitted'}
                      </p>
                    </div>
                    <Badge 
                      className={cn(
                        quote.status === "draft" && "bg-gray-100 text-gray-800",
                        quote.status === "submitted" && "bg-blue-100 text-blue-800",
                        quote.status === "accepted" && "bg-green-100 text-green-800",
                        quote.status === "rejected" && "bg-red-100 text-red-800"
                      )}
                    >
                      {quote.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
