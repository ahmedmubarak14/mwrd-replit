import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useListLeads, useMarkCallbackComplete, getListLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { safeFormat } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus01 } from "@untitledui/icons";

export default function LeadsQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [notes, setNotes] = useState("");

  const { data: leads, isLoading } = useListLeads();
  const markCompleteMutation = useMarkCallbackComplete();

  const rows = leads?.data ?? [];

  const handleMarkComplete = () => {
    if (!selectedLead) return;
    markCompleteMutation.mutate({ id: selectedLead.id, data: { notes } }, {
      onSuccess: () => {
        toast({ title: "Callback marked complete" });
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        setSelectedLead(null);
        setNotes("");
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Leads Queue</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Pending callback requests from registered users</p>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <UserPlus01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No pending leads in the queue.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Requested</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((lead) => (
                <tr key={lead.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[rgb(16,24,40)]">{lead.real_name}</div>
                    <div className="text-xs text-[rgb(102,112,133)] mt-0.5">{lead.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell">
                    {safeFormat(lead.created_at, "MMM d, HH:mm")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors"
                      data-testid={`button-complete-${lead.id}`}
                    >
                      Complete Callback →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
              <label className="text-sm font-medium text-[rgb(52,64,84)]">Internal Notes</label>
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
            <Button onClick={handleMarkComplete} disabled={markCompleteMutation.isPending} data-testid="button-confirm-complete">
              {markCompleteMutation.isPending ? "Saving…" : "Save & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
