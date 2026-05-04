import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import {
  useGetBackofficeDashboardStats,
  useListAuditLog,
  useGetMonthlyRevenueBreakdown,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueBreakdownChart } from "@/components/RevenueBreakdownChart";
import {
  Users01,
  Shield01,
  Receipt,
  FilePlus02,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  CurrencyDollarCircle,
  Package,
  ShoppingBag01,
  FileCheck02,
  Tag01,
} from "@untitledui/icons";

function formatSAR(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]",
  update: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]",
  delete: "bg-[rgb(255,243,242)] text-[rgb(217,45,32)]",
  approve: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)]",
  admin: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)]",
  invoice: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]",
  callback: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]",
};

const STATUS_PILL: Record<string, string> = {
  pending: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
  awaiting_approval: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
  confirmed: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  in_transit: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]",
  delivered: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]",
  completed: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]",
  cancelled: "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]",
};

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
      {description && <p className="mt-1.5 text-sm text-[rgb(152,162,179)]">{description}</p>}
    </div>
  );
  if (!href) return inner;
  return <Link href={href} data-testid={testId ? `link-${testId}` : undefined}>{inner}</Link>;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetBackofficeDashboardStats();
  const { data: auditLog, isLoading: logLoading } = useListAuditLog({});
  const { data: revenue, isLoading: revenueLoading } = useGetMonthlyRevenueBreakdown({ months: 6 });

  // Pending Actions panel — every PRD-listed queue with a count + jump link.
  const pendingActions = [
    {
      label: "New leads awaiting callback",
      count: stats?.pending_leads ?? 0,
      href: "/leads",
      icon: Users01,
    },
    {
      label: "Accounts pending KYC verification",
      count: stats?.pending_kyc ?? 0,
      href: "/kyc",
      icon: Shield01,
    },
    {
      label: "Supplier offers awaiting approval",
      count: stats?.pending_offers ?? 0,
      href: "/offers",
      icon: Tag01,
    },
    {
      label: "Quotes held for admin review",
      count: stats?.held_quotes ?? 0,
      href: "/quotes",
      icon: Receipt,
    },
    {
      label: "Product addition requests",
      count: stats?.pending_product_requests ?? 0,
      href: "/product-requests",
      icon: FilePlus02,
    },
    {
      label: "Three-way match queue",
      count: stats?.three_way_match_pending ?? 0,
      href: "/three-way-match",
      icon: FileCheck02,
    },
  ];

  const totalPending = pendingActions.reduce((s, a) => s + a.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Operations Overview</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Pending work and platform activity</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sales"
          value={formatSAR(stats?.total_sales_sar ?? 0)}
          description="Completed orders, all time"
          href="/orders"
          isLoading={statsLoading}
          testId="kpi-total-sales"
        />
        <MetricCard
          label="Total Orders"
          value={stats?.total_orders ?? 0}
          description="CPOs in any status"
          href="/orders"
          isLoading={statsLoading}
          testId="kpi-total-orders"
        />
        <MetricCard
          label="Active Clients"
          value={stats?.active_clients ?? 0}
          description="Verified buyer accounts"
          href="/clients"
          isLoading={statsLoading}
          testId="kpi-active-clients"
        />
        <MetricCard
          label="Active Suppliers"
          value={stats?.active_suppliers ?? 0}
          description="Verified seller accounts"
          href="/suppliers"
          isLoading={statsLoading}
          testId="kpi-active-suppliers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Actions panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
            <div>
              <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Pending actions</h2>
              <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">
                {totalPending === 0 ? "All queues are clear" : `${totalPending} item${totalPending === 1 ? "" : "s"} need attention`}
              </p>
            </div>
          </div>
          {statsLoading ? (
            <div className="p-5 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ul className="divide-y divide-[rgb(242,244,247)]">
              {pendingActions.map((a) => {
                const Icon = a.icon;
                const isQuiet = a.count === 0;
                return (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[rgb(249,250,251)] transition-colors"
                      data-testid={`pending-action-${a.href.slice(1)}`}
                    >
                      <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        isQuiet
                          ? "bg-[rgb(242,244,247)] text-[rgb(152,162,179)]"
                          : "bg-[rgb(255,247,237)] text-[rgb(194,84,28)]"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm text-[rgb(52,64,84)]">{a.label}</span>
                      <span className={`text-sm font-semibold ${isQuiet ? "text-[rgb(152,162,179)]" : "text-[rgb(16,24,40)]"}`}>
                        {a.count}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[rgb(208,213,221)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Highlight callout */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <CurrencyDollarCircle className="h-5 w-5 text-[rgb(255,109,67)]" />
              <h3 className="text-sm font-semibold text-[rgb(16,24,40)]">RFQ activity</h3>
            </div>
            <p className="text-3xl font-semibold text-[rgb(16,24,40)] leading-none">
              {statsLoading ? <Skeleton className="h-9 w-12 inline-block" /> : (stats?.total_rfqs_open ?? 0)}
            </p>
            <p className="mt-1 text-xs text-[rgb(102,112,133)]">RFQs currently open or quoted</p>
          </div>

          {totalPending > 0 && (
            <div className="rounded-xl border border-[rgb(254,215,170)] bg-[rgb(255,247,237)] p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-[rgb(194,84,28)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[rgb(124,45,18)]">{totalPending} action{totalPending === 1 ? "" : "s"} in flight</p>
                  <p className="mt-0.5 text-xs text-[rgb(124,45,18)]">
                    Click any row in the panel to jump straight to the queue.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
          <div>
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Revenue breakdown</h2>
            <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">Last 6 months — sales bars, margin line</p>
          </div>
        </div>
        <div className="p-5">
          {revenueLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : (
            <RevenueBreakdownChart data={revenue ?? []} />
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent orders</h2>
          <Link
            href="/orders"
            className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {statsLoading ? (
          <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !stats?.recent_orders?.length ? (
          <div className="px-5 py-12 text-center">
            <Package className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Order #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {stats.recent_orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-[rgb(249,250,251)] transition-colors cursor-pointer"
                  onClick={() => setLocation("/orders")}
                  data-testid={`recent-order-${order.id}`}
                >
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">#{order.po_number}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">
                      {order.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[rgb(52,64,84)]">{formatSAR(order.total_sar)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_PILL[order.status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}>
                      {order.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell">
                    {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent activity</h2>
          <Link
            href="/audit-log"
            className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {logLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !auditLog?.length ? (
          <div className="px-5 py-12 text-center">
            <ShoppingBag01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No recent activity.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[rgb(242,244,247)]">
            {auditLog.slice(0, 6).map((log) => {
              const verb = log.action?.split("_")[0]?.toLowerCase() ?? "action";
              const actionColor = ACTION_COLOR[verb] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)]";
              return (
                <li key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgb(249,250,251)] transition-colors">
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColor}`}>
                    {verb}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[rgb(52,64,84)] truncate">{log.action}</p>
                    <p className="text-xs text-[rgb(152,162,179)] truncate">
                      {log.entity_type} · {log.entity_id}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-[rgb(152,162,179)]">
                    {format(new Date(log.created_at), "MMM d, HH:mm")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
