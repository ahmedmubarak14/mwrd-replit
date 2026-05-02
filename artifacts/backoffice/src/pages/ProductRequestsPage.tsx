import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  useAdminListProductRequests, 
  useAdminApproveProductRequest, 
  useAdminRejectProductRequest, 
  useAdminListProducts,
  getAdminListProductRequestsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, SearchMd } from "@untitledui/icons";

export default function ProductRequestsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [masterProductId, setMasterProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  
  const { data: requests, isLoading } = useAdminListProductRequests();
  const { data: masterProducts } = useAdminListProducts({ search: productSearch });
  
  const approveMutation = useAdminApproveProductRequest();
  const rejectMutation = useAdminRejectProductRequest();

  const handleApprove = () => {
    if (!selectedRequest || !masterProductId) return;

    approveMutation.mutate({ 
      id: selectedRequest.id, 
      data: { master_product_id: masterProductId } as any
    }, {
      onSuccess: () => {
        toast({ title: "Product request approved and mapped" });
        queryClient.invalidateQueries({ queryKey: getAdminListProductRequestsQueryKey() });
        setSelectedRequest(null);
        setMasterProductId("");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReject = (requestId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;

    rejectMutation.mutate({ id: requestId, data: { reason } }, {
      onSuccess: () => {
        toast({ title: "Product request rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminListProductRequestsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Requests</h1>
        <p className="text-muted-foreground">Review and map new product additions (PAR) from suppliers.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier ID</TableHead>
              <TableHead>Proposed Product</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              requests?.data.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.supplier_company_id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{req.proposed_name_en}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(req.id)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${req.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setSelectedRequest(req)}
                        data-testid={`button-approve-${req.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Product Request</DialogTitle>
            <DialogDescription>
              Map the proposed product "{selectedRequest?.proposed_name_en}" to a Master Product.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Master Product</label>
              <div className="relative">
                <SearchMd className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Type to search catalog..." 
                  className="pl-8"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-auto border rounded-md">
              <Table>
                <TableBody>
                  {masterProducts?.data.map((p) => (
                    <TableRow 
                      key={p.id} 
                      className={`cursor-pointer ${masterProductId === p.id ? 'bg-primary/20' : ''}`}
                      onClick={() => setMasterProductId(p.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{p.name_en}</div>
                        <div className="text-xs text-muted-foreground">{p.master_product_code}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button 
              onClick={handleApprove} 
              disabled={!masterProductId || approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Approving..." : "Approve & Map"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
