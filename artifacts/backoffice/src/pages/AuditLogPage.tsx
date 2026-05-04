import { useMemo, useState } from "react";
import { useListAuditLog } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchMd, ClipboardCheck } from "@untitledui/icons";
import { safeFormat } from "@/lib/utils";

// Maps the leading verb of an action key (CALLBACK_COMPLETED → "callback")
// to a tone class. Used both as a display pill and as a filter group.
const ACTION_GROUPS: Record<string, { label: string; pill: string }> = {
  create: { label: "Create", pill: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]" },
  update: { label: "Update", pill: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]" },
  approve: { label: "Approve", pill: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]" },
  reject: { label: "Reject", pill: "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]" },
  delete: { label: "Delete", pill: "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]" },
  callback: { label: "Callback", pill: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]" },
  invoice: { label: "Invoice", pill: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]" },
  admin: { label: "Admin", pill: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]" },
  category: { label: "Category", pill: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]" },
  internal: { label: "Internal", pill: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]" },
};

const FALLBACK_PILL = "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]";

function actionVerb(action: string | undefined | null): string {
  return (action ?? "").split("_")[0]?.toLowerCase() ?? "action";
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [verb, setVerb] = useState<string>("all");
  const [entityType, setEntityType] = useState<string>("all");
  const { data: logs, isLoading } = useListAuditLog({});

  // Derive distinct verbs and entity types from the data so filters don't
  // hard-code things that may not exist in this dataset.
  const { verbOptions, entityOptions } = useMemo(() => {
    const verbs = new Map<string, number>();
    const entities = new Map<string, number>();
    for (const l of logs ?? []) {
      const v = actionVerb(l.action);
      verbs.set(v, (verbs.get(v) ?? 0) + 1);
      const e = l.entity_type ?? "unknown";
      entities.set(e, (entities.get(e) ?? 0) + 1);
    }
    return {
      verbOptions: [...verbs.entries()].sort((a, b) => b[1] - a[1]),
      entityOptions: [...entities.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [logs]);

  const rows = (logs ?? []).filter((l) => {
    if (verb !== "all" && actionVerb(l.action) !== verb) return false;
    if (entityType !== "all" && l.entity_type !== entityType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !l.actor_user_id?.toLowerCase().includes(q) &&
        !l.entity_id?.toLowerCase().includes(q) &&
        !l.entity_type?.toLowerCase().includes(q) &&
        !l.action?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Audit Log</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Trace administrative and automated actions on the platform</p>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by user, entity, or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[rgb(228,231,236)] bg-white text-[rgb(52,64,84)] placeholder:text-[rgb(152,162,179)] focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20 focus:border-[rgb(255,109,67)]"
            data-testid="audit-search"
          />
        </div>

        {!isLoading && (
          <div className="flex flex-wrap gap-3">
            <FilterPills
              label="Action"
              value={verb}
              onChange={setVerb}
              options={[
                { id: "all", label: "All", count: logs?.length ?? 0 },
                ...verbOptions.map(([v, c]) => ({
                  id: v,
                  label: ACTION_GROUPS[v]?.label ?? v,
                  count: c,
                })),
              ]}
              testIdPrefix="filter-verb"
            />
            <FilterPills
              label="Entity"
              value={entityType}
              onChange={setEntityType}
              options={[
                { id: "all", label: "All", count: logs?.length ?? 0 },
                ...entityOptions.map(([e, c]) => ({ id: e, label: e, count: c })),
              ]}
              testIdPrefix="filter-entity"
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No audit log entries match the current filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Actor</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((log) => {
                const v = actionVerb(log.action);
                const pill = ACTION_GROUPS[v]?.pill ?? FALLBACK_PILL;
                return (
                  <tr key={log.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                    <td className="px-5 py-3 text-xs text-[rgb(102,112,133)] font-mono">
                      {safeFormat(log.created_at, "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-[rgb(16,24,40)] hidden sm:table-cell">{log.actor_user_id}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${pill}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs hidden md:table-cell">
                      <span className="text-[rgb(152,162,179)]">{log.entity_type}</span>
                      <span className="text-[rgb(52,64,84)] ml-1">{log.entity_id}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-[rgb(152,162,179)]">Showing {rows.length} of {logs?.length ?? 0} entries.</p>
    </div>
  );
}

function FilterPills({
  label,
  value,
  onChange,
  options,
  testIdPrefix,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { id: string; label: string; count: number }[];
  testIdPrefix: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1 bg-[rgb(249,250,251)] rounded-lg p-1 border border-[rgb(228,231,236)]">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            data-testid={`${testIdPrefix}-${opt.id}`}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
              value === opt.id
                ? "bg-white text-[rgb(16,24,40)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
            }`}
          >
            {opt.label}
            <span className="ml-1 text-[rgb(152,162,179)]">({opt.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
