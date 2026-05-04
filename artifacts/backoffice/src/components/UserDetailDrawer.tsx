import { useQueryClient } from "@tanstack/react-query";
import {
  useGetBackofficeUserDetail,
  getGetBackofficeUserDetailQueryKey,
  useApproveKYC,
  useSuspendUser,
  useReactivateUser,
  getListClientsQueryKey,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  ShieldTick,
  Power01,
  Power02,
  Users01,
  Building01,
  ClockRewind,
} from "@untitledui/icons";

const STATUS_PILL: Record<string, string> = {
  active: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]",
  pending_callback: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
  callback_completed: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  pending_kyc: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
  suspended: "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]",
};

const ACCOUNT_TYPE_TO_LIST_KEY = {
  client: getListClientsQueryKey,
  supplier: getListSuppliersQueryKey,
} as const;

export type UserDetailDrawerProps = {
  userId: string | null;
  accountType: "client" | "supplier";
  onOpenChange: (open: boolean) => void;
};

export function UserDetailDrawer({ userId, accountType, onOpenChange }: UserDetailDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useGetBackofficeUserDetail(userId ?? "", {
    query: {
      enabled: Boolean(userId),
      queryKey: getGetBackofficeUserDetailQueryKey(userId ?? ""),
    },
  });

  const approveKyc = useApproveKYC();
  const suspend = useSuspendUser();
  const reactivate = useReactivateUser();

  const refresh = () => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: getGetBackofficeUserDetailQueryKey(userId) });
    queryClient.invalidateQueries({ queryKey: ACCOUNT_TYPE_TO_LIST_KEY[accountType]() });
  };

  const handleMarkKyc = () => {
    if (!userId) return;
    approveKyc.mutate(
      { id: userId },
      {
        onSuccess: () => {
          toast({ title: "KYC marked verified", description: "Out-of-band KYC recorded." });
          refresh();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not mark KYC", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleSuspend = () => {
    if (!userId || !detail) return;
    if (!confirm(`Suspend ${detail.user.real_name}? They'll lose access immediately.`)) return;
    suspend.mutate(
      { id: userId },
      {
        onSuccess: () => {
          toast({ title: "User suspended" });
          refresh();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not suspend", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleReactivate = () => {
    if (!userId) return;
    reactivate.mutate(
      { id: userId },
      {
        onSuccess: () => {
          toast({ title: "User reactivated" });
          refresh();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not reactivate", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const open = Boolean(userId);
  const user = detail?.user;
  const company = detail?.company;
  const status = user?.status ?? "";
  const isSuspended = status === "suspended";
  const kycVerified = status === "active";

  return (
    <Sheet isOpen={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !detail ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle>{user!.real_name}</SheetTitle>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_PILL[status] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"}`}>
                  {status.replace(/_/g, " ")}
                </span>
              </div>
              <SheetDescription>
                {user!.email}
                {user!.phone ? ` · ${user!.phone}` : ""}
              </SheetDescription>
            </SheetHeader>

            {/* Quick actions */}
            <div className="flex gap-2 flex-wrap">
              {!kycVerified && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkKyc}
                  disabled={approveKyc.isPending}
                  data-testid="drawer-mark-kyc"
                >
                  <ShieldTick className="mr-1.5 h-3.5 w-3.5" />
                  {approveKyc.isPending ? "Marking…" : "Mark KYC verified"}
                </Button>
              )}
              {isSuspended ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReactivate}
                  disabled={reactivate.isPending}
                  data-testid="drawer-reactivate"
                >
                  <Power01 className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSuspend}
                  disabled={suspend.isPending}
                  className="border-[rgb(254,205,202)] text-[rgb(180,35,24)] hover:bg-[rgb(254,243,242)]"
                  data-testid="drawer-suspend"
                >
                  <Power02 className="mr-1.5 h-3.5 w-3.5" /> Suspend
                </Button>
              )}
            </div>

            {kycVerified && (
              <div className="rounded-lg border border-[rgb(167,243,208)] bg-[rgb(236,253,243)] p-3 flex items-center gap-2 text-[rgb(7,148,85)] text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>KYC verified out-of-band.</span>
              </div>
            )}

            {/* Profile */}
            <section>
              <h3 className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2">Profile</h3>
              <dl className="rounded-lg border border-[rgb(228,231,236)] divide-y divide-[rgb(242,244,247)] text-sm">
                {[
                  { label: "Real name", value: user!.real_name },
                  { label: "Platform alias", value: user!.platform_alias },
                  { label: "Role", value: user!.role },
                  { label: "Activation", value: user!.activation_status?.replace(/_/g, " ") ?? "—" },
                  { label: "Joined", value: user!.created_at ? new Date(user!.created_at).toLocaleDateString("en-SA", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-3 px-4 py-2.5">
                    <dt className="text-[rgb(102,112,133)]">{row.label}</dt>
                    <dd className="font-medium text-[rgb(16,24,40)] text-right capitalize">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Company */}
            {company && (
              <section>
                <h3 className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Building01 className="h-3.5 w-3.5" /> Company
                </h3>
                <dl className="rounded-lg border border-[rgb(228,231,236)] divide-y divide-[rgb(242,244,247)] text-sm">
                  {[
                    { label: "Real name", value: company.real_name },
                    { label: "Alias", value: company.platform_alias },
                    { label: "Type", value: company.type },
                    { label: "CR number", value: company.cr_number ?? "—" },
                    { label: "VAT number", value: company.vat_number ?? "—" },
                    { label: "Onboarding", value: company.onboarding_completed ? "Complete" : "Incomplete" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 px-4 py-2.5">
                      <dt className="text-[rgb(102,112,133)]">{row.label}</dt>
                      <dd className="font-medium text-[rgb(16,24,40)] text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {/* Members */}
            <section>
              <h3 className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Users01 className="h-3.5 w-3.5" /> Company users ({detail.members.length})
              </h3>
              {detail.members.length === 0 ? (
                <p className="text-xs text-[rgb(152,162,179)] italic">No additional users on this company yet.</p>
              ) : (
                <ul className="rounded-lg border border-[rgb(228,231,236)] divide-y divide-[rgb(242,244,247)] text-sm">
                  {detail.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="font-medium text-[rgb(16,24,40)] truncate">{m.user_id}</span>
                      <span className="text-xs text-[rgb(102,112,133)] truncate ml-2">{m.company_role_id || "Owner"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Audit log */}
            <section>
              <h3 className="text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ClockRewind className="h-3.5 w-3.5" /> Recent activity
              </h3>
              {detail.audit.length === 0 ? (
                <p className="text-xs text-[rgb(152,162,179)] italic">No audit log entries yet.</p>
              ) : (
                <ul className="rounded-lg border border-[rgb(228,231,236)] divide-y divide-[rgb(242,244,247)] text-sm">
                  {detail.audit.map((a) => (
                    <li key={a.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-[rgb(16,24,40)] text-xs uppercase tracking-wide">{a.action}</span>
                        <span className="text-[11px] text-[rgb(152,162,179)]">
                          {new Date(a.created_at).toLocaleString("en-SA", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[rgb(102,112,133)]">
                        {a.entity_type} · actor {a.actor_user_id}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
