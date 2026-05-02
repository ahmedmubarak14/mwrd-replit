import { useLocation } from "wouter";
import { 
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

export default function RFQsPage() {
  const [, setLocation] = useLocation();
  const { data: rfqs, isLoading } = useListRFQs({}, {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RFQs</h1>
        <p className="text-muted-foreground">Manage your requests for quotation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Delivery City</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs?.rfqs?.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-medium" data-testid={`text-rfq-title-${rfq.id}`}>{rfq.title}</TableCell>
                    <TableCell data-testid={`text-rfq-city-${rfq.id}`}>{rfq.delivery_city}</TableCell>
                    <TableCell data-testid={`text-rfq-date-${rfq.id}`}>
                      {rfq.delivery_date ? new Date(rfq.delivery_date).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(rfq.status)} data-testid={`status-rfq-${rfq.id}`}>
                        {rfq.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setLocation(`/rfqs/${rfq.id}`)}
                        data-testid={`button-view-rfq-${rfq.id}`}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!rfqs?.rfqs || rfqs.rfqs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No RFQs found. Start by adding products from the catalog.
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
