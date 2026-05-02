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
  useListKycQueue, 
  useApproveKYC, 
  useRejectKYC, 
  getListKycQueueQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Eye } from "@untitledui/icons";

export default function KycQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: queue, isLoading } = useListKycQueue();
  const approveMutation = useApproveKYC();
  const rejectMutation = useRejectKYC();

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "KYC Approved" });
        queryClient.invalidateQueries({ queryKey: getListKycQueueQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReject = (userId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;

    rejectMutation.mutate({ id: userId, data: { reason } }, {
      onSuccess: () => {
        toast({ title: "KYC Rejected" });
        queryClient.invalidateQueries({ queryKey: getListKycQueueQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Queue</h1>
        <p className="text-muted-foreground">Pending verification for new clients and suppliers.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              queue?.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.real_name}</div>
                    <div className="text-xs text-muted-foreground">{item.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.created_at ? format(new Date(item.created_at), "MMM d, HH:mm") : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleReject(item.id)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${item.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(item.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${item.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && queue?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No pending KYC applications.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
