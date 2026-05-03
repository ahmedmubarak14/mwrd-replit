import { useMemo } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetRFQ,
  getGetRFQQueryKey,
  useListQuotesForRFQ,
  getListQuotesForRFQQueryKey,
  useListMasterProducts,
  useAwardFullBasket,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, Clock, Package, Calendar } from "@untitledui/icons";

function formatSAR(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(n);
}

export default function RFQDetailPage() {
  const [, params] = useRoute("/rfqs/:id");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfq, isLoading: rfqLoading } = useGetRFQ(id!, {
    query: { enabled: !!id, queryKey: getGetRFQQueryKey(id!) },
  });

  const { data: quotesData, isLoading: quotesLoading } = useListQuotesForRFQ(id!, {
    query: { enabled: !!id, queryKey: getListQuotesForRFQQueryKey(id!) },
  });

  const { data: productsData } = useListMasterProducts();

  const productMap = useMemo(() => {
    const m = new Map<string, { name_en: string; default_unit?: string }>();
    for (const p of productsData?.data ?? []) m.set(p.id, { name_en: p.name_en, default_unit: p.default_unit });
    return m;
  }, [productsData]);

  const awardFullBasket = useAwardFullBasket();

  const handleAwardFull = (quoteId: string) => {
    awardFullBasket.mutate(
      { id: id!, data: { quote_id: quoteId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRFQQueryKey(id!) });
          queryClient.invalidateQueries({ queryKey: getListQuotesForRFQQueryKey(id!) });
          toast({ title: "RFQ Awarded", description: "The full basket has been awarded to the supplier." });
        },
        onError: (error: any) =>
          toast({ variant: "destructive", title: "Award failed", description: error.message }),
      },
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]";
      case "quoted":
        return "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]";
      case "awarded":
      case "partially_awarded":
        return "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]";
      case "cancelled":
        return "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]";
      default:
        return "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]";
    }
  };

  if (rfqLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!rfq) return <div className="p-8 text-center text-sm text-[rgb(102,112,133)]">RFQ not found.</div>;

  const acceptedExists = quotesData?.some((q) => q.status === "accepted" || q.status === "partially_accepted");
  const canAward = (rfq.status === "open" || rfq.status === "quoted") && !acceptedExists;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">RFQ #{rfq.rfq_number}</p>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-semibold tracking-tight text-[rgb(16,24,40)]">{rfq.title}</h1>
            <Badge variant="outline" className={getStatusColor(rfq.status)}>
              {rfq.status?.replace(/_/g, " ")}
            </Badge>
            {rfq.source && (
              <Badge variant="outline" className="bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)] capitalize">
                {rfq.source.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-[rgb(102,112,133)]">
            Created {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : "—"}
            {rfq.expires_at && ` · expires ${new Date(rfq.expires_at).toLocaleDateString()}`}
          </p>
        </div>
        {(quotesData?.length ?? 0) > 1 && (
          <Link href={`/rfqs/${rfq.id}/compare`}>
            <Button data-testid="button-open-compare">
              Compare quotes ({quotesData?.length})
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Requested Items</CardTitle>
            {rfq.description && (
              <CardDescription className="whitespace-pre-wrap">{rfq.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="hidden md:table-cell">Pack</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.items?.map((item) => {
                  const product = item.master_product_id ? productMap.get(item.master_product_id) : undefined;
                  const productLabel = product?.name_en ?? item.free_text_name ?? item.master_product_id ?? "Custom item";
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{productLabel}</TableCell>
                      <TableCell className="hidden sm:table-cell text-[rgb(102,112,133)]">{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.qty} {product?.default_unit ?? item.unit}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-[rgb(102,112,133)]">
                        {item.pack_type ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-[rgb(102,112,133)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[rgb(102,112,133)]">City</p>
                <p className="font-medium text-[rgb(16,24,40)]">{rfq.delivery_city ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-[rgb(102,112,133)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[rgb(102,112,133)]">Target date</p>
                <p className="font-medium text-[rgb(16,24,40)]">
                  {rfq.delivery_date ? new Date(rfq.delivery_date).toLocaleDateString() : "Not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[rgb(16,24,40)]">
          Supplier Quotes {quotesData?.length ? `(${quotesData.length})` : ""}
        </h2>
        {quotesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
          </div>
        ) : (quotesData?.length ?? 0) === 0 ? (
          <div className="py-12 flex flex-col items-center text-[rgb(102,112,133)] bg-[rgb(249,250,251)] border border-[rgb(228,231,236)] rounded-xl">
            <AlertCircle className="h-10 w-10 mb-3 text-[rgb(208,213,221)]" />
            <p className="text-sm">No quotes received yet from suppliers.</p>
            <p className="mt-1 text-xs">We'll notify you the moment one comes in.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quotesData?.map((quote) => {
              const liveLines = (quote.items ?? []).filter((i) => !i.declined);
              const total = liveLines.reduce((sum, i) => sum + (i.final_unit_price_sar ?? 0) * (i.qty_available ?? 0), 0);
              const declinedCount = (quote.items ?? []).length - liveLines.length;
              const isAwarded = quote.status === "accepted" || quote.status === "partially_accepted";
              return (
                <Card key={quote.id} className="flex flex-col" data-testid={`card-quote-${quote.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{quote.supplier_alias ?? "Supplier"}</CardTitle>
                        <CardDescription className="text-xs">
                          Quote #{quote.quote_number} · submitted{" "}
                          {quote.submitted_at ? new Date(quote.submitted_at).toLocaleDateString() : "—"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={isAwarded ? getStatusColor("awarded") : getStatusColor(quote.status)}
                      >
                        {quote.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs text-[rgb(102,112,133)]">Quote total</p>
                      <p className="text-2xl font-semibold text-[rgb(16,24,40)]">{formatSAR(total)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[rgb(102,112,133)] flex-wrap">
                      <span>
                        {liveLines.length} line{liveLines.length === 1 ? "" : "s"}
                        {declinedCount > 0 && (
                          <span className="ml-1 text-[rgb(180,35,24)]">· {declinedCount} declined</span>
                        )}
                      </span>
                      {quote.lead_time_days != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {quote.lead_time_days}d lead
                        </span>
                      )}
                      {quote.valid_until && (
                        <span>valid to {new Date(quote.valid_until).toLocaleDateString()}</span>
                      )}
                    </div>
                    {quote.notes && (
                      <p className="text-xs text-[rgb(102,112,133)] whitespace-pre-wrap line-clamp-3">
                        {quote.notes}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleAwardFull(quote.id)}
                      disabled={!canAward || awardFullBasket.isPending}
                      data-testid={`button-award-quote-${quote.id}`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isAwarded ? "Awarded" : "Award Full Basket"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
