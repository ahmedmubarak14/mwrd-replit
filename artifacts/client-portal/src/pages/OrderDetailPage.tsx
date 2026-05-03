import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import {
  useGetOrder,
  getGetOrderQueryKey,
  useGetOrderApprovalStatus,
  getGetOrderApprovalStatusQueryKey,
  useCreateGRN,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ClipboardCheck, Truck01, File06, UserCheck01 } from "@untitledui/icons";

type Condition = "ok" | "damaged" | "short";

type LineDraft = {
  master_product_id: string;
  name_en: string;
  qty_ordered: number;
  qty_received: number;
  condition: Condition;
};

// PRD timeline: Confirmed → Awaiting Approval → Approved → In Transit →
// Delivered → Completed. Map server statuses to step indices so cancelled
// orders just render the final step in red rather than a broken timeline.
const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "awaiting_approval", label: "Awaiting Approval" },
  { key: "approved", label: "Approved" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

function statusToIndex(status: string): number {
  const i = TIMELINE_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? TIMELINE_STEPS.length - 1 : i;
}

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "ok", label: "OK" },
  { value: "damaged", label: "Damaged" },
  { value: "short", label: "Short" },
];

const inputCls =
  "block w-full rounded-md border border-[rgb(228,231,236)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]";

export default function OrderDetailPage() {
  const [, params] = useRoute("/orders/:id");
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading: orderLoading } = useGetOrder(id!, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id!) },
  });

  const { data: approval, isLoading: approvalLoading } = useGetOrderApprovalStatus(id!, {
    query: { enabled: !!id, queryKey: getGetOrderApprovalStatusQueryKey(id!) },
  });

  const createGRN = useCreateGRN();

  const [grnOpen, setGrnOpen] = useState(false);
  const [grnLines, setGrnLines] = useState<Record<string, LineDraft>>({});
  const [grnNotes, setGrnNotes] = useState("");

  const latestDN = useMemo(() => order?.delivery_notes?.[0] ?? null, [order]);
  const canReceive = order?.status === "in_transit" || order?.status === "delivered";
  const grnAlreadyFiled = order?.status === "completed" || order?.status === "delivered";

  // Reset draft each time the modal opens so we always reflect the latest order.
  useEffect(() => {
    if (!grnOpen || !order?.items) return;
    const seed: Record<string, LineDraft> = {};
    for (const item of order.items) {
      seed[item.id] = {
        master_product_id: item.master_product_id ?? "",
        name_en: item.name_en,
        qty_ordered: item.qty,
        qty_received: item.qty,
        condition: "ok",
      };
    }
    setGrnLines(seed);
    setGrnNotes("");
  }, [grnOpen, order]);

  const updateLine = (lineId: string, patch: Partial<LineDraft>) =>
    setGrnLines((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));

  const submitGRN = () => {
    if (!order || !id) return;
    if (!latestDN) {
      toast({ variant: "destructive", title: "No delivery note", description: "The supplier hasn't dispatched this order yet." });
      return;
    }
    const items = Object.values(grnLines).map((l) => ({
      master_product_id: l.master_product_id,
      name_en: l.name_en,
      qty_received: l.qty_received,
      condition: l.condition,
    }));
    createGRN.mutate(
      { id: order.id, data: { dn_id: latestDN.id, items, notes: grnNotes } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
          toast({ title: "Goods received", description: "Goods Receipt Note filed. Finance will close out the invoice." });
          setGrnOpen(false);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not file GRN", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (orderLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!order) return <div className="p-8 text-center text-sm text-[rgb(102,112,133)]">Order not found.</div>;

  const stepIdx = statusToIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[rgb(16,24,40)]">
              Order {order.po_number || order.id.slice(0, 8)}
            </h1>
            <Badge
              variant="outline"
              className={
                isCancelled
                  ? "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]"
                  : "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]"
              }
            >
              {order.status?.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[rgb(102,112,133)]">
            {order.transaction_ref && <span className="font-mono text-xs">{order.transaction_ref} · </span>}
            Issued {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="flex gap-2 items-start">
          {canReceive && !grnAlreadyFiled && (
            <Button onClick={() => setGrnOpen(true)} data-testid="button-create-grn">
              <ClipboardCheck className="mr-2 h-4 w-4" /> Receive Goods (GRN)
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (latestDN?.tracking_number) {
                toast({
                  title: `${latestDN.courier ?? "Courier"} — ${latestDN.tracking_number}`,
                  description: latestDN.expected_delivery_date
                    ? `Expected delivery: ${new Date(latestDN.expected_delivery_date).toLocaleDateString()}`
                    : "Tracking number copied to clipboard.",
                });
                if (navigator?.clipboard) navigator.clipboard.writeText(latestDN.tracking_number);
              } else {
                toast({
                  title: "No shipment yet",
                  description: "The supplier hasn't dispatched this order. We'll notify you when it ships.",
                });
              }
            }}
            data-testid="button-track-shipment"
          >
            <Truck01 className="mr-2 h-4 w-4" /> Track Shipment
          </Button>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
        <ol className="flex items-center justify-between gap-2 overflow-x-auto" data-testid="status-timeline">
          {TIMELINE_STEPS.map((step, i) => {
            const reached = !isCancelled && i <= stepIdx;
            const current = !isCancelled && i === stepIdx;
            return (
              <li key={step.key} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col items-center min-w-[70px]">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                      reached
                        ? current
                          ? "bg-[rgb(255,109,67)] border-[rgb(255,109,67)] text-white"
                          : "bg-[rgb(7,148,85)] border-[rgb(7,148,85)] text-white"
                        : "bg-white border-[rgb(228,231,236)] text-[rgb(152,162,179)]"
                    }`}
                  >
                    {reached && !current ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <p className={`mt-1.5 text-[11px] text-center ${reached ? "text-[rgb(52,64,84)] font-medium" : "text-[rgb(152,162,179)]"}`}>
                    {step.label}
                  </p>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < stepIdx && !isCancelled ? "bg-[rgb(7,148,85)]" : "bg-[rgb(228,231,236)]"}`} />
                )}
              </li>
            );
          })}
        </ol>
        {isCancelled && (
          <p className="mt-3 text-xs text-center text-[rgb(180,35,24)]">This order was cancelled.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name_en}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">SAR {item.unit_price_sar?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">SAR {item.total_sar?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-6 space-y-2 text-right border-t pt-4">
              <div className="flex justify-end gap-8 text-lg font-bold">
                <span>Total Amount</span>
                <span className="w-32 text-[rgb(255,109,67)]">SAR {order.total_sar?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck01 className="h-5 w-5" />
                Approval Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-4">
                  {approval?.tasks?.map((task, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1">
                        {task.status === "approved" ? (
                          <CheckCircle className="h-5 w-5 text-[rgb(7,148,85)]" />
                        ) : task.status === "rejected" ? (
                          <div className="h-5 w-5 rounded-full bg-[rgb(217,45,32)]" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-[rgb(228,231,236)]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Level {task.order_in_chain}</p>
                        <p className="text-xs text-[rgb(102,112,133)] capitalize">{task.status}</p>
                      </div>
                    </div>
                  ))}
                  {(!approval?.tasks || approval.tasks.length === 0) && (
                    <p className="text-sm text-[rgb(102,112,133)]">No approval chain required.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {latestDN && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck01 className="h-5 w-5" />
                  Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{latestDN.courier ?? "Courier TBC"}</p>
                {latestDN.tracking_number && (
                  <p className="text-[rgb(102,112,133)]">
                    Tracking: <span className="font-mono">{latestDN.tracking_number}</span>
                  </p>
                )}
                {latestDN.expected_delivery_date && (
                  <p className="text-[rgb(102,112,133)]">
                    ETA: {new Date(latestDN.expected_delivery_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <File06 className="h-5 w-5" />
                PO Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">Transaction Ref: {order.transaction_ref || "—"}</p>
              <p className="text-[rgb(102,112,133)]">Type: {order.type}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GRN modal */}
      <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive Goods (GRN)</DialogTitle>
            <DialogDescription>
              Confirm what arrived. Finance will reconcile this against the supplier invoice.
              {latestDN ? (
                <span className="block mt-1 text-xs">Against delivery note <span className="font-mono">{latestDN.dn_number}</span>.</span>
              ) : (
                <span className="block mt-1 text-xs text-[rgb(180,35,24)]">No delivery note yet — wait for dispatch.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-2 py-2 text-left text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Item</th>
                  <th className="px-2 py-2 text-right text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Ordered</th>
                  <th className="px-2 py-2 text-left text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide w-28">Received</th>
                  <th className="px-2 py-2 text-left text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide w-32">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {Object.entries(grnLines).map(([lineId, draft]) => {
                  const short = draft.qty_received < draft.qty_ordered;
                  return (
                    <tr key={lineId} data-testid={`grn-row-${lineId}`}>
                      <td className="px-2 py-2 font-medium text-[rgb(16,24,40)]">{draft.name_en}</td>
                      <td className="px-2 py-2 text-right text-[rgb(102,112,133)]">{draft.qty_ordered}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          max={draft.qty_ordered}
                          value={draft.qty_received}
                          onChange={(e) =>
                            updateLine(lineId, {
                              qty_received: Math.max(0, parseInt(e.target.value || "0", 10)),
                              condition: parseInt(e.target.value || "0", 10) < draft.qty_ordered ? "short" : draft.condition,
                            })
                          }
                          className={`${inputCls} ${short ? "border-[rgb(254,205,202)] bg-[rgb(254,243,242)]" : ""}`}
                          data-testid={`grn-qty-${lineId}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={draft.condition}
                          onChange={(e) => updateLine(lineId, { condition: e.target.value as Condition })}
                          className={inputCls}
                          data-testid={`grn-condition-${lineId}`}
                        >
                          {CONDITION_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Notes (optional)</label>
            <textarea
              value={grnNotes}
              onChange={(e) => setGrnNotes(e.target.value)}
              rows={2}
              placeholder="Anything finance should know about this delivery"
              className={`${inputCls} h-auto`}
              data-testid="grn-notes"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGrnOpen(false)}>Cancel</Button>
            <Button
              type="button"
              onClick={submitGRN}
              disabled={createGRN.isPending || !latestDN}
              data-testid="grn-submit"
            >
              {createGRN.isPending ? "Filing…" : "File GRN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
