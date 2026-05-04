import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useListPendingOffers,
  useAdminApproveOffer,
  useAdminRejectOffer,
  getListPendingOffersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag01, Check, X } from "@untitledui/icons";

export default function OffersQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offers, isLoading } = useListPendingOffers();
  const approveMutation = useAdminApproveOffer();
  const rejectMutation = useAdminRejectOffer();

  const rows = offers ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Drop selections that disappear when the list refreshes — otherwise stale
  // ids would silently inflate the bulk count.
  const visibleIds = useMemo(() => new Set(rows.map((o) => o.id)), [rows]);
  const cleanSelected = useMemo(
    () => new Set([...selected].filter((id) => visibleIds.has(id))),
    [selected, visibleIds],
  );

  const allSelected = rows.length > 0 && cleanSelected.size === rows.length;
  const someSelected = cleanSelected.size > 0 && !allSelected;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((o) => o.id)));
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListPendingOffersQueryKey() });

  const handleApprove = (offerId: string) => {
    approveMutation.mutate(
      { id: offerId },
      {
        onSuccess: () => {
          toast({ title: "Offer approved" });
          invalidate();
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      },
    );
  };

  const handleReject = (offerId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;
    rejectMutation.mutate(
      { id: offerId, data: { reason } },
      {
        onSuccess: () => {
          toast({ title: "Offer rejected" });
          invalidate();
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      },
    );
  };

  // Server doesn't expose bulk endpoints — fan out the per-item mutations
  // and invalidate once at the end so the table doesn't flicker mid-batch.
  const bulkApprove = async () => {
    const ids = [...cleanSelected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => new Promise<void>((res, rej) => {
        approveMutation.mutate(
          { id },
          { onSuccess: () => res(), onError: (e) => rej(e) },
        );
      })),
    );
    setBulkBusy(false);
    setSelected(new Set());
    invalidate();
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    toast({
      title: `Approved ${ok}${failed ? ` · ${failed} failed` : ""}`,
      variant: failed ? "destructive" : "default",
    });
  };

  const bulkReject = async () => {
    const ids = [...cleanSelected];
    if (ids.length === 0) return;
    const reason = window.prompt(`Reason for rejecting ${ids.length} offer${ids.length === 1 ? "" : "s"}:`);
    if (reason === null) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => new Promise<void>((res, rej) => {
        rejectMutation.mutate(
          { id, data: { reason } },
          { onSuccess: () => res(), onError: (e) => rej(e) },
        );
      })),
    );
    setBulkBusy(false);
    setSelected(new Set());
    invalidate();
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    toast({
      title: `Rejected ${ok}${failed ? ` · ${failed} failed` : ""}`,
      variant: failed ? "destructive" : "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Pending Offers</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Review and approve product offers from suppliers</p>
        </div>
        {cleanSelected.size > 0 && (
          <div className="flex items-center gap-2 bg-[rgb(255,247,237)] border border-[rgb(254,215,170)] rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-[rgb(124,45,18)]">
              {cleanSelected.size} selected
            </span>
            <button
              type="button"
              onClick={bulkReject}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[rgb(228,231,236)] text-[rgb(102,112,133)] bg-white hover:border-[rgb(217,45,32)] hover:text-[rgb(217,45,32)] transition-colors disabled:opacity-50"
              data-testid="bulk-reject"
            >
              <X className="h-3.5 w-3.5" /> Reject all
            </button>
            <button
              type="button"
              onClick={bulkApprove}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border border-[rgb(167,243,208)] hover:bg-[rgb(209,250,229)] transition-colors disabled:opacity-50"
              data-testid="bulk-approve"
            >
              <Check className="h-3.5 w-3.5" /> Approve all
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Tag01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No pending offers to review.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-[rgb(208,213,221)] text-[rgb(255,109,67)] focus:ring-[rgb(255,109,67)]"
                    data-testid="select-all"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Product ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((offer) => {
                const isChecked = cleanSelected.has(offer.id);
                return (
                  <tr key={offer.id} className={`transition-colors ${isChecked ? "bg-[rgb(255,247,237)]/40" : "hover:bg-[rgb(249,250,251)]"}`}>
                    <td className="px-3 py-3.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(offer.id)}
                        aria-label={`Select offer ${offer.id}`}
                        className="h-4 w-4 rounded border-[rgb(208,213,221)] text-[rgb(255,109,67)] focus:ring-[rgb(255,109,67)]"
                        data-testid={`select-${offer.id}`}
                      />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">{offer.supplier_company_id}</td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)]">{offer.master_product_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(255,249,235)] text-[rgb(181,71,8)] border-[rgb(254,223,137)]">
                        {offer.approval_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(offer.id)}
                          disabled={rejectMutation.isPending || bulkBusy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgb(228,231,236)] text-[rgb(102,112,133)] hover:border-[rgb(217,45,32)] hover:text-[rgb(217,45,32)] transition-colors disabled:opacity-50"
                          data-testid={`button-reject-${offer.id}`}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(offer.id)}
                          disabled={approveMutation.isPending || bulkBusy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border border-[rgb(167,243,208)] hover:bg-[rgb(209,250,229)] transition-colors disabled:opacity-50"
                          data-testid={`button-approve-${offer.id}`}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
