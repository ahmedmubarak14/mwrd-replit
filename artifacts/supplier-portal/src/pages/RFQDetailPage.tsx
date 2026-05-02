import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetRFQ, useListMyQuotes, useEditQuote, useSendQuote, getListMyQuotesQueryKey } from "@workspace/api-client-react";
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

export default function RFQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: rfq, isLoading: rfqLoading } = useGetRFQ(id!);
  const { data: quotesData, isLoading: quotesLoading } = useListMyQuotes();
  
  const myQuote = quotesData?.data?.find(q => q.rfq_id === id);
  const isDraft = myQuote?.status === "draft" || myQuote?.status === "draft_auto" || myQuote?.status === "draft_manual";
  
  const editQuoteMutation = useEditQuote();
  const sendQuoteMutation = useSendQuote();
  
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (myQuote && myQuote.items) {
      const initialPrices: Record<string, number> = {};
      myQuote.items.forEach(item => {
        initialPrices[item.id] = item.supplier_unit_price_sar || 0;
      });
      setPrices(initialPrices);
    }
  }, [myQuote]);

  const handlePriceChange = (itemId: string, price: string) => {
    setPrices(prev => ({ ...prev, [itemId]: parseFloat(price) || 0 }));
  };

  const handleSaveDraft = () => {
    if (!myQuote) return;
    
    const items = myQuote.items?.map(item => ({
      id: item.id,
      supplier_unit_price_sar: prices[item.id] || item.supplier_unit_price_sar,
    })) || [];

    editQuoteMutation.mutate(
      { id: myQuote.id, data: { items } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyQuotesQueryKey() });
          toast({ title: "Draft Saved", description: "Your quote draft has been updated." });
        }
      }
    );
  };

  const handleSendQuote = () => {
    if (!myQuote) return;
    
    sendQuoteMutation.mutate(
      { id: myQuote.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyQuotesQueryKey() });
          toast({ title: "Quote Sent", description: "Your quote has been submitted successfully." });
          setLocation("/quotes");
        }
      }
    );
  };

  if (rfqLoading) return <DashboardLayout><Skeleton className="h-10 w-1/3 mb-8" /><Skeleton className="h-64 w-full" /></DashboardLayout>;
  if (!rfq) return <DashboardLayout>RFQ not found</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{rfq.title}</h1>
          <p className="text-muted-foreground">RFQ #: {rfq.rfq_number}</p>
        </div>
        <div className="flex gap-2 items-center">
          {!quotesLoading && !myQuote && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              Not assigned to you yet
            </Badge>
          )}
          {myQuote && !isDraft && (
            <Badge variant="outline" className="capitalize bg-blue-50 text-blue-800 border-blue-200">
              Quote {myQuote.status?.replace(/_/g, " ")}
            </Badge>
          )}
          {isDraft && (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={editQuoteMutation.isPending} data-testid="button-save-draft">
                {editQuoteMutation.isPending ? "Saving…" : "Save Draft"}
              </Button>
              <Button onClick={handleSendQuote} disabled={sendQuoteMutation.isPending} data-testid="button-send-quote">
                {sendQuoteMutation.isPending ? "Sending…" : "Send Quote"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>RFQ Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Your Unit Price (SAR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.items?.map((item) => {
                  const quoteItem = myQuote?.items?.find(qi => qi.rfq_item_id === item.id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.master_product_id || item.free_text_name}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </TableCell>
                      <TableCell>{item.qty} {item.unit}</TableCell>
                      <TableCell>
                        {isDraft ? (
                          <Input
                            type="number"
                            className="w-32"
                            value={prices[quoteItem?.id || ""] || ""}
                            onChange={(e) => handlePriceChange(quoteItem?.id || "", e.target.value)}
                            data-testid={`input-price-${item.id}`}
                          />
                        ) : (
                          `$${quoteItem?.supplier_unit_price_sar || "0.00"}`
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {myQuote && (
          <Card>
            <CardHeader>
              <CardTitle>Quote Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge 
                  className={cn(
                    myQuote.status === "draft" && "bg-gray-100 text-gray-800",
                    myQuote.status === "submitted" && "bg-blue-100 text-blue-800",
                    myQuote.status === "accepted" && "bg-green-100 text-green-800",
                    myQuote.status === "rejected" && "bg-red-100 text-red-800"
                  )}
                >
                  {myQuote.status}
                </Badge>
                {myQuote.submitted_at && (
                  <p className="text-sm text-muted-foreground">
                    Submitted: {format(new Date(myQuote.submitted_at), "MMM d, yyyy HH:mm")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
