import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminListProductRequests,
  useAdminApproveProductRequest,
  useAdminRejectProductRequest,
  useAdminListProducts,
  getAdminListProductRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, SearchMd, FilePlus02 } from "@untitledui/icons";

export default function ProductRequestsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [masterProductId, setMasterProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const { data: requests, isLoading } = useAdminListProductRequests();
  const { data: masterProducts } = useAdminListProducts({ search: productSearch });

  const approveMutation = useAdminApproveProductRequest();
  const rejectMutation = useAdminRejectProductRequest();

  const rows = requests?.data ?? [];

  const handleApprove = () => {
    if (!selectedRequest || !masterProductId) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      data: { master_product_id: masterProductId } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Product request approved and mapped" });
        queryClient.invalidateQueries({ queryKey: getAdminListProductRequestsQueryKey() });
        setSelectedRequest(null);
        setMasterProductId("");
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleReject = (requestId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    rejectMutation.mutate({ id: requestId, data: { reason } }, {
      onSuccess: () => {
        toast({ title: "Product request rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminListProductRequestsQueryKey() });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Product Requests</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Review and map new product additions (PAR) from suppliers</p>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <FilePlus02 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No pending product requests.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Supplier</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Proposed Product</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((req) => (
                <tr key={req.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] font-mono text-xs">{req.supplier_company_id}</td>
                  <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">{req.proposed_name_en}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgb(228,231,236)] text-[rgb(102,112,133)] hover:border-[rgb(217,45,32)] hover:text-[rgb(217,45,32)] transition-colors disabled:opacity-50"
                        data-testid={`button-reject-${req.id}`}
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border border-[rgb(167,243,208)] hover:bg-[rgb(209,250,229)] transition-colors"
                        data-testid={`button-approve-${req.id}`}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Product Request</DialogTitle>
            <DialogDescription>
              Map the proposed product "{selectedRequest?.proposed_name_en}" to a Master Product.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[rgb(52,64,84)]">Search Master Product</label>
              <div className="relative">
                <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type to search catalog…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[rgb(228,231,236)] bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20 focus:border-[rgb(255,109,67)]"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-auto rounded-lg border border-[rgb(228,231,236)] bg-white">
              {(masterProducts?.data ?? []).length === 0 ? (
                <p className="text-sm text-[rgb(152,162,179)] text-center py-8">No matching products.</p>
              ) : (
                <ul className="divide-y divide-[rgb(242,244,247)]">
                  {masterProducts?.data?.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => setMasterProductId(p.id)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        masterProductId === p.id
                          ? "bg-[rgb(255,250,247)] border-l-2 border-[rgb(255,109,67)]"
                          : "hover:bg-[rgb(249,250,251)]"
                      }`}
                    >
                      <div className="font-medium text-sm text-[rgb(16,24,40)]">{p.name_en}</div>
                      <div className="text-xs text-[rgb(102,112,133)] font-mono mt-0.5">{p.master_product_code}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button
              onClick={handleApprove}
              disabled={!masterProductId || approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Approving…" : "Approve & Map"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
