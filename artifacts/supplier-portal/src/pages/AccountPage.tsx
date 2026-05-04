import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useGetMe,
  useListAddresses,
  useListCategories,
  useCompleteOnboarding,
  getGetMeQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building02, MarkerPin01, Tag01 } from "@untitledui/icons";

type Tab = "company" | "categories" | "addresses";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "company", label: "Company Info", icon: Building02 },
  { id: "categories", label: "Categories", icon: Tag01 },
  { id: "addresses", label: "Addresses", icon: MarkerPin01 },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("company");
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ company: null, categories: null, addresses: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: addresses, isLoading: addressesLoading } = useListAddresses();
  const { data: categoriesList, isLoading: categoriesLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });
  const updateOnboarding = useCompleteOnboarding();

  const rootCategories = useMemo(
    () => (categoriesList ?? []).filter((c) => !c.parent_id),
    [categoriesList],
  );

  const initialCategories = useMemo(
    () => new Set(user?.company?.categories_served ?? []),
    [user?.company?.categories_served],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(initialCategories);
  const [dirty, setDirty] = useState(false);

  // Re-seed when /me refetches (e.g. after a save). Drop the dirty flag too
  // so the Save button collapses back into a clean state.
  useEffect(() => {
    setSelectedCategoryIds(new Set(user?.company?.categories_served ?? []));
    setDirty(false);
  }, [user?.company?.categories_served]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  };

  const saveCategories = () => {
    if (selectedCategoryIds.size === 0) {
      toast({
        variant: "destructive",
        title: "Pick at least one category",
        description: "We use this to route matching RFQs your way.",
      });
      return;
    }
    updateOnboarding.mutate(
      { data: { categories_served: [...selectedCategoryIds] } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Categories updated" });
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not save", description: err?.message ?? "Please try again." }),
      },
    );
  };

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

        {activeTab === "categories" && (
          <div role="tabpanel" id="panel-categories" aria-labelledby="tab-categories" className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Categories you serve</h2>
                <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">
                  Pick all that apply — we route matching RFQs to suppliers serving the right categories.
                </p>
              </div>
              {dirty && (
                <Button
                  type="button"
                  size="sm"
                  onClick={saveCategories}
                  disabled={updateOnboarding.isPending}
                  data-testid="save-categories"
                >
                  {updateOnboarding.isPending ? "Saving…" : "Save changes"}
                </Button>
              )}
            </div>
            {categoriesLoading ? (
              <div className="grid grid-cols-2 gap-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
            ) : rootCategories.length === 0 ? (
              <p className="text-sm text-[rgb(152,162,179)] py-6 text-center">No categories available yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {rootCategories.map((cat) => {
                    const checked = selectedCategoryIds.has(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                          checked
                            ? "bg-[rgb(255,109,67)]/10 border-[rgb(255,109,67)] text-[rgb(194,84,28)]"
                            : "bg-white border-[rgb(228,231,236)] text-[rgb(52,64,84)] hover:border-[rgb(208,213,221)]"
                        }`}
                        data-testid={`account-cat-${cat.slug}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(cat.id)}
                          className="h-4 w-4 rounded border-[rgb(208,213,221)] text-[rgb(255,109,67)] focus:ring-[rgb(255,109,67)]"
                        />
                        <span className="truncate">{cat.name_en}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-[rgb(152,162,179)]">
                  Selected: <span className="font-medium text-[rgb(52,64,84)]">{selectedCategoryIds.size}</span> of {rootCategories.length}
                </p>
              </>
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
