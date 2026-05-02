import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useListHeldQuotes,
  useAdminApproveHeldQuote,
  getListHeldQuotesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "@untitledui/icons";
import { format } from "date-fns";

export default function QuotesReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [marginPercent, setMarginPercent] = useState<number>(10);

  const { data: quotes, isLoading } = useListHeldQuotes();
  const approveMutation = useAdminApproveHeldQuote();

  const rows = quotes ?? [];

  const handleApprove = () => {
    if (!selectedQuote) return;
    approveMutation.mutate({ id: selectedQuote.id, data: { margin_pct: marginPercent } }, {
      onSuccess: () => {
        toast({ title: "Quote approved and released" });
        queryClient.invalidateQueries({ queryKey: getListHeldQuotesQueryKey() });
        setSelectedQuote(null);
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Held Quotes</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Review quotes that exceed auto-approval thresholds</p>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No held quotes — all quotes are within auto-approval thresholds.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Quote #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Submitted</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((quote) => (
                <tr key={quote.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">#{quote.quote_number}</td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell">{quote.supplier_company_id}</td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell">
                    {quote.submitted_at ? format(new Date(quote.submitted_at), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(255,249,235)] text-[rgb(181,71,8)] border-[rgb(254,223,137)]">
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors"
                      data-testid={`button-review-${quote.id}`}
                    >
                      Set Margin →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!selectedQuote} onOpenChange={(open) => !open && setSelectedQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Held Quote</DialogTitle>
            <DialogDescription>
              Set the final margin for Quote #{selectedQuote?.quote_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[rgb(52,64,84)]">Applied Margin (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(parseFloat(e.target.value))}
                data-testid="input-margin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuote(null)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending} data-testid="button-confirm-approve">
              {approveMutation.isPending ? "Processing…" : "Release Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
