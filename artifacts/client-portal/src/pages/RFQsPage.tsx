import { useLocation } from "wouter";
import { useListRFQs, getListRFQsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, File06 } from "@untitledui/icons";

const STATUS_PILL: Record<string, string> = {
  open:      "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]  border-[rgb(209,236,255)]",
  awarded:   "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]   border-[rgb(167,243,208)]",
  cancelled: "bg-[rgb(255,243,242)] text-[rgb(217,45,32)]  border-[rgb(255,196,191)]",
};

export default function RFQsPage() {
  const [, setLocation] = useLocation();
  const { data: rfqs, isLoading } = useListRFQs({}, {
    query: { queryKey: getListRFQsQueryKey({}) },
  });

  const rows = rfqs?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">RFQs</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage your requests for quotation</p>
        </div>
        <Button onClick={() => setLocation("/catalog")} className="gap-2" data-testid="button-new-rfq">
          <PlusCircle className="h-4 w-4" /> New RFQ
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <File06 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No RFQs yet. Add products from the catalog to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Title</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Delivery City</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Required By</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]" data-testid={`text-rfq-title-${rfq.id}`}>
                    {rfq.title}
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell" data-testid={`text-rfq-city-${rfq.id}`}>
                    {rfq.delivery_city || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell" data-testid={`text-rfq-date-${rfq.id}`}>
                    {rfq.delivery_date ? new Date(rfq.delivery_date).toLocaleDateString("en-SA", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_PILL[rfq.status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}
                      data-testid={`status-rfq-${rfq.id}`}
                    >
                      {rfq.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setLocation(`/rfqs/${rfq.id}`)}
                      className="text-xs font-medium text-[rgb(102,112,133)] hover:text-[rgb(16,24,40)] transition-colors"
                      data-testid={`button-view-rfq-${rfq.id}`}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
