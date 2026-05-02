import { useToast } from "@/hooks/use-toast";
import {
  useListKycQueue,
  useApproveKYC,
  useRejectKYC,
  getListKycQueueQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { safeFormat } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Shield01 } from "@untitledui/icons";

export default function KycQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useListKycQueue();
  const approveMutation = useApproveKYC();
  const rejectMutation = useRejectKYC();

  const rows = queue?.data ?? [];

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ id: userId }, {
      onSuccess: () => {
        toast({ title: "KYC approved" });
        queryClient.invalidateQueries({ queryKey: getListKycQueueQueryKey() });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleReject = (userId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return;
    rejectMutation.mutate({ id: userId, data: { reason } }, {
      onSuccess: () => {
        toast({ title: "KYC rejected" });
        queryClient.invalidateQueries({ queryKey: getListKycQueueQueryKey() });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">KYC Queue</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Pending verification for new clients and suppliers</p>
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Shield01 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No pending KYC applications.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[rgb(16,24,40)]">{item.real_name}</div>
                    <div className="text-xs text-[rgb(102,112,133)] mt-0.5">{item.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)] capitalize">
                      {item.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden sm:table-cell">
                    {safeFormat(item.created_at, "MMM d, HH:mm")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={rejectMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgb(228,231,236)] text-[rgb(102,112,133)] hover:border-[rgb(217,45,32)] hover:text-[rgb(217,45,32)] transition-colors disabled:opacity-50"
                        data-testid={`button-reject-${item.id}`}
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border border-[rgb(167,243,208)] hover:bg-[rgb(209,250,229)] transition-colors disabled:opacity-50"
                        data-testid={`button-approve-${item.id}`}
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
    </div>
  );
}
