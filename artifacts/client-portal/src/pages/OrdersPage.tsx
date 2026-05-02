import { useLocation } from "wouter";
import { 
  useListOrders, 
  getListOrdersQueryKey 
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

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = useListOrders({}, {
    query: {
      queryKey: getListOrdersQueryKey({}),
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Track your purchase orders and deliveries.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
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
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium" data-testid={`text-order-id-${order.id}`}>
                      {order.po_number || order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell data-testid={`text-order-supplier-${order.id}`}>{order.supplier_name}</TableCell>
                    <TableCell data-testid={`text-order-date-${order.id}`}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-testid={`text-order-amount-${order.id}`}>
                      SAR {order.total_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(order.status)} data-testid={`status-order-${order.id}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setLocation(`/orders/${order.id}`)}
                        data-testid={`button-view-order-${order.id}`}
                      >
                        View PO
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!orders?.orders || orders.orders.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No orders found. Award an RFQ to create a purchase order.
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
