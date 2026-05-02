import { useState } from "react";
import {
  useListCompanyMembers,
  getListCompanyMembersQueryKey,
  useListCompanyRoles,
  getListCompanyRolesQueryKey,
  useListApprovalTree,
  getListApprovalTreeQueryKey,
  useListAddresses,
  getListAddressesQueryKey,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users01, Shield01, GitBranch01, MarkerPin01 } from "@untitledui/icons";

type Tab = "members" | "roles" | "approval" | "addresses";

const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "members", label: "Members", icon: Users01 },
  { id: "roles", label: "Roles", icon: Shield01 },
  { id: "approval", label: "Approval Tree", icon: GitBranch01 },
  { id: "addresses", label: "Addresses", icon: MarkerPin01 },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("members");

  const { data: members, isLoading: membersLoading } = useListCompanyMembers({
    query: { enabled: activeTab === "members", queryKey: getListCompanyMembersQueryKey() },
  });

  const { data: roles, isLoading: rolesLoading } = useListCompanyRoles({
    query: { enabled: activeTab === "roles", queryKey: getListCompanyRolesQueryKey() },
  });

  const { data: approvalTree, isLoading: approvalLoading } = useListApprovalTree({
    query: { enabled: activeTab === "approval", queryKey: getListApprovalTreeQueryKey() },
  });

  const { data: addresses, isLoading: addressesLoading } = useListAddresses({}, {
    query: { enabled: activeTab === "addresses", queryKey: getListAddressesQueryKey({}) },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Account Settings</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage your company members, roles, and preferences</p>
      </div>

      {/* Tab bar */}
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
            <Button size="sm" className="gap-2">
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
                        {m.company_role_id ? "Member" : "Owner"}
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
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Create Role</Button>
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
              <Button variant="outline" className="w-full border-dashed mt-2">
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
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Address</Button>
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
    </div>
  );
}
