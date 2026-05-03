import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetRFQ,
  useListMyQuotes,
  useEditQuote,
  useSendQuote,
  useListMasterProducts,
  getListMyQuotesQueryKey,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Per-line draft state. Mirrors the EditQuoteBody item shape.
type LineDraft = {
  quote_item_id: string;
  supplier_unit_price_sar: number;
  qty_available: number;
  notes: string;
  declined: boolean;
};

const inputCls =
  "block w-full rounded-md border border-[rgb(228,231,236)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)] disabled:bg-[rgb(249,250,251)] disabled:text-[rgb(152,162,179)]";

export default function RFQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rfq, isLoading: rfqLoading } = useGetRFQ(id!);
  const { data: quotesData, isLoading: quotesLoading } = useListMyQuotes();
  const { data: productsData } = useListMasterProducts();

  const productMap = useMemo(() => {
    const m = new Map<string, { name_en: string; default_unit?: string }>();
    for (const p of productsData?.data ?? []) m.set(p.id, { name_en: p.name_en, default_unit: p.default_unit });
    return m;
  }, [productsData]);

  const myQuote = quotesData?.data?.find((q) => q.rfq_id === id);
  const isDraft =
    myQuote?.status === "draft" || myQuote?.status === "draft_auto" || myQuote?.status === "draft_manual";

  const editQuoteMutation = useEditQuote();
  const sendQuoteMutation = useSendQuote();

  const [lines, setLines] = useState<Record<string, LineDraft>>({});
  const [quoteNotes, setQuoteNotes] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);

  // Initial sync from server. Keyed by rfq_item_id so the table can
  // join RFQ items to their corresponding quote line cleanly.
  useEffect(() => {
    if (!myQuote?.items) return;
    const seed: Record<string, LineDraft> = {};
    for (const item of myQuote.items) {
      seed[item.rfq_item_id] = {
        quote_item_id: item.id,
        supplier_unit_price_sar: item.supplier_unit_price_sar ?? 0,
        qty_available: item.qty_available ?? 0,
        notes: item.notes ?? "",
        declined: item.declined ?? false,
      };
    }
    setLines(seed);
    setQuoteNotes(myQuote.notes ?? "");
    setLeadTimeDays(myQuote.lead_time_days ?? 7);
  }, [myQuote]);

  const updateLine = (rfqItemId: string, patch: Partial<LineDraft>) => {
    setLines((prev) => ({ ...prev, [rfqItemId]: { ...prev[rfqItemId], ...patch } }));
  };

  const subtotal = useMemo(() => {
    return Object.values(lines).reduce((sum, l) => {
      if (l.declined) return sum;
      return sum + l.supplier_unit_price_sar * l.qty_available;
    }, 0);
  }, [lines]);

  const declinedCount = Object.values(lines).filter((l) => l.declined).length;

  const buildPatch = () => ({
    notes: quoteNotes,
    lead_time_days: leadTimeDays,
    items: Object.values(lines).map((l) => ({
      id: l.quote_item_id,
      supplier_unit_price_sar: l.supplier_unit_price_sar,
      qty_available: l.qty_available,
      notes: l.notes,
      declined: l.declined,
    })),
  });

  const handleSaveDraft = () => {
    if (!myQuote) return;
    editQuoteMutation.mutate(
      { id: myQuote.id, data: buildPatch() },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyQuotesQueryKey() });
          toast({ title: "Draft saved", description: "Your quote draft has been updated." });
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not save draft", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleSendQuote = () => {
    if (!myQuote) return;
    // Save first so the latest line edits are persisted before submission.
    editQuoteMutation.mutate(
      { id: myQuote.id, data: buildPatch() },
      {
        onSuccess: () => {
          sendQuoteMutation.mutate(
            { id: myQuote.id },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMyQuotesQueryKey() });
                toast({ title: "Quote sent", description: "Your quote was submitted to the client." });
                setLocation("/quotes");
              },
              onError: (err: any) =>
                toast({ variant: "destructive", title: "Could not send quote", description: err?.message ?? "Please try again." }),
            },
          );
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not save before send", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (rfqLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }
  if (!rfq) {
    return <DashboardLayout><p className="text-sm text-[rgb(102,112,133)]">RFQ not found.</p></DashboardLayout>;
  }

  const respondingLines = Object.values(lines).filter((l) => !l.declined).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">RFQ #{rfq.rfq_number}</p>
            <h1 className="mt-1 text-xl font-semibold text-[rgb(16,24,40)]">{rfq.title}</h1>
            <p className="mt-1 text-sm text-[rgb(102,112,133)]">
              {rfq.delivery_city ? `Deliver to ${rfq.delivery_city}` : "Delivery TBC"}
              {rfq.delivery_date ? ` · needed by ${format(new Date(rfq.delivery_date), "MMM d, yyyy")}` : ""}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {!quotesLoading && !myQuote && (
              <Badge variant="outline" className="bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]">
                Not assigned to you yet
              </Badge>
            )}
            {myQuote && !isDraft && (
              <Badge variant="outline" className="capitalize bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]">
                {myQuote.status?.replace(/_/g, " ")}
              </Badge>
            )}
            {isDraft && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={editQuoteMutation.isPending}
                  data-testid="button-save-draft"
                >
                  {editQuoteMutation.isPending ? "Saving…" : "Save Draft"}
                </Button>
                <Button
                  onClick={handleSendQuote}
                  disabled={sendQuoteMutation.isPending || editQuoteMutation.isPending || respondingLines === 0}
                  data-testid="button-send-quote"
                >
                  {sendQuoteMutation.isPending ? "Sending…" : "Send Quote"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quote-level controls */}
        {myQuote && (
          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Lead time (days)</label>
              <input
                type="number"
                min={1}
                disabled={!isDraft}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value || "0", 10))}
                className={inputCls}
                data-testid="input-lead-time"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Quote notes (optional)</label>
              <input
                type="text"
                disabled={!isDraft}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Anything the client should know about this quote"
                className={inputCls}
                data-testid="input-quote-notes"
              />
            </div>
          </div>
        )}

        {/* Two-column line builder */}
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)] text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">
            <div className="col-span-12 md:col-span-5">Client request</div>
            <div className="col-span-12 md:col-span-7 md:border-l md:border-[rgb(228,231,236)] md:pl-5">Your response</div>
          </div>
          <ul className="divide-y divide-[rgb(242,244,247)]">
            {(rfq.items ?? []).map((rfqItem) => {
              const draft = lines[rfqItem.id];
              const product = rfqItem.master_product_id ? productMap.get(rfqItem.master_product_id) : undefined;
              const productLabel =
                product?.name_en ?? rfqItem.free_text_name ?? rfqItem.master_product_id ?? "Custom item";
              const lineTotal = draft && !draft.declined ? draft.supplier_unit_price_sar * draft.qty_available : 0;

              return (
                <li key={rfqItem.id} className="grid grid-cols-12 px-5 py-4 gap-y-3" data-testid={`line-${rfqItem.id}`}>
                  {/* LEFT: client request */}
                  <div className="col-span-12 md:col-span-5 md:pr-5">
                    <p className="text-sm font-semibold text-[rgb(16,24,40)]">{productLabel}</p>
                    {rfqItem.description && (
                      <p className="mt-1 text-xs text-[rgb(102,112,133)] whitespace-pre-wrap">{rfqItem.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[rgb(52,64,84)]">
                      <span>
                        <span className="text-[rgb(102,112,133)]">Qty:</span>{" "}
                        <span className="font-medium">{rfqItem.qty}</span> {product?.default_unit ?? rfqItem.unit}
                      </span>
                      {rfqItem.pack_type && (
                        <span>
                          <span className="text-[rgb(102,112,133)]">Pack:</span>{" "}
                          <span className="font-medium">{rfqItem.pack_type}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: supplier response */}
                  <div className="col-span-12 md:col-span-7 md:border-l md:border-[rgb(228,231,236)] md:pl-5">
                    {!draft ? (
                      <p className="text-xs italic text-[rgb(152,162,179)]">No quote line for this item.</p>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1">Unit price (SAR)</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              disabled={!isDraft || draft.declined}
                              value={draft.supplier_unit_price_sar || ""}
                              onChange={(e) =>
                                updateLine(rfqItem.id, { supplier_unit_price_sar: parseFloat(e.target.value || "0") })
                              }
                              className={inputCls}
                              data-testid={`input-price-${rfqItem.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1">Qty available</label>
                            <input
                              type="number"
                              min={0}
                              disabled={!isDraft || draft.declined}
                              value={draft.qty_available || ""}
                              onChange={(e) => updateLine(rfqItem.id, { qty_available: parseInt(e.target.value || "0", 10) })}
                              className={inputCls}
                              data-testid={`input-qty-${rfqItem.id}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1">Line total</label>
                            <p className="px-2.5 py-1.5 text-sm font-medium text-[rgb(16,24,40)]">
                              {draft.declined ? "—" : `SAR ${lineTotal.toFixed(2)}`}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1">Notes (optional)</label>
                          <input
                            type="text"
                            disabled={!isDraft || draft.declined}
                            value={draft.notes}
                            onChange={(e) => updateLine(rfqItem.id, { notes: e.target.value })}
                            placeholder="Substitutions, conditions, etc."
                            className={inputCls}
                            data-testid={`input-notes-${rfqItem.id}`}
                          />
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-sm text-[rgb(52,64,84)] cursor-pointer w-fit">
                          <input
                            type="checkbox"
                            disabled={!isDraft}
                            checked={draft.declined}
                            onChange={(e) => updateLine(rfqItem.id, { declined: e.target.checked })}
                            className="h-4 w-4 rounded border-[rgb(208,213,221)] text-[rgb(180,35,24)] focus:ring-[rgb(180,35,24)]"
                            data-testid={`checkbox-decline-${rfqItem.id}`}
                          />
                          <span>Decline this line</span>
                        </label>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {(rfq.items ?? []).length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-[rgb(152,162,179)]">No items on this RFQ.</li>
            )}
          </ul>

          {/* Subtotal footer */}
          {myQuote && (
            <div className="px-5 py-4 border-t border-[rgb(228,231,236)] bg-[rgb(249,250,251)] flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-[rgb(102,112,133)]">
                {respondingLines} of {rfq.items?.length ?? 0} line{(rfq.items?.length ?? 0) === 1 ? "" : "s"} responding
                {declinedCount > 0 && (
                  <span className="ml-1 text-[rgb(180,35,24)]">· {declinedCount} declined</span>
                )}
              </p>
              <p className="text-sm">
                <span className="text-[rgb(102,112,133)]">Quote subtotal:</span>{" "}
                <span className="font-semibold text-[rgb(16,24,40)]">SAR {subtotal.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
