import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetDashboardStats,
  useListMyQuotes,
  useListOrders,
  getListMyQuotesQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ChevronRight,
  MessageChatCircle,
  AlertCircle,
} from "@untitledui/icons";
import { formatDistanceToNow } from "date-fns";

function MetricCard({
  label,
  value,
  description,
  href,
  isLoading,
  testId,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  href?: string;
  isLoading?: boolean;
  testId?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-[rgb(228,231,236)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[rgb(208,213,221)] transition-colors h-full">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[rgb(102,112,133)]">{label}</p>
        {href && <ChevronRight className="h-4 w-4 text-[rgb(208,213,221)] shrink-0 mt-0.5" />}
      </div>
      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="text-[2rem] font-semibold tracking-tight text-[rgb(16,24,40)] leading-none" data-testid={testId}>
            {value}
          </p>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-sm text-[rgb(152,162,179)]">{description}</p>
      )}
    </div>
  );
  if (!href) return inner;
  return (
    <Link href={href} data-testid={testId ? `link-${testId}` : undefined}>
      {inner}
    </Link>
  );
}

const quoteStatusStyles: Record<string, string> = {
  draft:                "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]",
  draft_auto:           "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]",
  draft_manual:         "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]",
  submitted_to_client:  "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  pending_admin_review: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
  accepted:             "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  partially_accepted:   "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  rejected:             "bg-[rgb(255,243,242)] text-[rgb(217,45,32)] border-[rgb(255,196,191)]",
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: quotesData, isLoading: quotesLoading } = useListMyQuotes(undefined, {
    query: { queryKey: getListMyQuotesQueryKey() },
  });
  const { data: ordersData } = useListOrders({}, {
    query: { queryKey: getListOrdersQueryKey({}) },
  });

  const quotes = quotesData?.data?.slice(0, 6) ?? [];
  const ordersToShip = useMemo(
    () => (ordersData ?? []).filter((o) => o.status === "confirmed"),
    [ordersData],
  );
  const draftsToFinish = useMemo(
    () =>
      (quotesData?.data ?? []).filter(
        (q) => q.status === "draft" || q.status === "draft_auto" || q.status === "draft_manual",
      ),
    [quotesData],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Supplier Dashboard</h1>
            <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Your orders, quotes and opportunities</p>
          </div>
        </div>

        {/* Pending actions */}
        {(ordersToShip.length > 0 || draftsToFinish.length > 0) && (
          <div className="bg-[rgb(255,247,237)] border border-[rgb(254,215,170)] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[rgb(194,84,28)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[rgb(124,45,18)]">Needs your attention</p>
                <ul className="mt-1.5 space-y-1 text-sm text-[rgb(124,45,18)]">
                  {ordersToShip.length > 0 && (
                    <li>
                      <Link href="/orders" className="hover:underline" data-testid="link-orders-to-ship">
                        {ordersToShip.length} confirmed order{ordersToShip.length === 1 ? "" : "s"} ready to ship →
                      </Link>
                    </li>
                  )}
                  {draftsToFinish.length > 0 && (
                    <li>
                      <Link href="/quotes" className="hover:underline" data-testid="link-quote-drafts">
                        {draftsToFinish.length} quote draft{draftsToFinish.length === 1 ? "" : "s"} to finish →
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Metric tiles — clickable, no fake sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Open RFQs"
            value={stats?.open_rfqs ?? 0}
            description="Awaiting your quote"
            href="/rfqs"
            isLoading={statsLoading}
            testId="text-open-rfqs-count"
          />
          <MetricCard
            label="Submitted Quotes"
            value={stats?.pending_quotes ?? 0}
            description="Under review"
            href="/quotes"
            isLoading={statsLoading}
            testId="text-pending-quotes-count"
          />
          <MetricCard
            label="Active Orders"
            value={stats?.active_orders ?? 0}
            description="Needs delivery"
            href="/orders"
            isLoading={statsLoading}
            testId="text-active-orders-count"
          />
          <MetricCard
            label="Total Revenue"
            value={`SAR ${(stats?.total_spend_sar ?? 0).toLocaleString()}`}
            description="All time"
            href="/orders"
            isLoading={statsLoading}
            testId="text-total-revenue"
          />
        </div>

        {/* Recent Quotes */}
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent Quotes</h2>
            <Link
              href="/quotes"
              className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {quotesLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : quotes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageChatCircle className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">No quotes yet — open RFQs will appear under RFQs.</p>
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
                    data-testid={`row-quote-${quote.id}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">Quote #{quote.quote_number}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${quoteStatusStyles[quote.status] ?? quoteStatusStyles.draft}`}
                      >
                        {quote.status?.replace(/_/g, " ")}
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
