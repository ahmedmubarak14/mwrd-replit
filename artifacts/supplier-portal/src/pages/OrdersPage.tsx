import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListOrders } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders();

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Total Amount (SAR)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !orders || orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.po_number}</TableCell>
                  <TableCell>${order.total_sar.toLocaleString()}</TableCell>
                  <TableCell>{order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        order.status === "pending" && "bg-yellow-100 text-yellow-800",
                        order.status === "approved" && "bg-blue-100 text-blue-800",
                        order.status === "shipped" && "bg-purple-100 text-purple-800",
                        order.status === "delivered" && "bg-green-100 text-green-800",
                        order.status === "cancelled" && "bg-red-100 text-red-800"
                      )}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
