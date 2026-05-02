import { useState } from "react";
import { useListAuditLog } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchMd, ClipboardCheck } from "@untitledui/icons";
import { safeFormat } from "@/lib/utils";

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useListAuditLog({});

  const rows = (logs ?? []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.actor_user_id?.toLowerCase().includes(q) ||
      l.entity_id?.toLowerCase().includes(q) ||
      l.entity_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Audit Log</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Trace all administrative and automated actions on the platform</p>
      </div>

      <div className="relative max-w-sm">
        <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)] pointer-events-none" />
        <input
          type="text"
          placeholder="Search by user or entity ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[rgb(228,231,236)] bg-white text-[rgb(52,64,84)] placeholder:text-[rgb(152,162,179)] focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20 focus:border-[rgb(255,109,67)]"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No audit log entries match your search.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Actor</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Action</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((log) => (
                <tr key={log.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3 text-xs text-[rgb(102,112,133)] font-mono">
                    {safeFormat(log.created_at, "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-[rgb(16,24,40)] hidden sm:table-cell">{log.actor_user_id}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-[rgb(242,244,247)] text-[rgb(52,64,84)] border-[rgb(228,231,236)]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs hidden md:table-cell">
                    <span className="text-[rgb(152,162,179)]">{log.entity_type}</span>
                    <span className="text-[rgb(52,64,84)] ml-1">{log.entity_id}</span>
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
