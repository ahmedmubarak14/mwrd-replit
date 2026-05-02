import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyProductRequests } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ProductRequestsPage() {
  const { data: requests, isLoading } = useListMyProductRequests();

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Addition Requests</h1>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category ID</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : !requests || requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No product requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.proposed_name_en}</TableCell>
                  <TableCell>{request.proposed_category_id}</TableCell>
                  <TableCell>{request.created_at ? format(new Date(request.created_at), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        request.status === "pending" && "bg-yellow-100 text-yellow-800",
                        request.status === "approved" && "bg-green-100 text-green-800",
                        request.status === "rejected" && "bg-red-100 text-red-800"
                      )}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
