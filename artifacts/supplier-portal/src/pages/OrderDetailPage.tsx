import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import {
  useGetOrder,
  useCreateDeliveryNote,
  getGetOrderQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Truck01, File06 } from "@untitledui/icons";

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "awaiting_approval", label: "Client Approval" },
  { key: "approved", label: "Approved" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

function statusToIndex(status: string): number {
  const i = TIMELINE_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? TIMELINE_STEPS.length - 1 : i;
}

type LineDraft = {
  master_product_id: string;
  name_en: string;
  qty_ordered: number;
  qty_dispatched: number;
  notes: string;
};

const inputCls =
  "block w-full rounded-md border border-[rgb(228,231,236)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(id!, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id!) },
  });

  const createDN = useCreateDeliveryNote();

  const [dnOpen, setDnOpen] = useState(false);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [dispatchDate, setDispatchDate] = useState<string>(todayISO());
  const [etaDate, setEtaDate] = useState<string>(plusDaysISO(3));
  const [lines, setLines] = useState<Record<string, LineDraft>>({});

  const existingDN = useMemo(() => order?.delivery_notes?.[0] ?? null, [order]);
  // SPO can ship from 'confirmed'; supplier can also file a follow-up DN
  // for partial dispatches before the CPO is fully delivered.
  const canDispatch =
    order?.type === "SPO" && (order.status === "confirmed" || order.status === "in_transit");
  const isCancelled = order?.status === "cancelled";

  useEffect(() => {
    if (!dnOpen || !order?.items) return;
    const seed: Record<string, LineDraft> = {};
    for (const item of order.items) {
      seed[item.id] = {
        master_product_id: item.master_product_id ?? "",
        name_en: item.name_en,
        qty_ordered: item.qty,
        qty_dispatched: item.qty,
        notes: "",
      };
    }
    setLines(seed);
    setCourier("");
    setTracking("");
    setDispatchDate(todayISO());
    setEtaDate(plusDaysISO(3));
  }, [dnOpen, order]);

  const updateLine = (lineId: string, patch: Partial<LineDraft>) =>
    setLines((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));

  const submitDN = () => {
    if (!order || !id) return;
    if (!courier.trim() || !tracking.trim()) {
      toast({ variant: "destructive", title: "Courier and tracking number are required" });
      return;
    }
    const items = Object.values(lines)
      .filter((l) => l.qty_dispatched > 0)
      .map((l) => ({
        master_product_id: l.master_product_id,
        name_en: l.name_en,
        qty_dispatched: l.qty_dispatched,
        notes: l.notes,
      }));
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Dispatch at least one item" });
      return;
    }
    createDN.mutate(
      {
        id: order.id,
        data: {
          courier: courier.trim(),
          tracking_number: tracking.trim(),
          dispatch_date: dispatchDate,
          expected_delivery_date: etaDate,
          items,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
          toast({ title: "Delivery note filed", description: "Order moved to In Transit." });
          setDnOpen(false);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not file delivery note", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }
  if (!order) return <DashboardLayout><p className="text-sm text-[rgb(102,112,133)]">Order not found.</p></DashboardLayout>;

  const stepIdx = statusToIndex(order.status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[rgb(16,24,40)]">
                Order #{order.po_number}
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
          {canDispatch && !existingDN && (
            <Button onClick={() => setDnOpen(true)} data-testid="button-create-dn">
              <Truck01 className="mr-2 h-4 w-4" /> Create Delivery Note
            </Button>
          )}
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
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Unit Price (SAR)</TableHead>
                    <TableHead className="text-right">Total (SAR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name_en}</TableCell>
                      <TableCell className="text-right">
                        {item.qty} {item.pack_type ?? ""}
                      </TableCell>
                      <TableCell className="text-right">{item.unit_price_sar.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{item.total_sar.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {existingDN && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck01 className="h-5 w-5" /> Delivery Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-medium">{existingDN.dn_number}</p>
                  {existingDN.courier && (
                    <p className="text-[rgb(102,112,133)]">{existingDN.courier}</p>
                  )}
                  {existingDN.tracking_number && (
                    <p className="text-[rgb(102,112,133)]">
                      Tracking: <span className="font-mono">{existingDN.tracking_number}</span>
                    </p>
                  )}
                  {existingDN.expected_delivery_date && (
                    <p className="text-[rgb(102,112,133)]">
                      ETA: {new Date(existingDN.expected_delivery_date).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <File06 className="h-5 w-5" /> PO Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">Transaction Ref: {order.transaction_ref || "—"}</p>
                <p className="text-[rgb(102,112,133)]">Type: {order.type}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create DN modal */}
        <Dialog open={dnOpen} onOpenChange={setDnOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Delivery Note</DialogTitle>
              <DialogDescription>
                Tell the client what's shipping. Filing this moves the order to In Transit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Courier</span>
                <input
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g. SMSA Express"
                  className={inputCls}
                  data-testid="dn-courier"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Tracking number</span>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  className={inputCls}
                  data-testid="dn-tracking"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Dispatch date</span>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className={inputCls}
                  data-testid="dn-dispatch-date"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">Expected delivery</span>
                <input
                  type="date"
                  value={etaDate}
                  onChange={(e) => setEtaDate(e.target.value)}
                  className={inputCls}
                  data-testid="dn-eta-date"
                />
              </label>
            </div>
            <div className="max-h-[40vh] overflow-y-auto pr-1 mt-2">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-[rgb(228,231,236)]">
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Item</th>
                    <th className="px-2 py-2 text-right text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Ordered</th>
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide w-28">Dispatched</th>
                    <th className="px-2 py-2 text-left text-[11px] font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(242,244,247)]">
                  {Object.entries(lines).map(([lineId, draft]) => {
                    const partial = draft.qty_dispatched > 0 && draft.qty_dispatched < draft.qty_ordered;
                    return (
                      <tr key={lineId} data-testid={`dn-row-${lineId}`}>
                        <td className="px-2 py-2 font-medium text-[rgb(16,24,40)]">{draft.name_en}</td>
                        <td className="px-2 py-2 text-right text-[rgb(102,112,133)]">{draft.qty_ordered}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={draft.qty_ordered}
                            value={draft.qty_dispatched}
                            onChange={(e) =>
                              updateLine(lineId, {
                                qty_dispatched: Math.max(0, Math.min(draft.qty_ordered, parseInt(e.target.value || "0", 10))),
                              })
                            }
                            className={`${inputCls} ${partial ? "border-[rgb(254,215,170)] bg-[rgb(255,247,237)]" : ""}`}
                            data-testid={`dn-qty-${lineId}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={draft.notes}
                            onChange={(e) => updateLine(lineId, { notes: e.target.value })}
                            placeholder="Optional"
                            className={inputCls}
                            data-testid={`dn-notes-${lineId}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDnOpen(false)}>Cancel</Button>
              <Button
                type="button"
                onClick={submitDN}
                disabled={createDN.isPending}
                data-testid="dn-submit"
              >
                {createDN.isPending ? "Filing…" : "File Delivery Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
