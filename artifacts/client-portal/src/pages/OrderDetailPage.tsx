import { useRoute } from "wouter";
import { 
  useGetOrder, 
  getGetOrderQueryKey,
  useGetOrderApprovalStatus,
  getGetOrderApprovalStatusQueryKey,
  useCreateGRN
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ClipboardCheck, Truck01, File06, UserCheck01 } from "@untitledui/icons";

export default function OrderDetailPage() {
  const [, params] = useRoute("/orders/:id");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading: orderLoading } = useGetOrder(id!, {
    query: {
      enabled: !!id,
      queryKey: getGetOrderQueryKey(id!),
    }
  });

  const { data: approval, isLoading: approvalLoading } = useGetOrderApprovalStatus(id!, {
    query: {
      enabled: !!id,
      queryKey: getGetOrderApprovalStatusQueryKey(id!),
    }
  });

  const createGRN = useCreateGRN();

  const handleCreateGRN = () => {
    const grnItems = order?.items?.map(item => ({
      master_product_id: item.master_product_id,
      name_en: item.name_en,
      qty_received: item.qty,
      condition: "ok" as const
    })) || [];

    // Find the delivery note ID (dn_id) from the order if possible, or use a placeholder for now
    // In a real app, this would come from the list of delivery notes for this order
    const dnId = "placeholder-dn-id";

    createGRN.mutate({ 
      id: dnId,
      data: { 
        dn_id: dnId,
        items: grnItems 
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id!) });
        toast({ title: "GRN Created", description: "Goods Receipt Note has been generated successfully." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "GRN failed", description: error.message });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (orderLoading) return <Skeleton className="h-64 w-full" />;
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Order {order.po_number || order.id.slice(0, 8)}</h1>
            <Badge variant="outline" className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Issued {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'delivered' && (
            <Button onClick={handleCreateGRN} disabled={createGRN.isPending} data-testid="button-create-grn">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Receive Goods (GRN)
            </Button>
          )}
          <Button variant="outline">
            <Truck01 className="mr-2 h-4 w-4" />
            Track Shipment
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name_en}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">SAR {item.unit_price_sar?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">
                      SAR {item.total_sar?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-6 space-y-2 text-right border-t pt-4">
              <div className="flex justify-end gap-8 text-lg font-bold">
                <span>Total Amount</span>
                <span className="w-32 text-primary">SAR {order.total_sar?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck01 className="h-5 w-5" />
                Approval Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-4">
                  {approval?.tasks?.map((task, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1">
                        {task.status === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : task.status === 'rejected' ? (
                          <div className="h-5 w-5 rounded-full bg-red-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Level {task.order_in_chain}</p>
                        <p className="text-xs text-muted-foreground capitalize">{task.status}</p>
                      </div>
                    </div>
                  ))}
                  {(!approval?.tasks || approval.tasks.length === 0) && (
                    <p className="text-sm text-muted-foreground">No approval chain required.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <File06 className="h-5 w-5" />
                PO Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">Transaction Ref: {order.transaction_ref || "N/A"}</p>
              <p>Type: {order.type}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
