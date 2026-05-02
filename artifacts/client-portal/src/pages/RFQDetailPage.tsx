import { useRoute } from "wouter";
import { 
  useGetRFQ, 
  getGetRFQQueryKey,
  useListQuotesForRFQ,
  getListQuotesForRFQQueryKey,
  useAwardFullBasket,
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, AlertCircle } from "@untitledui/icons";

export default function RFQDetailPage() {
  const [, params] = useRoute("/rfqs/:id");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfq, isLoading: rfqLoading } = useGetRFQ(id!, {
    query: {
      enabled: !!id,
      queryKey: getGetRFQQueryKey(id!),
    }
  });

  const { data: quotesData, isLoading: quotesLoading } = useListQuotesForRFQ(id!, {
    query: {
      enabled: !!id,
      queryKey: getListQuotesForRFQQueryKey(id!),
    }
  });

  const awardFullBasket = useAwardFullBasket();

  const handleAwardFull = (quoteId: string) => {
    awardFullBasket.mutate({ id: id!, data: { quote_id: quoteId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRFQQueryKey(id!) });
        toast({ title: "RFQ Awarded", description: "The full basket has been awarded to the supplier." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Award failed", description: error.message });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'awarded': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (rfqLoading) return <Skeleton className="h-64 w-full" />;
  if (!rfq) return <div className="p-8 text-center">RFQ not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{rfq.title}</h1>
            <Badge variant="outline" className={getStatusColor(rfq.status)}>
              {rfq.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">RFQ #{rfq.id.slice(0, 8)} • Created {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "N/A"}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Requested Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.master_product_id}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">City</p>
              <p className="font-medium">{rfq.delivery_city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Date</p>
              <p className="font-medium">{rfq.delivery_date ? new Date(rfq.delivery_date).toLocaleDateString() : "Not specified"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Suppliers Quotes</h2>
        {quotesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quotesData?.data?.map((quote) => (
              <Card key={quote.id} className="flex flex-col" data-testid={`card-quote-${quote.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Quote #{quote.quote_number}</CardTitle>
                      <CardDescription>Submitted {quote.submitted_at ? new Date(quote.submitted_at).toLocaleDateString() : "N/A"}</CardDescription>
                    </div>
                    <Badge variant={quote.status === 'awarded' ? 'default' : 'secondary'}>
                      {quote.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {/* Total amount might need calculation if not in schema directly */}
                  <div className="text-2xl font-bold text-primary">
                    Quote Price
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {quote.items?.length || 0} items quoted
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => handleAwardFull(quote.id)}
                    disabled={rfq.status !== 'open' || awardFullBasket.isPending}
                    data-testid={`button-award-quote-${quote.id}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Award Full Basket
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {(!quotesData?.data || quotesData.data.length === 0) && (
              <div className="col-span-full py-12 flex flex-col items-center text-muted-foreground bg-muted/20 border rounded-lg">
                <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                <p>No quotes received yet from suppliers.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
