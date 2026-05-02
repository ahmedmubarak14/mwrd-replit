import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMe, useListAddresses } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Building02, MarkerPin01 } from "@untitledui/icons";

type Tab = "company" | "addresses";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "company", label: "Company Info", icon: Building02 },
  { id: "addresses", label: "Addresses", icon: MarkerPin01 },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("company");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ company: null, addresses: null });

  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: addresses, isLoading: addressesLoading } = useListAddresses();

  const handleTabKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    let nextIdx = idx;
    if (e.key === "ArrowLeft")  nextIdx = (idx - 1 + TABS.length) % TABS.length;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % TABS.length;
    if (e.key === "Home")       nextIdx = 0;
    if (e.key === "End")        nextIdx = TABS.length - 1;
    const next = TABS[nextIdx];
    setActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Account Settings</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage your company profile and delivery addresses</p>
        </div>

        <div role="tablist" aria-label="Account sections" className="flex gap-1 border-b border-[rgb(228,231,236)]">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKey(e, idx)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(255,109,67)]/40 rounded-t ${
                  isActive
                    ? "border-[rgb(255,109,67)] text-[rgb(255,109,67)]"
                    : "border-transparent text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "company" && (
          <div role="tabpanel" id="panel-company" aria-labelledby="tab-company" className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)] mb-5">Company Information</h2>
            {userLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Company Name</p>
                  <p className="mt-1 text-sm font-semibold text-[rgb(16,24,40)]">{user?.company?.real_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Account Type</p>
                  <p className="mt-1 text-sm font-semibold text-[rgb(16,24,40)] capitalize">{user?.user?.role || "Supplier"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Primary Email</p>
                  <p className="mt-1 text-sm text-[rgb(52,64,84)]">{user?.user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Registered</p>
                  <p className="mt-1 text-sm text-[rgb(52,64,84)]">
                    {user?.user?.created_at ? new Date(user.user.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "addresses" && (
          <div role="tabpanel" id="panel-addresses" aria-labelledby="tab-addresses" className="grid gap-4 md:grid-cols-2">
            {addressesLoading ? (
              [...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
            ) : !addresses || addresses.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-[rgb(228,231,236)] py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <MarkerPin01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
                <p className="text-sm text-[rgb(152,162,179)]">No addresses on file.</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-xl border border-[rgb(228,231,236)] p-4 flex gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <MarkerPin01 className="h-5 w-5 text-[rgb(255,109,67)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[rgb(16,24,40)] text-sm">{addr.label}</p>
                    <p className="text-sm text-[rgb(102,112,133)] mt-0.5">{addr.full_address}</p>
                    {addr.phone && <p className="text-xs text-[rgb(102,112,133)] mt-1">{addr.phone}</p>}
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)] capitalize">{addr.type}</span>
                      {addr.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]">Default</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
