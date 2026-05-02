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
  useListSuppliers, 
  useSuspendUser, 
  useReactivateUser, 
  getListSuppliersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Power, PowerOff } from "lucide-react";

export default function SuppliersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: suppliers, isLoading } = useListSuppliers();
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();

  const handleSuspend = (userId: string) => {
    suspendMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "Supplier suspended" });
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReactivate = (userId: string) => {
    reactivateMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "Supplier reactivated" });
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <p className="text-muted-foreground">Manage all registered supplier users.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              suppliers?.data.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="font-medium">{supplier.real_name}</div>
                    <div className="text-xs text-muted-foreground">{supplier.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                      {supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {supplier.status === 'active' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-500 hover:text-red-600 border-red-200"
                        onClick={() => handleSuspend(supplier.id)}
                        disabled={suspendMutation.isPending}
                        data-testid={`button-suspend-${supplier.id}`}
                      >
                        <PowerOff className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-green-500 hover:text-green-600 border-green-200"
                        onClick={() => handleReactivate(supplier.id)}
                        disabled={reactivateMutation.isPending}
                        data-testid={`button-reactivate-${supplier.id}`}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
