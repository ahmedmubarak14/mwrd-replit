import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetDashboardStats,
  useListRFQs,
  useListOrders,
  getListRFQsQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  ArrowUpRight,
  File06,
  ChevronRight,
  AlertCircle,
} from "@untitledui/icons";

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

const statusStyles: Record<string, string> = {
  open:               "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  quoted:             "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
  awarded:            "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  partially_awarded:  "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  cancelled:          "bg-[rgb(255,243,242)] text-[rgb(217,45,32)] border-[rgb(255,196,191)]",
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: rfqsData, isLoading: rfqsLoading } = useListRFQs({}, {
    query: { queryKey: getListRFQsQueryKey({}) },
  });
  const { data: ordersData } = useListOrders({}, {
    query: { queryKey: getListOrdersQueryKey({}) },
  });

  const rfqs = rfqsData?.data?.slice(0, 6) ?? [];
  const ordersAwaitingApproval = useMemo(
    () => (ordersData ?? []).filter((o) => o.status === "awaiting_approval"),
    [ordersData],
  );
  const ordersAwaitingGRN = useMemo(
    () => (ordersData ?? []).filter((o) => o.status === "in_transit" || o.status === "delivered"),
    [ordersData],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Dashboard</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Your procurement overview</p>
        </div>
        <Button onClick={() => setLocation("/catalog")} className="gap-2" data-testid="button-new-rfq">
          <PlusCircle className="h-4 w-4" /> New RFQ
        </Button>
      </div>

      {/* Pending actions */}
      {(ordersAwaitingApproval.length > 0 || ordersAwaitingGRN.length > 0) && (
        <div className="bg-[rgb(255,247,237)] border border-[rgb(254,215,170)] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[rgb(194,84,28)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[rgb(124,45,18)]">Needs your attention</p>
              <ul className="mt-1.5 space-y-1 text-sm text-[rgb(124,45,18)]">
                {ordersAwaitingApproval.length > 0 && (
                  <li>
                    <Link
                      href="/orders"
                      className="hover:underline"
                      data-testid="link-pending-approvals"
                    >
                      {ordersAwaitingApproval.length} order{ordersAwaitingApproval.length === 1 ? "" : "s"} awaiting approval →
                    </Link>
                  </li>
                )}
                {ordersAwaitingGRN.length > 0 && (
                  <li>
                    <Link
                      href="/orders"
                      className="hover:underline"
                      data-testid="link-pending-grn"
                    >
                      {ordersAwaitingGRN.length} order{ordersAwaitingGRN.length === 1 ? "" : "s"} ready to receive →
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
          description="Awaiting supplier quotes"
          href="/rfqs"
          isLoading={statsLoading}
          testId="text-open-rfqs-count"
        />
        <MetricCard
          label="Pending Quotes"
          value={stats?.pending_quotes ?? 0}
          description="Under review"
          href="/rfqs"
          isLoading={statsLoading}
          testId="text-pending-quotes-count"
        />
        <MetricCard
          label="Active Orders"
          value={stats?.active_orders ?? 0}
          description="In progress"
          href="/orders"
          isLoading={statsLoading}
          testId="text-active-orders-count"
        />
        <MetricCard
          label="Total Spend"
          value={`SAR ${(stats?.total_spend_sar ?? 0).toLocaleString()}`}
          description="All time"
          href="/orders"
          isLoading={statsLoading}
          testId="text-total-spend"
        />
      </div>

      {/* Recent RFQs */}
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent RFQs</h2>
          <Link
            href="/rfqs"
            className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {rfqsLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <File06 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No RFQs yet. Browse the catalog to create one.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/catalog")}
              className="mt-4"
              data-testid="button-empty-browse-catalog"
            >
              Browse catalog
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Title</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rfqs.map((rfq) => (
                <tr
                  key={rfq.id}
                  onClick={() => setLocation(`/rfqs/${rfq.id}`)}
                  className="hover:bg-[rgb(249,250,251)] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]" data-testid={`text-rfq-title-${rfq.id}`}>
                    {rfq.title}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusStyles[rfq.status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}
                      data-testid={`status-rfq-${rfq.id}`}
                    >
                      {rfq.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell" data-testid={`text-rfq-date-${rfq.id}`}>
                    {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString("en-SA", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-medium text-[rgb(102,112,133)]">View →</span>
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
