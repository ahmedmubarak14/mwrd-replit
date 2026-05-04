import { useState, useMemo, type ReactNode, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCompanyMembers,
  getListCompanyMembersQueryKey,
  useListCompanyRoles,
  getListCompanyRolesQueryKey,
  useListApprovalTree,
  getListApprovalTreeQueryKey,
  useListAddresses,
  getListAddressesQueryKey,
  useGetMe,
  getGetMeQueryKey,
  useInviteCompanyMember,
  useCreateCompanyRole,
  useCreateAddress,
  useSetApprover,
} from "@workspace/api-client-react";
import type { ApprovalNode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users01,
  UsersPlus,
  Shield01,
  GitBranch01,
  MarkerPin01,
  CreditCard01,
  X,
  ArrowRight,
  Copy01,
} from "@untitledui/icons";

type Tab = "users" | "roles" | "user-groups" | "approval-tree" | "addresses" | "billing";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "users", label: "Users", icon: Users01 },
  { id: "roles", label: "Roles", icon: Shield01 },
  { id: "user-groups", label: "User Groups", icon: UsersPlus },
  { id: "approval-tree", label: "Approval Tree", icon: GitBranch01 },
  { id: "addresses", label: "Addresses", icon: MarkerPin01 },
  { id: "billing", label: "Billing Details", icon: CreditCard01 },
];

const PERMISSION_OPTIONS = [
  { value: "create_rfq", label: "Create RFQs" },
  { value: "approve_orders", label: "Approve orders" },
  { value: "manage_members", label: "Manage members" },
  { value: "manage_addresses", label: "Manage addresses" },
  { value: "view_reports", label: "View reports" },
];

// Inlined client-side chain compute. Mirrors lib/mwrd-shared/utils/approval-chain.
function computeChain(nodes: ApprovalNode[], startUserId: string): string[] {
  const chain: string[] = [];
  const byMember = new Map(nodes.map((n) => [n.member_user_id, n]));
  let current = startUserId;
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current)) break;
    seen.add(current);
    const node = byMember.get(current);
    if (!node || !node.direct_approver_user_id) break;
    chain.push(node.direct_approver_user_id);
    current = node.direct_approver_user_id;
  }
  return chain;
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(16,24,40)]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(16,24,40,0.15)] border border-[rgb(228,231,236)]">
        <div className="px-6 py-5 border-b border-[rgb(242,244,247)] flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[rgb(16,24,40)]">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[rgb(152,162,179)] hover:text-[rgb(52,64,84)] hover:bg-[rgb(249,250,251)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1.5">
        {label} {required && <span className="text-[rgb(217,45,32)]">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "block w-full rounded-lg border border-[rgb(228,231,236)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]";

function tabFromPath(pathname: string): Tab {
  const m = pathname.match(/\/account\/?(users|roles|user-groups|approval-tree|addresses|billing)?/);
  const slug = m?.[1];
  if (
    slug === "roles" ||
    slug === "user-groups" ||
    slug === "approval-tree" ||
    slug === "addresses" ||
    slug === "billing"
  ) return slug;
  return "users";
}

export default function AccountPage() {
  const [location] = useLocation();
  const activeTab = tabFromPath(location);
  const [openModal, setOpenModal] = useState<null | "invite" | "role" | "approval" | "address">(null);
  const [addressDefaultType, setAddressDefaultType] = useState<"delivery" | "billing">("delivery");
  const [addressFilter, setAddressFilter] = useState<"delivery" | "billing">("delivery");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useGetMe({
    query: { enabled: activeTab === "billing", queryKey: getGetMeQueryKey() },
  });

  const { data: members, isLoading: membersLoading } = useListCompanyMembers({
    query: { enabled: activeTab === "users" || activeTab === "approval-tree" || activeTab === "user-groups", queryKey: getListCompanyMembersQueryKey() },
  });

  const { data: roles, isLoading: rolesLoading } = useListCompanyRoles({
    query: { enabled: activeTab === "roles" || activeTab === "users" || activeTab === "user-groups", queryKey: getListCompanyRolesQueryKey() },
  });

  const { data: approvalTree, isLoading: approvalLoading } = useListApprovalTree({
    query: { enabled: activeTab === "approval-tree", queryKey: getListApprovalTreeQueryKey() },
  });

  const { data: addresses, isLoading: addressesLoading } = useListAddresses({}, {
    query: { enabled: activeTab === "addresses", queryKey: getListAddressesQueryKey({}) },
  });

  const inviteMember = useInviteCompanyMember();
  const createRole = useCreateCompanyRole();
  const createAddress = useCreateAddress();
  const setApprover = useSetApprover();

  const filteredAddresses = useMemo(
    () => (addresses ?? []).filter((a) => a.type === addressFilter),
    [addresses, addressFilter],
  );

  const handleInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const role_id = String(fd.get("role_id") || "").trim();
    if (!email || !role_id) {
      toast({ variant: "destructive", title: "Missing fields", description: "Email and role are required." });
      return;
    }
    inviteMember.mutate(
      { data: { email, role_id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCompanyMembersQueryKey() });
          toast({ title: "Invitation sent", description: `Invite emailed to ${email}.` });
          setOpenModal(null);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not send invite", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleCreateRole = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const permissions = fd.getAll("permissions").map(String);
    if (!name) {
      toast({ variant: "destructive", title: "Missing role name" });
      return;
    }
    createRole.mutate(
      { data: { name, permissions } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCompanyRolesQueryKey() });
          toast({ title: "Role created", description: `"${name}" is ready to assign.` });
          setOpenModal(null);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not create role", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleAddAddress = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      type: String(fd.get("type") || "delivery"),
      label: String(fd.get("label") || "").trim(),
      full_address: String(fd.get("full_address") || "").trim(),
      phone: String(fd.get("phone") || "").trim() || undefined,
      national_address_code: String(fd.get("national_address_code") || "").trim() || undefined,
      address_code: String(fd.get("address_code") || "").trim() || undefined,
    };
    if (!data.label || !data.full_address) {
      toast({ variant: "destructive", title: "Missing fields", description: "Label and address are required." });
      return;
    }
    createAddress.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAddressesQueryKey({}) });
          toast({ title: "Address added" });
          setOpenModal(null);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not save address", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleSetApprover = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const member_user_id = String(fd.get("member_user_id") || "").trim();
    const approver_user_id = String(fd.get("approver_user_id") || "").trim() || null;
    if (!member_user_id) {
      toast({ variant: "destructive", title: "Pick a member" });
      return;
    }
    setApprover.mutate(
      { data: { member_user_id, approver_user_id } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApprovalTreeQueryKey() });
          toast({ title: "Approval level updated" });
          setOpenModal(null);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not update approval", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ variant: "destructive", title: "Could not copy" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Account Management</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage your company users, roles, approval workflow, and billing</p>
      </div>

      <div className="flex gap-1 border-b border-[rgb(228,231,236)] overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/account/${tab.id}`}
              data-testid={`tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[rgb(255,109,67)] text-[rgb(255,109,67)]"
                  : "border-transparent text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Users */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Company Users</h2>
            <Button size="sm" className="gap-2" onClick={() => setOpenModal("invite")} data-testid="open-invite-user">
              <Plus className="h-4 w-4" /> Invite User
            </Button>
          </div>
          {membersLoading ? (
            <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">User ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {(members ?? []).map((m) => (
                  <tr key={m.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">{m.user_id}</td>
                    <td className="px-5 py-3.5 text-[rgb(102,112,133)]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">
                        {(roles ?? []).find((r) => r.id === m.company_role_id)?.name ?? (m.company_role_id ? "Member" : "Owner")}
                      </span>
                    </td>
                  </tr>
                ))}
                {!membersLoading && (members ?? []).length === 0 && (
                  <tr><td colSpan={2} className="px-5 py-10 text-center text-sm text-[rgb(152,162,179)]">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Roles */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Roles & Permissions</h2>
            <Button size="sm" className="gap-2" onClick={() => setOpenModal("role")} data-testid="open-create-role">
              <Plus className="h-4 w-4" /> Add New Role
            </Button>
          </div>
          {rolesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(roles ?? []).map((role) => {
                const memberCount = (members ?? []).filter((m) => m.company_role_id === role.id).length;
                return (
                  <div key={role.id} className="bg-white rounded-xl border border-[rgb(228,231,236)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                    <p className="font-semibold text-[rgb(16,24,40)]">{role.name}</p>
                    <p className="mt-1 text-xs text-[rgb(102,112,133)]">{memberCount} {memberCount === 1 ? "user" : "users"}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(role.permissions ?? []).slice(0, 4).map((p, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">{p}</span>
                      ))}
                      {(role.permissions?.length ?? 0) > 4 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">+{role.permissions!.length - 4} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {(roles ?? []).length === 0 && (
                <p className="col-span-full text-sm text-[rgb(152,162,179)] text-center py-8">No roles defined yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Groups — view-only grouping by role */}
      {activeTab === "user-groups" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">User Groups</h2>
              <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">
                Users grouped by role. Edit memberships under <Link href="/account/users" className="text-[rgb(255,109,67)] hover:underline">Users</Link>.
              </p>
            </div>
          </div>
          {membersLoading || rolesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(roles ?? []).map((role) => {
                const groupMembers = (members ?? []).filter((m) => m.company_role_id === role.id);
                return (
                  <div key={role.id} className="bg-white rounded-xl border border-[rgb(228,231,236)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[rgb(16,24,40)]">{role.name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">
                        {groupMembers.length} {groupMembers.length === 1 ? "user" : "users"}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 flex-1">
                      {groupMembers.length === 0 ? (
                        <li className="text-xs text-[rgb(152,162,179)] italic">No users in this group yet.</li>
                      ) : (
                        groupMembers.slice(0, 8).map((m) => (
                          <li key={m.id} className="text-sm text-[rgb(52,64,84)] truncate" data-testid={`user-group-member-${m.id}`}>
                            {m.user_id}
                          </li>
                        ))
                      )}
                      {groupMembers.length > 8 && (
                        <li className="text-xs text-[rgb(152,162,179)]">+{groupMembers.length - 8} more</li>
                      )}
                    </ul>
                    {(role.permissions?.length ?? 0) > 0 && (
                      <div className="mt-3 pt-3 border-t border-[rgb(242,244,247)] flex flex-wrap gap-1">
                        {role.permissions!.slice(0, 4).map((p, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">{p}</span>
                        ))}
                        {(role.permissions!.length ?? 0) > 4 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">+{role.permissions!.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(roles ?? []).length === 0 && (
                <p className="col-span-full text-sm text-[rgb(152,162,179)] text-center py-8">
                  No roles defined yet. Create one under Roles to start grouping users.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approval Tree */}
      {activeTab === "approval-tree" && (
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Order Approval Workflow</h2>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpenModal("approval")} data-testid="open-add-approval">
              <Plus className="h-4 w-4" /> Choose Approver
            </Button>
          </div>
          {approvalLoading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (members ?? []).length === 0 ? (
            <p className="text-sm text-[rgb(152,162,179)] text-center py-10">Invite a user first to set up the approval tree.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Assigned User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Direct Approver</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Chain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {(members ?? []).map((m) => {
                  const node = (approvalTree ?? []).find((n) => n.member_user_id === m.user_id);
                  const directApprover = node?.direct_approver_user_id ?? null;
                  const chain = computeChain(approvalTree ?? [], m.user_id);
                  return (
                    <tr key={m.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[rgb(16,24,40)]">{m.user_id}</td>
                      <td className="px-5 py-3.5 text-[rgb(102,112,133)]">
                        {directApprover ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]">{directApprover}</span>
                        ) : (
                          <span className="text-xs text-[rgb(152,162,179)] italic">Top of tree</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {chain.length === 0 ? (
                          <span className="text-xs text-[rgb(152,162,179)] italic">No chain</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(52,64,84)] border-[rgb(228,231,236)]">{m.user_id}</span>
                            {chain.map((approver, idx) => (
                              <span key={idx} className="flex items-center gap-1.5">
                                <ArrowRight className="h-3 w-3 text-[rgb(152,162,179)]" />
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(255,247,237)] text-[rgb(194,84,28)] border-[rgb(254,215,170)]">{approver}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-[rgb(249,250,251)] rounded-lg p-1 border border-[rgb(228,231,236)]">
              {(["delivery", "billing"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAddressFilter(t)}
                  data-testid={`address-subtab-${t}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    addressFilter === t
                      ? "bg-white text-[rgb(16,24,40)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
                  }`}
                >
                  {t} Addresses
                </button>
              ))}
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setAddressDefaultType(addressFilter);
                setOpenModal("address");
              }}
              data-testid="open-add-address"
            >
              <Plus className="h-4 w-4" /> Add {addressFilter === "delivery" ? "Delivery" : "Billing"} Address
            </Button>
          </div>
          {addressesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAddresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-xl border border-[rgb(228,231,236)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex gap-3">
                    <MarkerPin01 className="h-5 w-5 text-[rgb(255,109,67)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[rgb(16,24,40)] text-sm">{addr.label}</p>
                      <p className="text-sm text-[rgb(102,112,133)] mt-0.5">{addr.full_address}</p>
                      {addr.phone && (
                        <p className="text-xs text-[rgb(102,112,133)] mt-1">{addr.phone}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        {addr.national_address_code && (
                          <p className="text-xs text-[rgb(102,112,133)]">
                            <span className="font-medium text-[rgb(52,64,84)]">National Code:</span> {addr.national_address_code}
                          </p>
                        )}
                        {addr.address_code && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(addr.address_code!, "Address code")}
                            className="inline-flex items-center gap-1.5 text-xs text-[rgb(102,112,133)] hover:text-[rgb(255,109,67)] transition-colors"
                          >
                            <span className="font-medium text-[rgb(52,64,84)]">Code:</span>
                            <code className="px-1.5 py-0.5 bg-[rgb(249,250,251)] border border-[rgb(228,231,236)] rounded text-[11px]">{addr.address_code}</code>
                            <Copy01 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)] capitalize">{addr.type}</span>
                        {addr.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]">Default</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAddresses.length === 0 && (
                <p className="col-span-full text-sm text-[rgb(152,162,179)] text-center py-8">No {addressFilter} addresses saved yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Billing Details */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
              <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Tax & Legal Information</h2>
              <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">
                These details appear on your invoices. Updates are handled through KYC review.
              </p>
            </div>
            {!me?.company ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : (
              <dl className="divide-y divide-[rgb(242,244,247)]">
                {[
                  { label: "Legal Company Name", value: me.company.real_name },
                  { label: "Commercial Registration (CR)", value: me.company.cr_number || "—" },
                  { label: "VAT Registration Number", value: me.company.vat_number || "—" },
                  { label: "Company Type", value: me.company.type },
                  { label: "Subscription Tier", value: me.company.subscription_tier ?? "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                    <dt className="text-sm text-[rgb(102,112,133)]">{row.label}</dt>
                    <dd className="text-sm font-medium text-[rgb(16,24,40)]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <p className="text-xs text-[rgb(152,162,179)]">
            Manage billing addresses under <Link href="/account/addresses" className="text-[rgb(255,109,67)] hover:underline">Addresses</Link>.
          </p>
        </div>
      )}

      {/* Invite User modal */}
      <Modal
        open={openModal === "invite"}
        onClose={() => setOpenModal(null)}
        title="Invite User"
        description="Send an invitation to join your company workspace."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Field label="Work email" required>
            <input name="email" type="email" required placeholder="teammate@company.com" className={inputCls} data-testid="invite-email" />
          </Field>
          <Field label="Role" required>
            <select name="role_id" required className={inputCls} defaultValue="" data-testid="invite-role">
              <option value="" disabled>Select a role</option>
              {(roles ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          {(roles ?? []).length === 0 && (
            <p className="text-xs text-[rgb(152,162,179)]">Create a role first under the Roles tab.</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenModal(null)}>Cancel</Button>
            <Button type="submit" disabled={inviteMember.isPending} data-testid="invite-submit">
              {inviteMember.isPending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Role modal */}
      <Modal
        open={openModal === "role"}
        onClose={() => setOpenModal(null)}
        title="Add New Role"
        description="Define a role and choose what its users can do."
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <Field label="Role name" required>
            <input name="name" type="text" required placeholder="e.g. Procurement Manager" className={inputCls} data-testid="role-name" />
          </Field>
          <div>
            <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-2">Permissions</span>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-[rgb(52,64,84)]">
                  <input type="checkbox" name="permissions" value={opt.value} className="h-4 w-4 rounded border-[rgb(208,213,221)] text-[rgb(255,109,67)] focus:ring-[rgb(255,109,67)]" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenModal(null)}>Cancel</Button>
            <Button type="submit" disabled={createRole.isPending} data-testid="role-submit">
              {createRole.isPending ? "Creating…" : "Create role"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Address modal */}
      <Modal
        open={openModal === "address"}
        onClose={() => setOpenModal(null)}
        title={`Add ${addressDefaultType === "delivery" ? "Delivery" : "Billing"} Address`}
        description="Save an address for orders and invoices."
      >
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Field label="Type" required>
            <select name="type" required className={inputCls} defaultValue={addressDefaultType} data-testid="address-type">
              <option value="delivery">Delivery</option>
              <option value="billing">Billing</option>
            </select>
          </Field>
          <Field label="Label" required>
            <input name="label" type="text" required placeholder="e.g. HQ Riyadh" className={inputCls} data-testid="address-label" />
          </Field>
          <Field label="Full address" required>
            <textarea name="full_address" required rows={3} placeholder="Street, district, city, postal code" className={inputCls} data-testid="address-full" />
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" placeholder="+966 5X XXX XXXX" className={inputCls} data-testid="address-phone" />
          </Field>
          <Field label="National address code">
            <input name="national_address_code" type="text" placeholder="e.g. RHOA2758" className={inputCls} data-testid="address-national" />
          </Field>
          <Field label="Address code">
            <input name="address_code" type="text" placeholder="e.g. add-45553-Main" className={inputCls} data-testid="address-code" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenModal(null)}>Cancel</Button>
            <Button type="submit" disabled={createAddress.isPending} data-testid="address-submit">
              {createAddress.isPending ? "Saving…" : "Save address"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Approval Level modal */}
      <Modal
        open={openModal === "approval"}
        onClose={() => setOpenModal(null)}
        title="Choose Approver"
        description="Set who must approve another user's orders."
      >
        <form onSubmit={handleSetApprover} className="space-y-4">
          <Field label="User" required>
            <select name="member_user_id" required className={inputCls} defaultValue="" data-testid="approval-member">
              <option value="" disabled>Choose a user</option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.user_id}>{m.user_id}</option>
              ))}
            </select>
          </Field>
          <Field label="Direct approver">
            <select name="approver_user_id" className={inputCls} defaultValue="" data-testid="approval-approver">
              <option value="">No approver (top of tree)</option>
              {(members ?? []).map((m) => (
                <option key={m.id} value={m.user_id}>{m.user_id}</option>
              ))}
            </select>
          </Field>
          {(members ?? []).length === 0 && (
            <p className="text-xs text-[rgb(152,162,179)]">Invite a user first under the Users tab.</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenModal(null)}>Cancel</Button>
            <Button type="submit" disabled={setApprover.isPending} data-testid="approval-submit">
              {setApprover.isPending ? "Saving…" : "Save approval"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
