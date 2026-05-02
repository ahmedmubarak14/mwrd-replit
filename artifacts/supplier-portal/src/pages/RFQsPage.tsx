import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListRFQs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function RFQsPage() {
  const { data, isLoading } = useListRFQs({ status: "open" });
  const rfqs = data?.data || [];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Open RFQs</h1>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : rfqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No open RFQs assigned to you.
                </TableCell>
              </TableRow>
            ) : (
              rfqs.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell className="font-mono text-xs">{rfq.rfq_number}</TableCell>
                  <TableCell className="font-medium">{rfq.title}</TableCell>
                  <TableCell>{rfq.created_at ? format(new Date(rfq.created_at), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>{rfq.expires_at ? format(new Date(rfq.expires_at), "MMM d, yyyy") : "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {rfq.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/rfqs/${rfq.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-rfq-${rfq.id}`}>
                        View & Quote
                      </Button>
                    </Link>
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
