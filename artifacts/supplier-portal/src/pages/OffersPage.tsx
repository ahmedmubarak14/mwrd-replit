import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyOffers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OffersPage() {
  const { data, isLoading } = useListMyOffers();
  const offers = data?.data || [];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Offers</h1>
        <Link href="/offers/new">
          <Button data-testid="button-create-offer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No offers found.
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.master_product_id}</TableCell>
                  <TableCell>{offer.supplier_internal_sku || 'N/A'}</TableCell>
                  <TableCell>{offer.created_at ? format(new Date(offer.created_at), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        offer.approval_status === "pending" && "bg-yellow-100 text-yellow-800",
                        offer.approval_status === "approved" && "bg-green-100 text-green-800",
                        offer.approval_status === "rejected" && "bg-red-100 text-red-800"
                      )}
                    >
                      {offer.approval_status}
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
