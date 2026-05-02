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
  useCreateAddress
} from "@workspace/api-client-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Shield, GitBranch, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AccountPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("members");

  const { data: members, isLoading: membersLoading } = useListCompanyMembers({
    query: {
      enabled: activeTab === "members",
      queryKey: getListCompanyMembersQueryKey(),
    }
  });

  const { data: roles, isLoading: rolesLoading } = useListCompanyRoles({
    query: {
      enabled: activeTab === "roles",
      queryKey: getListCompanyRolesQueryKey(),
    }
  });

  const { data: approvalTree, isLoading: approvalLoading } = useListApprovalTree({
    query: {
      enabled: activeTab === "approval",
      queryKey: getListApprovalTreeQueryKey(),
    }
  });

  const { data: addresses, isLoading: addressesLoading } = useListAddresses({}, {
    query: {
      enabled: activeTab === "addresses",
      queryKey: getListAddressesQueryKey({}),
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your company members, roles, and preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="approval" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Approval Tree
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Company Members</CardTitle>
                <CardDescription>Manage team members and their access.</CardDescription>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              {membersLoading ? <Skeleton className="h-48 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members?.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
                        <TableCell>{m.email}</TableCell>
                        <TableCell>{m.role_name}</TableCell>
                        <TableCell>
                          <Badge variant={m.is_active ? "outline" : "secondary"}>
                            {m.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Define what your team members can do.</CardDescription>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            </CardHeader>
            <CardContent>
              {rolesLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roles?.map((role) => (
                    <Card key={role.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions?.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                          ))}
                          {(role.permissions?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-[10px]">+{role.permissions!.length - 3} more</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle>Order Approval Workflow</CardTitle>
              <CardDescription>Configure the hierarchy for purchase order approvals.</CardDescription>
            </CardHeader>
            <CardContent>
              {approvalLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="space-y-6">
                  {approvalTree?.nodes?.map((node, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 p-4 border rounded-lg bg-muted/30">
                        <p className="font-semibold">{node.approver_name}</p>
                        <p className="text-sm text-muted-foreground">Approval threshold: SAR {node.threshold?.toLocaleString()}+</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-dashed">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Approval Level
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Delivery Addresses</CardTitle>
                <CardDescription>Manage where your orders should be delivered.</CardDescription>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            </CardHeader>
            <CardContent>
              {addressesLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="grid gap-4 md:grid-cols-2">
                  {addresses?.map((addr) => (
                    <Card key={addr.id}>
                      <CardContent className="p-4 flex gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-semibold">{addr.type === 'delivery' ? 'Delivery Address' : 'Billing Address'}</p>
                          <p className="text-sm text-muted-foreground">{addr.line1}</p>
                          {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                          <p className="text-sm text-muted-foreground">{addr.city}, {addr.country}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
