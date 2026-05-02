import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetQuote, useEditQuote, useSendQuote, getGetQuoteQueryKey, getListMyQuotesQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: quote, isLoading: quoteLoading } = useGetQuote(id!);
  
  const editQuoteMutation = useEditQuote();
  const sendQuoteMutation = useSendQuote();
  
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (quote && quote.items) {
      const initialPrices: Record<string, number> = {};
      quote.items.forEach(item => {
        initialPrices[item.id] = item.supplier_unit_price_sar || 0;
      });
      setPrices(initialPrices);
    }
  }, [quote]);

  const handlePriceChange = (itemId: string, price: string) => {
    setPrices(prev => ({ ...prev, [itemId]: parseFloat(price) || 0 }));
  };

  const handleSaveDraft = () => {
    if (!quote) return;
    
    const items = quote.items?.map(item => ({
      id: item.id,
      supplier_unit_price_sar: prices[item.id] || 0,
    })) || [];

    editQuoteMutation.mutate(
      { id: quote.id, data: { items } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetQuoteQueryKey(id!) });
          toast({ title: "Draft Saved", description: "Your quote draft has been updated." });
        }
      }
    );
  };

  const handleSendQuote = () => {
    if (!quote) return;
    
    sendQuoteMutation.mutate(
      { id: quote.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetQuoteQueryKey(id!) });
          queryClient.invalidateQueries({ queryKey: getListMyQuotesQueryKey() });
          toast({ title: "Quote Sent", description: "Your quote has been submitted successfully." });
          setLocation("/quotes");
        }
      }
    );
  };

  if (quoteLoading) return <DashboardLayout><Skeleton className="h-10 w-1/3 mb-8" /><Skeleton className="h-64 w-full" /></DashboardLayout>;
  if (!quote) return <DashboardLayout>Quote not found</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quote Details</h1>
          <p className="text-muted-foreground">Quote #: {quote.quote_number}</p>
        </div>
        <div className="flex gap-2">
          {quote.status === "draft" && (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={editQuoteMutation.isPending}>
                Save Draft
              </Button>
              <Button onClick={handleSendQuote} disabled={sendQuoteMutation.isPending}>
                Send Quote
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Quote Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price (SAR)</TableHead>
                  <TableHead>Total (SAR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.id}</div>
                    </TableCell>
                    <TableCell>{item.qty_available}</TableCell>
                    <TableCell>
                      {quote.status === "draft" ? (
                        <Input
                          type="number"
                          className="w-32"
                          value={prices[item.id] || ""}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          data-testid={`input-price-${item.id}`}
                        />
                      ) : (
                        `$${item.supplier_unit_price_sar?.toLocaleString() || "0.00"}`
                      )}
                    </TableCell>
                    <TableCell>${((prices[item.id] || item.supplier_unit_price_sar || 0) * item.qty_available).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge 
                className={cn(
                  quote.status === "draft" && "bg-gray-100 text-gray-800",
                  quote.status === "submitted" && "bg-blue-100 text-blue-800",
                  quote.status === "accepted" && "bg-green-100 text-green-800",
                  quote.status === "rejected" && "bg-red-100 text-red-800"
                )}
              >
                {quote.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">RFQ ID</p>
              <p>{quote.rfq_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted At</p>
              <p>{quote.submitted_at ? format(new Date(quote.submitted_at), "MMM d, yyyy HH:mm") : 'Not submitted'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
              <p>{quote.valid_until ? format(new Date(quote.valid_until), "MMM d, yyyy") : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
