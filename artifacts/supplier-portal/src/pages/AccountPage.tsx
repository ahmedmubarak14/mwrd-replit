import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetMe, useListAddresses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin } from "lucide-react";

export default function AccountPage() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: addresses, isLoading: addressesLoading } = useListAddresses();

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="mr-2 h-4 w-4" />
            Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                      <p className="text-lg font-semibold">{user?.company?.real_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                      <p className="text-lg font-semibold uppercase">{user?.user.role || "Supplier"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Email</p>
                      <p>{user?.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registered At</p>
                      <p>{user?.user.created_at ? new Date(user.user.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="grid gap-4 md:grid-cols-2">
            {addressesLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !addresses || addresses.length === 0 ? (
              <p className="text-muted-foreground">No addresses found.</p>
            ) : (
              addresses.map((address) => (
                <Card key={address.id} className="border-card-border">
                  <CardHeader>
                    <CardTitle className="text-base">{address.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{address.full_address}</p>
                    <p className="text-sm font-medium mt-2">{address.phone}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
