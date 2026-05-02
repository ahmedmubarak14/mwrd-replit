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
  useListHeldQuotes, 
  useAdminApproveHeldQuote, 
  getListHeldQuotesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function QuotesReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [marginPercent, setMarginPercent] = useState<number>(10);
  
  const { data: quotes, isLoading } = useListHeldQuotes();
  const approveMutation = useAdminApproveHeldQuote();

  const handleApprove = () => {
    if (!selectedQuote) return;

    approveMutation.mutate({ 
      quoteId: selectedQuote.id, 
      data: { margin_pct: marginPercent } 
    }, {
      onSuccess: () => {
        toast({ title: "Quote approved and released" });
        queryClient.invalidateQueries({ queryKey: getListHeldQuotesQueryKey() });
        setSelectedQuote(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Held Quotes</h1>
        <p className="text-muted-foreground">Review quotes that exceed auto-approval thresholds.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Supplier ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              quotes?.data.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">#{quote.quote_number}</TableCell>
                  <TableCell>{quote.supplier_company_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedQuote(quote)}
                      data-testid={`button-review-${quote.id}`}
                    >
                      Approve with Margin
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && quotes?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No held quotes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
              <label className="text-sm font-medium">Applied Margin (%)</label>
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
            <Button 
              onClick={handleApprove} 
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Processing..." : "Release Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
