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
import { useToast } from "@/hooks/use-toast";
import { 
  useListPendingOffers, 
  useAdminApproveOffer, 
  useAdminRejectOffer, 
  getListPendingOffersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";

export default function OffersQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: offers, isLoading } = useListPendingOffers();
  const approveMutation = useAdminApproveOffer();
  const rejectMutation = useAdminRejectOffer();

  const handleApprove = (offerId: string) => {
    approveMutation.mutate({ id: offerId }, {
      onSuccess: () => {
        toast({ title: "Offer approved" });
        queryClient.invalidateQueries({ queryKey: getListPendingOffersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReject = (offerId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;

    rejectMutation.mutate({ id: offerId, data: { reason } }, {
      onSuccess: () => {
        toast({ title: "Offer rejected" });
        queryClient.invalidateQueries({ queryKey: getListPendingOffersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Offers</h1>
        <p className="text-muted-foreground">Review and approve product offers from suppliers.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier ID</TableHead>
              <TableHead>Product ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              offers?.data.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.supplier_company_id}</TableCell>
                  <TableCell>{offer.master_product_id}</TableCell>
                  <TableCell>{offer.approval_status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(offer.id)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${offer.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(offer.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${offer.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && offers?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No pending offers to review.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
