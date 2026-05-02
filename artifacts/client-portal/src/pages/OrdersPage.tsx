import { useLocation } from "wouter";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "@untitledui/icons";

const STATUS_PILL: Record<string, string> = {
  pending:    "bg-[rgb(255,249,235)] text-[rgb(181,71,8)]   border-[rgb(254,223,137)]",
  approved:   "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]  border-[rgb(209,236,255)]",
  processing: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)]  border-[rgb(209,236,255)]",
  shipped:    "bg-[rgb(245,243,255)] text-[rgb(105,65,198)]  border-[rgb(214,205,254)]",
  in_transit: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)]  border-[rgb(214,205,254)]",
  delivered:  "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]   border-[rgb(167,243,208)]",
  completed:  "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]   border-[rgb(167,243,208)]",
  cancelled:  "bg-[rgb(255,243,242)] text-[rgb(217,45,32)]  border-[rgb(255,196,191)]",
};

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = useListOrders({}, {
    query: { queryKey: getListOrdersQueryKey({}) },
  });

  const rows = orders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Orders</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Track your purchase orders and deliveries</p>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No orders yet. Award an RFQ to create a purchase order.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Order #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Amount (SAR)</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((order) => (
                <tr key={order.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]" data-testid={`text-order-id-${order.id}`}>
                    #{order.po_number || order.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell" data-testid={`text-order-supplier-${order.id}`}>
                    {order.supplier_company_id || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell" data-testid={`text-order-amount-${order.id}`}>
                    {order.total_sar?.toLocaleString("en-SA", { minimumFractionDigits: 2 }) ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_PILL[order.status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}
                      data-testid={`status-order-${order.id}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setLocation(`/orders/${order.id}`)}
                      className="text-xs font-medium text-[rgb(102,112,133)] hover:text-[rgb(16,24,40)] transition-colors"
                      data-testid={`button-view-order-${order.id}`}
                    >
                      View →
                    </button>
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
