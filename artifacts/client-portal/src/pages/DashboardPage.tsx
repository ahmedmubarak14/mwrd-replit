import { useLocation } from "wouter";
import { 
  useGetDashboardStats, 
  useListRFQs, 
  getListRFQsQueryKey 
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp 
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: rfqsData, isLoading: rfqsLoading } = useListRFQs({}, {
    query: {
      queryKey: getListRFQsQueryKey({}),
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'awarded': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your procurement overview.</p>
        </div>
        <Button onClick={() => setLocation("/catalog")} data-testid="button-new-rfq">
          <PlusCircle className="mr-2 h-4 w-4" />
          New RFQ
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-open-rfqs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold" data-testid="text-open-rfqs-count">
                {stats?.open_rfqs || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-pending-quotes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold" data-testid="text-pending-quotes-count">
                {stats?.pending_quotes || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-active-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold" data-testid="text-active-orders-count">
                {stats?.active_orders || 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-total-spend">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold" data-testid="text-total-spend">
                SAR {stats?.total_spend_sar?.toLocaleString() || "0"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {rfqsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqsData?.data?.slice(0, 5).map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-medium" data-testid={`text-rfq-title-${rfq.id}`}>
                      {rfq.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(rfq.status)} data-testid={`status-rfq-${rfq.id}`}>
                        {rfq.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-rfq-date-${rfq.id}`}>
                      {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setLocation(`/rfqs/${rfq.id}`)}
                        data-testid={`button-view-rfq-${rfq.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!rfqsData?.data || rfqsData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No recent RFQs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
