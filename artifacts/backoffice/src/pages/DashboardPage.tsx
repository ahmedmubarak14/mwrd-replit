import { Users01, Shield01, Receipt, FilePlus02, ArrowUpRight } from "@untitledui/icons";
import { useGetBackofficeDashboardStats, useListAuditLog } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useLocation } from "wouter";

const SPARKLINES = {
  up:   "M0,36 C20,34 40,30 60,26 C80,22 100,16 120,12 C140,8 160,5 180,3",
  down: "M0,3 C20,6 40,10 60,16 C80,22 100,28 120,32 C140,36 160,38 180,36",
  flat: "M0,20 C30,18 60,23 90,20 C120,17 150,22 180,20",
  grow: "M0,32 C30,30 60,27 90,23 C120,18 150,12 180,8",
};

function Sparkline({ path = SPARKLINES.flat, color = "#FF6D43" }: { path?: string; color?: string }) {
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
  testId,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  sparklinePath?: string;
  isLoading?: boolean;
  testId?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[rgb(228,231,236)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-sm font-medium text-[rgb(102,112,133)]">{label}</p>
      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <p
            className="text-[2rem] font-semibold tracking-tight text-[rgb(16,24,40)] leading-none"
            data-testid={testId}
          >
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

const ACTION_COLOR: Record<string, string> = {
  create: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]",
  update: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]",
  delete: "bg-[rgb(255,243,242)] text-[rgb(217,45,32)]",
  approve: "bg-[rgb(255,243,239)] text-[rgb(255,109,67)]",
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetBackofficeDashboardStats();
  const { data: auditLog, isLoading: logLoading } = useListAuditLog({});

  const kpis = [
    {
      label: "Leads Queue",
      value: stats?.pending_leads ?? 0,
      description: "Pending callback requests",
      sparklinePath: SPARKLINES.grow,
      testId: "kpi-value-leads-queue",
    },
    {
      label: "KYC Queue",
      value: stats?.pending_kyc ?? 0,
      description: "Awaiting verification",
      sparklinePath: SPARKLINES.flat,
      testId: "kpi-value-kyc-queue",
    },
    {
      label: "Held Quotes",
      value: stats?.held_quotes ?? 0,
      description: "Requires margin approval",
      sparklinePath: SPARKLINES.up,
      testId: "kpi-value-held-quotes",
    },
    {
      label: "Product Requests",
      value: stats?.pending_offers ?? 0,
      description: "New additions pending",
      sparklinePath: SPARKLINES.grow,
      testId: "kpi-value-product-requests",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Operations Overview</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Pending work and recent platform activity</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <MetricCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            description={kpi.description}
            sparklinePath={kpi.sparklinePath}
            isLoading={statsLoading}
            testId={kpi.testId}
          />
        ))}
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Recent Activity</h2>
          <button
            onClick={() => setLocation("/audit-log")}
            className="text-xs font-medium text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)] flex items-center gap-1 transition-colors"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {logLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !auditLog?.length ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[rgb(152,162,179)]">No recent activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgb(242,244,247)]">
            {auditLog.slice(0, 8).map((log) => {
              const verb = log.action?.split("_")[0]?.toLowerCase() ?? "action";
              const actionColor = ACTION_COLOR[verb] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)]";
              return (
                <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgb(249,250,251)] transition-colors">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
