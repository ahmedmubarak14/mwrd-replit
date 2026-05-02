import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListRFQs } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { safeFormat } from "@/lib/utils";
import { File06, ArrowRight } from "@untitledui/icons";

export default function RFQsPage() {
  const { data, isLoading } = useListRFQs({ status: "open" });
  const rfqs = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Open RFQs</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Requests for quote awaiting your response</p>
        </div>

        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rfqs.length === 0 ? (
            <div className="py-16 text-center">
              <File06 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">No open RFQs assigned to you.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">RFQ #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden lg:table-cell">Expires</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-[rgb(52,64,84)]">{rfq.rfq_number}</td>
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">{rfq.title}</td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell">
                      {safeFormat(rfq.created_at, "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden lg:table-cell">
                      {safeFormat(rfq.expires_at, "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]">
                        {rfq.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/rfqs/${rfq.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] transition-colors"
                        data-testid={`button-view-rfq-${rfq.id}`}
                      >
                        View & Quote <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
