import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useListSuppliers,
  useSuspendUser,
  useReactivateUser,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Power01, Power02, Building02, Plus } from "@untitledui/icons";
import { CreateAccountDialog } from "@/components/CreateAccountDialog";
import { UserDetailDrawer } from "@/components/UserDetailDrawer";

export default function SuppliersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const { data: suppliers, isLoading } = useListSuppliers();
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();

  const rows = suppliers?.data ?? [];

  const handleSuspend = (userId: string) => {
    suspendMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "Supplier suspended" });
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleReactivate = (userId: string) => {
    reactivateMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "Supplier reactivated" });
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Suppliers</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">All registered supplier users</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
          data-testid="button-add-supplier"
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Building02 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No suppliers registered yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-[rgb(249,250,251)] transition-colors cursor-pointer"
                  onClick={() => setOpenUserId(supplier.id)}
                  data-testid={`row-supplier-${supplier.id}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[rgb(16,24,40)]">{supplier.real_name}</div>
                    <div className="text-xs text-[rgb(102,112,133)] mt-0.5">{supplier.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                      supplier.status === "active"
                        ? "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]"
                        : "bg-[rgb(255,243,242)] text-[rgb(217,45,32)] border-[rgb(255,196,191)]"
                    }`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    {supplier.status === "active" ? (
                      <button
                        onClick={() => handleSuspend(supplier.id)}
                        disabled={suspendMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgb(228,231,236)] text-[rgb(102,112,133)] hover:border-[rgb(217,45,32)] hover:text-[rgb(217,45,32)] transition-colors disabled:opacity-50"
                        data-testid={`button-suspend-${supplier.id}`}
                      >
                        <Power02 className="h-3.5 w-3.5" /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(supplier.id)}
                        disabled={reactivateMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border border-[rgb(167,243,208)] hover:bg-[rgb(209,250,229)] transition-colors disabled:opacity-50"
                        data-testid={`button-reactivate-${supplier.id}`}
                      >
                        <Power01 className="h-3.5 w-3.5" /> Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} accountType="supplier" />
      <UserDetailDrawer userId={openUserId} accountType="supplier" onOpenChange={(o) => !o && setOpenUserId(null)} />
    </div>
  );
}
