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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useListLeads, useMarkCallbackComplete, getListLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [notes, setNotes] = useState("");
  
  const { data: leads, isLoading } = useListLeads();
  const markCompleteMutation = useMarkCallbackComplete();

  const handleMarkComplete = () => {
    if (!selectedLead) return;

    markCompleteMutation.mutate({ 
      id: selectedLead.id, 
      data: { notes } 
    }, {
      onSuccess: () => {
        toast({ title: "Callback marked complete" });
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        setSelectedLead(null);
        setNotes("");
      },
      onError: (err: any) => {
        toast({ 
          title: "Error", 
          description: err.message, 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads Queue</h1>
        <p className="text-muted-foreground">Pending callback requests from registered users.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              leads?.data.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium">{lead.real_name}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.created_at ? format(new Date(lead.created_at), "MMM d, HH:mm") : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedLead(lead)}
                      data-testid={`button-complete-${lead.id}`}
                    >
                      Complete Callback
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && leads?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No pending leads in the queue.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Callback Complete</DialogTitle>
            <DialogDescription>
              Record notes from the conversation with {selectedLead?.real_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Notes</label>
              <Textarea 
                placeholder="Details about the callback, requirements discussed, etc." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>Cancel</Button>
            <Button 
              onClick={handleMarkComplete} 
              disabled={markCompleteMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {markCompleteMutation.isPending ? "Saving..." : "Save & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
