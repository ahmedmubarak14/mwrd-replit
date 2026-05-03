import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyOffers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { safeFormat } from "@/lib/utils";
import { Tag01, Plus } from "@untitledui/icons";

const STATUS_PILL: Record<string, string> = {
  pending:  "bg-[rgb(255,249,235)] text-[rgb(181,71,8)]  border-[rgb(254,223,137)]",
  approved: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)]  border-[rgb(167,243,208)]",
  rejected: "bg-[rgb(255,243,242)] text-[rgb(217,45,32)] border-[rgb(255,196,191)]",
};

export default function OffersPage() {
  const { data, isLoading } = useListMyOffers();
  const offers = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">My Offers</h1>
            <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Product offers you've submitted to mwrd</p>
          </div>
          <Link
            href="/offers/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
            data-testid="button-create-offer"
          >
            <Plus className="h-4 w-4" /> Create Offer
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : offers.length === 0 ? (
            <div className="py-16 text-center">
              <Tag01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">No offers submitted yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">SKU</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">{offer.master_product_id}</td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)] font-mono text-xs hidden sm:table-cell">{offer.supplier_internal_sku || "—"}</td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell">
                      {safeFormat(offer.created_at, "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_PILL[offer.approval_status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}>
                        {offer.approval_status}
                      </span>
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
