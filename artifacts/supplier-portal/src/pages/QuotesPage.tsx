import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyQuotes } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { safeFormat } from "@/lib/utils";
import { Receipt, ArrowRight } from "@untitledui/icons";

const STATUS_PILL: Record<string, string> = {
  draft:     "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]",
  submitted: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]  border-[rgb(209,236,255)]",
  accepted:  "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]    border-[rgb(167,243,208)]",
  rejected:  "bg-[rgb(255,243,242)] text-[rgb(217,45,32)]   border-[rgb(255,196,191)]",
};

export default function QuotesPage() {
  const { data, isLoading } = useListMyQuotes();
  const quotes = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">My Quotes</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Quotes you've submitted in response to RFQs</p>
        </div>

        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : quotes.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">You haven't submitted any quotes yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Quote #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">RFQ ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Submitted</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-[rgb(52,64,84)]">{quote.quote_number}</td>
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)] hidden sm:table-cell">{quote.rfq_id}</td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell">
                      {safeFormat(quote.submitted_at, "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_PILL[quote.status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] transition-colors"
                        data-testid={`button-view-quote-${quote.id}`}
                      >
                        View <ArrowRight className="h-3.5 w-3.5" />
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
