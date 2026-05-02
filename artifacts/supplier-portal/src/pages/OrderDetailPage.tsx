import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: order, isLoading } = useGetOrder(id!);
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (order && order.items) {
      const initialQtys: Record<string, number> = {};
      order.items.forEach(item => {
        initialQtys[item.id] = item.qty; 
      });
      setQuantities(initialQtys);
    }
  }, [order]);

  const handleQtyChange = (itemId: string, qty: string) => {
    setQuantities(prev => ({ ...prev, [itemId]: parseInt(qty) || 0 }));
  };

  const handleCreateDN = () => {
    toast({ title: "Feature Pending", description: "Delivery Note creation is currently being updated in the API." });
  };

  if (isLoading) return <DashboardLayout><Skeleton className="h-10 w-1/3 mb-8" /><Skeleton className="h-64 w-full" /></DashboardLayout>;
  if (!order) return <DashboardLayout>Order not found</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.po_number}</h1>
          <p className="text-muted-foreground">Order ID: {order.id}</p>
        </div>
        <div>
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
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            {order.status === "approved" && (
              <Button onClick={handleCreateDN}>
                Create Delivery Note
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Unit Price (SAR)</TableHead>
                  <TableHead>Total (SAR)</TableHead>
                  {order.status === "approved" && <TableHead>Qty to Deliver</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.name_en}</div>
                    </TableCell>
                    <TableCell>{item.qty} {item.pack_type}</TableCell>
                    <TableCell>${item.unit_price_sar.toLocaleString()}</TableCell>
                    <TableCell>${item.total_sar.toLocaleString()}</TableCell>
                    {order.status === "approved" && (
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24"
                          value={quantities[item.id] || ""}
                          max={item.qty}
                          min={0}
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          data-testid={`input-qty-${item.id}`}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
