import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetDashboardStats, useListMyQuotes } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, File06, MessageChatCircle, ShoppingCart01, CurrencyDollarCircle } from "@untitledui/icons";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

const SPARKLINES = {
  up:   "M0,36 C20,34 40,30 60,26 C80,22 100,16 120,12 C140,8 160,5 180,3",
  down: "M0,3 C20,6 40,10 60,16 C80,22 100,28 120,32 C140,36 160,38 180,36",
  flat: "M0,20 C30,18 60,23 90,20 C120,17 150,22 180,20",
  grow: "M0,32 C30,30 60,27 90,23 C120,18 150,12 180,8",
};

function Sparkline({ path = SPARKLINES.up, color = "#FF6D43" }: { path?: string; color?: string }) {
  return (
    <svg width="100%" height="48" viewBox="0 0 180 48" fill="none" className="mt-3 -mx-0.5 w-[calc(100%+4px)]">
      <path d={path} stroke={color} strokeWidth="1.75" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  description,
  sparklinePath,
  isLoading,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  sparklinePath?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[rgb(228,231,236)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-sm font-medium text-[rgb(102,112,133)]">{label}</p>
      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="text-[2rem] font-semibold tracking-tight text-[rgb(16,24,40)] leading-none">
            {value}
          </p>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-sm text-[rgb(152,162,179)]">{description}</p>
      )}
      {sparklinePath && <Sparkline path={sparklinePath} />}
    </div>
  );
}

const quoteStatusStyles: Record<string, string> = {
  draft:     "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]",
  submitted: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  accepted:  "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  rejected:  "bg-[rgb(255,243,242)] text-[rgb(217,45,32)] border-[rgb(255,196,191)]",
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: quotesData, isLoading: quotesLoading } = useListMyQuotes();
  const quotes = quotesData?.data?.slice(0, 6) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Supplier Dashboard</h1>
            <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Your orders, quotes and opportunities</p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            label="Open RFQs"
            value={stats?.open_rfqs ?? 0}
            description="Awaiting your quote"
            sparklinePath={SPARKLINES.grow}
            isLoading={statsLoading}
          />
          <MetricCard
            label="Submitted Quotes"
            value={stats?.pending_quotes ?? 0}
            description="Under review"
            sparklinePath={SPARKLINES.flat}
            isLoading={statsLoading}
          />
          <MetricCard
            label="Active Orders"
            value={stats?.active_orders ?? 0}
            description="Needs delivery"
            sparklinePath={SPARKLINES.up}
            isLoading={statsLoading}
          />
          <MetricCard
            label="Total Revenue"
            value={`SAR ${(stats?.total_spend_sar ?? 0).toLocaleString()}`}
            description="All time"
            sparklinePath={SPARKLINES.grow}
            isLoading={statsLoading}
          />
        </div>

        {/* Recent Quotes */}
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent Quotes</h2>
            <button
              onClick={() => setLocation("/quotes")}
              className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          {quotesLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : quotes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageChatCircle className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">No quotes submitted yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Quote #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {quotes.map((quote) => (
                  <tr
                    key={quote.id}
                    onClick={() => setLocation(`/quotes/${quote.id}`)}
                    className="hover:bg-[rgb(249,250,251)] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">
                      Quote #{quote.quote_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${quoteStatusStyles[quote.status] ?? quoteStatusStyles.draft}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell">
                      {quote.submitted_at
                        ? formatDistanceToNow(new Date(quote.submitted_at), { addSuffix: true })
                        : "Not submitted"}
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
