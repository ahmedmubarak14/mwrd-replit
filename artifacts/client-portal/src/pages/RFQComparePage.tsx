import { useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetRFQ,
  getGetRFQQueryKey,
  useListQuotesForRFQ,
  getListQuotesForRFQQueryKey,
  useAwardPerLine,
  useAwardFullBasket,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertCircle } from "@untitledui/icons";
import type { Quote, QuoteItem, RFQItem } from "@workspace/api-client-react";

type SortKey = "price" | "lead_time" | "best_value";
type QuoteWithAlias = Quote & { supplier_alias?: string };

const formatSar = (n: number) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(n);

export default function RFQComparePage() {
  const [, params] = useRoute("/rfqs/:id/compare");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfq, isLoading: rfqLoading } = useGetRFQ(id!, {
    query: { enabled: !!id, queryKey: getGetRFQQueryKey(id!) },
  });
  const { data: quotes, isLoading: quotesLoading } = useListQuotesForRFQ(id!, {
    query: { enabled: !!id, queryKey: getListQuotesForRFQQueryKey(id!) },
  });

  // selections: rfq_item_id -> { quote_id, quote_item_id }
  const [selections, setSelections] = useState<
    Record<string, { quote_id: string; quote_item_id: string }>
  >({});
  const [sort, setSort] = useState<SortKey>("price");
  const [filterByDate, setFilterByDate] = useState(false);

  const awardPerLine = useAwardPerLine();
  const awardFullBasket = useAwardFullBasket();

  const deliveryDate = rfq?.delivery_date ? new Date(rfq.delivery_date) : null;

  // Sorted columns of suppliers (one column per quote)
  const sortedQuotes = useMemo<QuoteWithAlias[]>(() => {
    const list = (quotes ?? []) as QuoteWithAlias[];
    const filtered = filterByDate && deliveryDate
      ? list.filter((q) =>
          (q.items ?? []).some((i: QuoteItem) => leadDays(i) !== null && withinDelivery(leadDays(i)!, deliveryDate)),
        )
      : list;
    const score = (q: QuoteWithAlias) => {
      const qItems = q.items ?? [];
      const total = qItems.reduce((s: number, i: QuoteItem) => s + (i.final_unit_price_sar ?? 0) * (i.qty_available ?? 0), 0);
      const avgLead = qItems.length
        ? qItems.reduce((s: number, i: QuoteItem) => s + (leadDays(i) ?? 0), 0) / qItems.length
        : 0;
      if (sort === "price") return total;
      if (sort === "lead_time") return avgLead;
      return total + avgLead * 100;
    };
    return [...filtered].sort((a, b) => score(a) - score(b));
  }, [quotes, sort, filterByDate, deliveryDate]);

  const items: RFQItem[] = rfq?.items ?? [];

  // Per-supplier subtotal of selected lines
  const totalsBySupplier = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [, sel] of Object.entries(selections)) {
      const q = quotes?.find((x: Quote) => x.id === sel.quote_id);
      const qi = q?.items?.find((x: QuoteItem) => x.id === sel.quote_item_id);
      const rfqItem = items.find((it: RFQItem) => it.id === qi?.rfq_item_id);
      if (!q || !qi || !rfqItem) continue;
      const lineTotal = (qi.final_unit_price_sar ?? 0) * (rfqItem.qty ?? qi.qty_available ?? 0);
      totals[q.id] = (totals[q.id] ?? 0) + lineTotal;
    }
    return totals;
  }, [selections, quotes, items]);

  const grandTotal = Object.values(totalsBySupplier).reduce((s, n) => s + n, 0);
  const selectedCount = Object.keys(selections).length;
  const allItemsSelected = items.length > 0 && selectedCount === items.length;

  const toggleSelect = (rfqItemId: string, quoteId: string, quoteItemId: string) => {
    setSelections((prev) => {
      const cur = prev[rfqItemId];
      const next = { ...prev };
      if (cur && cur.quote_id === quoteId && cur.quote_item_id === quoteItemId) {
        delete next[rfqItemId];
      } else {
        next[rfqItemId] = { quote_id: quoteId, quote_item_id: quoteItemId };
      }
      return next;
    });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetRFQQueryKey(id!) });
    queryClient.invalidateQueries({ queryKey: getListQuotesForRFQQueryKey(id!) });
  };

  const handleConfirmSplit = () => {
    if (!allItemsSelected) {
      toast({ variant: "destructive", title: "Select every item", description: "Pick a supplier for each line before confirming a split award." });
      return;
    }
    const sels = Object.values(selections);
    awardPerLine.mutate(
      { id: id!, data: { selections: sels } },
      {
        onSuccess: () => {
          refresh();
          toast({ title: "Split award confirmed", description: `${sels.length} line(s) awarded across ${Object.keys(totalsBySupplier).length} supplier(s).` });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Award failed", description: err.message }),
      },
    );
  };

  const handleAwardFull = (quoteId: string) => {
    awardFullBasket.mutate(
      { id: id!, data: { quote_id: quoteId } },
      {
        onSuccess: () => {
          refresh();
          toast({ title: "Awarded to single supplier" });
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Award failed", description: err.message }),
      },
    );
  };

  if (rfqLoading || quotesLoading) return <Skeleton className="h-[40vh] w-full" />;
  if (!rfq) return <div className="p-8 text-center">RFQ not found.</div>;

  const canAward = rfq.status === "open" || rfq.status === "quoted";

  if ((quotes ?? []).length === 0) {
    return (
      <div className="space-y-6">
        <CompareHeader rfqId={rfq.id} title={rfq.title} status={rfq.status} />
        <div className="py-16 flex flex-col items-center text-muted-foreground bg-muted/20 border rounded-lg">
          <AlertCircle className="h-10 w-10 mb-2 opacity-30" />
          <p>No quotes received yet. Suppliers are still preparing their offers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <CompareHeader rfqId={rfq.id} title={rfq.title} status={rfq.status} />

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sort by</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)} placeholder="Sort">
              <SelectItem value="price">Price low to high</SelectItem>
              <SelectItem value="lead_time">Lead time short to long</SelectItem>
              <SelectItem value="best_value">Best value</SelectItem>
            </Select>
          </div>
          {deliveryDate && (
            <div className="flex items-center gap-2">
              <Switch
                id="filter-delivery"
                checked={filterByDate}
                onCheckedChange={setFilterByDate}
                data-testid="switch-filter-delivery"
              />
              <Label htmlFor="filter-delivery" className="text-sm">
                Only suppliers who can deliver by {deliveryDate.toLocaleDateString()}
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line-item comparison</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30 text-sm">
                <th className="p-3 text-left font-medium border-b sticky left-0 bg-muted/30 z-10 min-w-[240px]">
                  Item
                </th>
                {sortedQuotes.map((q) => (
                  <th key={q.id} className="p-3 text-left font-medium border-b min-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold" data-testid={`th-supplier-${q.id}`}>
                        {q.supplier_alias ?? `Supplier ${q.supplier_company_id?.slice(0, 4)}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Quote #{q.quote_number}
                      </span>
                      {canAward && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs mt-1 w-fit"
                          onClick={() => handleAwardFull(q.id)}
                          disabled={awardFullBasket.isPending}
                          data-testid={`button-award-full-${q.id}`}
                        >
                          Award full basket
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: RFQItem) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3 align-top sticky left-0 bg-background z-10">
                    <div className="font-medium">{item.description ?? item.free_text_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty {item.qty} {item.pack_type ? `· ${item.pack_type}` : ""}
                    </div>
                  </td>
                  {sortedQuotes.map((q) => {
                    const qi = q.items?.find((x: QuoteItem) => x.rfq_item_id === item.id);
                    if (!qi || qi.declined) {
                      return (
                        <td key={q.id} className="p-3 align-top text-muted-foreground text-sm">
                          —
                        </td>
                      );
                    }
                    const lead = leadDays(qi);
                    const meets = deliveryDate && lead !== null ? withinDelivery(lead, deliveryDate) : null;
                    const sel = selections[item.id];
                    const isSelected = sel?.quote_id === q.id && sel?.quote_item_id === qi.id;
                    return (
                      <td key={q.id} className="p-3 align-top">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(item.id, q.id, qi.id)}
                            disabled={!canAward}
                            data-testid={`checkbox-cell-${item.id}-${q.id}`}
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{formatSar((qi.final_unit_price_sar ?? 0) * (item.qty ?? 0))}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatSar(qi.final_unit_price_sar ?? 0)} per unit
                            </div>
                            {lead !== null && (
                              <Badge
                                variant="outline"
                                className={`mt-1 text-xs ${
                                  meets === true
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : meets === false
                                      ? "bg-red-500/10 text-red-700 border-red-500/20"
                                      : ""
                                }`}
                              >
                                {lead}d lead
                              </Badge>
                            )}
                          </div>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Sticky footer */}
      {canAward && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20">
          <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Selected </span>
                <span className="font-semibold">{selectedCount}/{items.length}</span>
                <span className="text-muted-foreground"> lines</span>
              </div>
              <div>
                <span className="text-muted-foreground">Across </span>
                <span className="font-semibold">{Object.keys(totalsBySupplier).length}</span>
                <span className="text-muted-foreground"> supplier(s)</span>
              </div>
              <div className="text-base">
                <span className="text-muted-foreground">Grand total </span>
                <span className="font-bold">{formatSar(grandTotal)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelections({})}
                disabled={selectedCount === 0}
                data-testid="button-clear-selections"
              >
                Clear
              </Button>
              <Button
                onClick={handleConfirmSplit}
                disabled={!allItemsSelected || awardPerLine.isPending}
                data-testid="button-confirm-split-award"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm split award · creates {Object.keys(totalsBySupplier).length} CPO(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareHeader({ rfqId, title, status }: { rfqId: string; title: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href={`/rfqs/${rfqId}`}>
          <Button variant="ghost" size="sm" data-testid="button-back-to-rfq">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to RFQ
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Compare quotes</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
      <Badge variant="outline">{status}</Badge>
    </div>
  );
}

function leadDays(qi: { lead_time_days?: number | null }): number | null {
  return typeof qi.lead_time_days === "number" ? qi.lead_time_days : null;
}

function withinDelivery(leadDays: number, deliveryDate: Date): boolean {
  const eta = new Date();
  eta.setDate(eta.getDate() + leadDays);
  return eta.getTime() <= deliveryDate.getTime();
}
