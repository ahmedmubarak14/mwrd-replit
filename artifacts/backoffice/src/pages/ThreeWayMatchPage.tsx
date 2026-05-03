import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListThreeWayMatch,
  getListThreeWayMatchQueryKey,
  useIssueThreeWayMatchInvoice,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, FileCheck02, ChevronDown } from "@untitledui/icons";
import { format } from "date-fns";

type Filter = "all" | "matched" | "discrepancy";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "discrepancy", label: "With discrepancies" },
  { id: "matched", label: "Match (clean)" },
];

export default function ThreeWayMatchPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rows, isLoading } = useListThreeWayMatch({
    query: { queryKey: getListThreeWayMatchQueryKey() },
  });

  const issueInvoice = useIssueThreeWayMatchInvoice();

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (filter === "matched") return list.filter((r) => r.matches);
    if (filter === "discrepancy") return list.filter((r) => !r.matches);
    return list;
  }, [rows, filter]);

  const counts = useMemo(() => {
    const list = rows ?? [];
    return {
      total: list.length,
      matched: list.filter((r) => r.matches).length,
      discrepancy: list.filter((r) => !r.matches).length,
    };
  }, [rows]);

  const handleIssue = (cpoId: string, cpoNumber: string) => {
    issueInvoice.mutate(
      { cpoId },
      {
        onSuccess: (invoice: { invoice_number: string; status: string }) => {
          queryClient.invalidateQueries({ queryKey: getListThreeWayMatchQueryKey() });
          toast({
            title: `Invoice ${invoice.invoice_number} ${invoice.status === "issued" ? "issued" : "saved as draft"}`,
            description: `For CPO ${cpoNumber}.`,
          });
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not issue invoice", description: err?.message ?? "Please try again." }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Three-Way Match Queue</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">
            Finance review of PO + GRN + projected Invoice (variance threshold 2%)
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="text-right">
            <p className="text-xs text-[rgb(102,112,133)] uppercase tracking-wide">Pending</p>
            <p className="font-semibold text-[rgb(16,24,40)]">{counts.total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[rgb(102,112,133)] uppercase tracking-wide">Match</p>
            <p className="font-semibold text-[rgb(7,148,85)]">{counts.matched}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[rgb(102,112,133)] uppercase tracking-wide">Variance</p>
            <p className="font-semibold text-[rgb(180,35,24)]">{counts.discrepancy}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-[rgb(249,250,251)] rounded-lg p-1 border border-[rgb(228,231,236)] w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            data-testid={`filter-${f.id}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f.id
                ? "bg-white text-[rgb(16,24,40)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileCheck02 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">
              {filter === "all" ? "No deliveries waiting for finance review." : `No rows for "${filter}".`}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
                <th className="w-8 px-2 py-3"></th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">CPO #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden lg:table-cell">GRN #</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden lg:table-cell">Variance</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Match</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {filtered.map((row) => {
                const isOpen = expanded === row.cpo_id;
                const alreadyIssued = row.invoice_status === "issued" || row.invoice_status === "paid";
                return (
                  <>
                    <tr
                      key={row.cpo_id}
                      className="hover:bg-[rgb(249,250,251)] transition-colors cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : row.cpo_id)}
                      data-testid={`row-${row.cpo_number}`}
                    >
                      <td className="px-2 py-3.5 text-[rgb(152,162,179)]">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
                        />
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">
                        #{row.cpo_number}
                        <p className="text-[11px] text-[rgb(152,162,179)] font-normal mt-0.5">
                          {format(new Date(row.received_at), "MMM d, yyyy")}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[rgb(52,64,84)] hidden md:table-cell">{row.client_real_name}</td>
                      <td className="px-5 py-3.5 text-[rgb(52,64,84)] hidden md:table-cell">{row.supplier_real_name}</td>
                      <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden lg:table-cell">{row.grn_number}</td>
                      <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                        <span className={row.variance_pct > 2 ? "text-[rgb(180,35,24)] font-medium" : "text-[rgb(52,64,84)]"}>
                          {row.variance_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.matches ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]">
                            <CheckCircle className="h-3 w-3" /> Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]">
                            <AlertTriangle className="h-3 w-3" /> {row.discrepancies.length} issue{row.discrepancies.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {alreadyIssued ? (
                          <span className="text-xs text-[rgb(102,112,133)]">
                            Invoice {row.invoice_number} ({row.invoice_status})
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={row.matches ? "primary" : "outline"}
                            disabled={issueInvoice.isPending}
                            onClick={() => handleIssue(row.cpo_id, row.cpo_number)}
                            data-testid={`issue-${row.cpo_number}`}
                          >
                            {row.matches ? "Issue Invoice" : "Issue (override)"}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[rgb(249,250,251)]">
                        <td></td>
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2">Totals</p>
                              <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-[rgb(102,112,133)]">PO total</dt>
                                  <dd className="font-medium text-[rgb(16,24,40)]">SAR {row.cpo_total_sar.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-[rgb(102,112,133)]">Invoice total {row.invoice_id ? "" : "(projected)"}</dt>
                                  <dd className="font-medium text-[rgb(16,24,40)]">SAR {row.invoice_total_sar.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-[rgb(102,112,133)]">Variance</dt>
                                  <dd className={row.variance_pct > 2 ? "font-semibold text-[rgb(180,35,24)]" : "font-medium text-[rgb(7,148,85)]"}>
                                    {row.variance_pct.toFixed(2)}%
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-[rgb(102,112,133)]">Transaction ref</dt>
                                  <dd className="font-mono text-[11px] text-[rgb(52,64,84)]">{row.transaction_ref}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2">
                                {row.matches ? "No discrepancies" : "Discrepancies"}
                              </p>
                              {row.discrepancies.length === 0 ? (
                                <p className="text-sm text-[rgb(7,148,85)] flex items-center gap-1.5">
                                  <CheckCircle className="h-4 w-4" /> All checks passed.
                                </p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {row.discrepancies.map((d, i) => (
                                    <li key={i} className="text-sm text-[rgb(180,35,24)] flex items-start gap-1.5">
                                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                      <span>{d}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
