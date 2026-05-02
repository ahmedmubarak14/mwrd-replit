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
  useListClients, 
  useSuspendUser, 
  useReactivateUser, 
  getListClientsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Power01, Power02 } from "@untitledui/icons";

export default function ClientsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: clients, isLoading } = useListClients();
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();

  const handleSuspend = (userId: string) => {
    suspendMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "User suspended" });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReactivate = (userId: string) => {
    reactivateMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "User reactivated" });
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage all registered client users.</p>
        </div>
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
              clients?.data.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.real_name}</div>
                    <div className="text-xs text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {client.status === 'active' ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-500 hover:text-red-600 border-red-200"
                        onClick={() => handleSuspend(client.id)}
                        disabled={suspendMutation.isPending}
                        data-testid={`button-suspend-${client.id}`}
                      >
                        <Power02 className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-green-500 hover:text-green-600 border-green-200"
                        onClick={() => handleReactivate(client.id)}
                        disabled={reactivateMutation.isPending}
                        data-testid={`button-reactivate-${client.id}`}
                      >
                        <Power01 className="h-4 w-4 mr-2" />
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
