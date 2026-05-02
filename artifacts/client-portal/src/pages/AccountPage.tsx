import { useState, type ReactNode, type FormEvent } from "react";
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
  useInviteCompanyMember,
  useCreateCompanyRole,
  useCreateAddress,
  useSetApprover,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users01, Shield01, GitBranch01, MarkerPin01, X } from "@untitledui/icons";

type Tab = "members" | "roles" | "approval" | "addresses";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "members", label: "Members", icon: Users01 },
  { id: "roles", label: "Roles", icon: Shield01 },
  { id: "approval", label: "Approval Tree", icon: GitBranch01 },
  { id: "addresses", label: "Addresses", icon: MarkerPin01 },
];

const PERMISSION_OPTIONS = [
  { value: "create_rfq", label: "Create RFQs" },
  { value: "approve_orders", label: "Approve orders" },
  { value: "manage_members", label: "Manage members" },
  { value: "manage_addresses", label: "Manage addresses" },
  { value: "view_reports", label: "View reports" },
];

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

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [openModal, setOpenModal] = useState<null | "invite" | "role" | "approval" | "address">(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: members, isLoading: membersLoading } = useListCompanyMembers({
    query: { enabled: activeTab === "members" || activeTab === "approval", queryKey: getListCompanyMembersQueryKey() },
  });

  const { data: roles, isLoading: rolesLoading } = useListCompanyRoles({
    query: { enabled: activeTab === "roles" || activeTab === "members", queryKey: getListCompanyRolesQueryKey() },
  });

  const { data: approvalTree, isLoading: approvalLoading } = useListApprovalTree({
    query: { enabled: activeTab === "approval", queryKey: getListApprovalTreeQueryKey() },
  });

  const { data: addresses, isLoading: addressesLoading } = useListAddresses({}, {
    query: { enabled: activeTab === "addresses", queryKey: getListAddressesQueryKey({}) },
  });

  const inviteMember = useInviteCompanyMember();
  const createRole = useCreateCompanyRole();
  const createAddress = useCreateAddress();
  const setApprover = useSetApprover();

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
      national_address_code: String(fd.get("national_address_code") || "").trim() || undefined,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Account Settings</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage your company members, roles, and preferences</p>
      </div>

      <div className="flex gap-1 border-b border-[rgb(228,231,236)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
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

      {/* Members */}
      {activeTab === "members" && (
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Company Members</h2>
            <Button size="sm" className="gap-2" onClick={() => setOpenModal("invite")} data-testid="open-invite-member">
              <Plus className="h-4 w-4" /> Invite Member
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
                  <tr><td colSpan={2} className="px-5 py-10 text-center text-sm text-[rgb(152,162,179)]">No members yet.</td></tr>
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
              <Plus className="h-4 w-4" /> Create Role
            </Button>
          </div>
          {rolesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(roles ?? []).map((role) => (
                <div key={role.id} className="bg-white rounded-xl border border-[rgb(228,231,236)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <p className="font-semibold text-[rgb(16,24,40)]">{role.name}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(role.permissions ?? []).slice(0, 4).map((p, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">{p}</span>
                    ))}
                    {(role.permissions?.length ?? 0) > 4 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">+{role.permissions!.length - 4} more</span>
                    )}
                  </div>
                </div>
              ))}
              {(roles ?? []).length === 0 && (
                <p className="col-span-full text-sm text-[rgb(152,162,179)] text-center py-8">No roles defined yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approval Tree */}
      {activeTab === "approval" && (
        <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)] mb-4">Order Approval Workflow</h2>
          {approvalLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              {(approvalTree ?? []).map((node, i) => (
                <div key={node.id} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-[rgb(255,109,67)]/10 flex items-center justify-center font-bold text-[rgb(255,109,67)] text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 p-3 border border-[rgb(228,231,236)] rounded-lg bg-[rgb(249,250,251)]">
                    <p className="text-sm font-semibold text-[rgb(16,24,40)]">{node.member_user_id}</p>
                    {node.direct_approver_user_id && (
                      <p className="text-xs text-[rgb(102,112,133)]">Approver: {node.direct_approver_user_id}</p>
                    )}
                  </div>
                </div>
              ))}
              {(approvalTree ?? []).length === 0 && (
                <p className="text-sm text-[rgb(152,162,179)] text-center py-8">No approval levels configured.</p>
              )}
              <Button variant="outline" className="w-full border-dashed mt-2" onClick={() => setOpenModal("approval")} data-testid="open-add-approval">
                <Plus className="mr-2 h-4 w-4" /> Add Approval Level
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Delivery Addresses</h2>
            <Button size="sm" className="gap-2" onClick={() => setOpenModal("address")} data-testid="open-add-address">
              <Plus className="h-4 w-4" /> Add Address
            </Button>
          </div>
          {addressesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(addresses ?? []).map((addr) => (
                <div key={addr.id} className="bg-white rounded-xl border border-[rgb(228,231,236)] p-4 flex gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <MarkerPin01 className="h-5 w-5 text-[rgb(255,109,67)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[rgb(16,24,40)] text-sm">{addr.label}</p>
                    <p className="text-sm text-[rgb(102,112,133)] mt-0.5">{addr.full_address}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)] capitalize">{addr.type}</span>
                      {addr.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]">Default</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(addresses ?? []).length === 0 && (
                <p className="col-span-full text-sm text-[rgb(152,162,179)] text-center py-8">No addresses saved yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invite Member modal */}
      <Modal
        open={openModal === "invite"}
        onClose={() => setOpenModal(null)}
        title="Invite Member"
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
        title="Create Role"
        description="Define a role and choose what its members can do."
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
        title="Add Address"
        description="Save a delivery or billing address for orders."
      >
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Field label="Type" required>
            <select name="type" required className={inputCls} defaultValue="delivery" data-testid="address-type">
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
          <Field label="National address code">
            <input name="national_address_code" type="text" placeholder="Optional" className={inputCls} />
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
        title="Add Approval Level"
        description="Set who must approve another member's orders."
      >
        <form onSubmit={handleSetApprover} className="space-y-4">
          <Field label="Member" required>
            <select name="member_user_id" required className={inputCls} defaultValue="" data-testid="approval-member">
              <option value="" disabled>Choose a member</option>
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
            <p className="text-xs text-[rgb(152,162,179)]">Invite a member first under the Members tab.</p>
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
