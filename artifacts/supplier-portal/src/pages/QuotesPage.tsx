import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMyQuotes } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function QuotesPage() {
  const { data, isLoading } = useListMyQuotes();
  const quotes = data?.data || [];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Quotes</h1>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>RFQ ID</TableHead>
              <TableHead>Date</TableHead>
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
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  You haven't submitted any quotes yet.
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-xs">{quote.quote_number}</TableCell>
                  <TableCell className="font-medium">{quote.rfq_id}</TableCell>
                  <TableCell>{quote.submitted_at ? format(new Date(quote.submitted_at), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        quote.status === "draft" && "bg-gray-100 text-gray-800",
                        quote.status === "submitted" && "bg-blue-100 text-blue-800",
                        quote.status === "accepted" && "bg-green-100 text-green-800",
                        quote.status === "rejected" && "bg-red-100 text-red-800"
                      )}
                    >
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/quotes/${quote.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-quote-${quote.id}`}>
                        View Details
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
