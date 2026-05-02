import { useState } from "react";
import { useListOrders } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "@untitledui/icons";
import { format } from "date-fns";

const STATUS_PILL: Record<string, string> = {
  pending:    "bg-[rgb(255,249,235)] text-[rgb(181,71,8)]  border-[rgb(254,223,137)]",
  processing: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  shipped:    "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]",
  in_transit: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]",
  completed:  "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  cancelled:  "bg-[rgb(255,243,242)] text-[rgb(217,45,32)] border-[rgb(255,196,191)]",
};

const STATUS_OPTIONS = ["all", "pending", "processing", "shipped", "completed", "cancelled"];

export default function OrdersPage() {
  const [status, setStatus] = useState("all");

  const { data: orders, isLoading } = useListOrders({
    status: status === "all" ? undefined : (status as any),
  });

  const rows = orders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Orders</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">All client and supplier purchase orders</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[rgb(102,112,133)]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-[rgb(228,231,236)] rounded-lg px-3 py-1.5 bg-white text-[rgb(52,64,84)] focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No orders found for the selected filter.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Order #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Client</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Supplier</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden lg:table-cell">Amount (SAR)</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((order) => (
                <tr key={order.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">#{order.po_number}</td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell">{order.client_company_id}</td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell">{order.supplier_company_id}</td>
                  <td className="px-5 py-3.5 text-right text-[rgb(52,64,84)] hidden lg:table-cell">{order.total_sar?.toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_PILL[order.status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}>
                      {order.status}
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
    </div>
  );
}
