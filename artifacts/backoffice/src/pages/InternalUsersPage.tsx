import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListInternalUsers,
  useInviteInternalUser,
  useSuspendUser,
  useReactivateUser,
  getListInternalUsersQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserPlus01, DotsHorizontal } from "@untitledui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(["admin", "ops", "finance", "cs"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;
type StatusFilter = "all" | "active" | "suspended";

const ROLE_PILL: Record<string, string> = {
  admin: "bg-[rgb(245,243,255)] text-[rgb(105,65,198)] border-[rgb(214,205,254)]",
  ops: "bg-[rgb(239,248,255)] text-[rgb(21,112,239)] border-[rgb(209,236,255)]",
  finance: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]",
  cs: "bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]",
};
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  ops: "Operations",
  finance: "Finance",
  cs: "Customer Support",
};

const STATUS_PILL: Record<string, string> = {
  active: "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]",
  suspended: "bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]",
};

export default function InternalUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: users, isLoading } = useListInternalUsers();
  const inviteMutation = useInviteInternalUser();
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", full_name: "", role: "ops" },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListInternalUsersQueryKey() });

  const onSubmit = (values: InviteFormValues) => {
    inviteMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Invitation sent", description: `Invite emailed to ${values.email}.` });
          invalidate();
          form.reset();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not send invite", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleSuspend = (id: string, name: string) => {
    if (!confirm(`Suspend ${name}? They'll lose access immediately.`)) return;
    suspendMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User suspended" });
          invalidate();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not suspend", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleReactivate = (id: string, name: string) => {
    reactivateMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: `${name} reactivated` });
          invalidate();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not reactivate", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const filteredUsers = useMemo(() => {
    const list = users ?? [];
    if (statusFilter === "all") return list;
    if (statusFilter === "suspended") return list.filter((u) => u.status === "suspended");
    return list.filter((u) => u.status !== "suspended");
  }, [users, statusFilter]);

  const counts = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      active: list.filter((u) => u.status !== "suspended").length,
      suspended: list.filter((u) => u.status === "suspended").length,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Internal Team</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">
          Manage the people who run the platform — ops, finance, customer support, and admins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)] flex items-center gap-2">
              <UserPlus01 className="h-4 w-4" /> Invite team member
            </h2>
            <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">Send an activation link to a new staff account.</p>
          </div>
          <div className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="invite-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@mwrd.com" {...field} data-testid="invite-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} placeholder="Select a role">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="ops">Operations</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="cs">Customer Support</SelectItem>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={inviteMutation.isPending}
                  data-testid="button-invite"
                >
                  {inviteMutation.isPending ? "Sending…" : "Send invitation"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)] gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Team members ({counts.total})</h2>
            <div className="flex gap-1 bg-[rgb(249,250,251)] rounded-lg p-1 border border-[rgb(228,231,236)]">
              {(
                [
                  { id: "all", label: "All", count: counts.total },
                  { id: "active", label: "Active", count: counts.active },
                  { id: "suspended", label: "Suspended", count: counts.suspended },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  data-testid={`filter-${f.id}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === f.id
                      ? "bg-white text-[rgb(16,24,40)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
                  }`}
                >
                  {f.label}
                  <span className="ml-1 text-[rgb(152,162,179)]">({f.count})</span>
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-[rgb(152,162,179)]">
              {statusFilter === "all" ? "No team members yet." : `No ${statusFilter} team members.`}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {filteredUsers.map((user) => {
                  const isSuspended = user.status === "suspended";
                  const rolePill = ROLE_PILL[user.role] ?? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]";
                  const statusPill = STATUS_PILL[isSuspended ? "suspended" : "active"];
                  return (
                    <tr key={user.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[rgb(16,24,40)]">{user.real_name}</div>
                        <div className="text-xs text-[rgb(102,112,133)] mt-0.5">{user.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${rolePill}`}>
                          {ROLE_LABEL[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusPill}`}>
                          {isSuspended ? "suspended" : "active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[rgb(102,112,133)] hidden md:table-cell">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("en-SA", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[rgb(102,112,133)] hover:bg-[rgb(242,244,247)] transition-colors"
                              data-testid={`row-actions-${user.id}`}
                            >
                              <DotsHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isSuspended ? (
                              <DropdownMenuItem
                                onSelect={() => handleReactivate(user.id, user.real_name)}
                                disabled={reactivateMutation.isPending}
                              >
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-[rgb(217,45,32)]"
                                onSelect={() => handleSuspend(user.id, user.real_name)}
                                disabled={suspendMutation.isPending}
                              >
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
