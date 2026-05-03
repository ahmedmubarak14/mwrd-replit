import { Link } from "wouter";
import { useListBundles, getListBundlesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "@untitledui/icons";

export default function BundlesPage() {
  const { data: bundles, isLoading } = useListBundles({
    query: { queryKey: getListBundlesQueryKey() },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[rgb(16,24,40)]">Bundles</h1>
        <p className="text-sm text-[rgb(102,112,133)]">
          Pre-built kits ready to add to an RFQ in one click. No prices shown — every bundle is quote-only.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[3/2] w-full" />
              <CardHeader className="p-4"><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent className="p-4 pt-0"><Skeleton className="h-4 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bundles?.map((b) => (
            <Card key={b.id} className="overflow-hidden flex flex-col" data-testid={`card-bundle-${b.id}`}>
              <div className="aspect-[3/2] bg-muted">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name_en} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-10 w-10 opacity-30" />
                  </div>
                )}
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg" data-testid={`text-bundle-name-${b.id}`}>{b.name_en}</CardTitle>
                {b.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1">
                <Badge variant="outline">{b.items?.length ?? 0} items</Badge>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link href={`/catalog/bundles/${b.slug}`} className="w-full">
                  <Button className="w-full" data-testid={`button-view-bundle-${b.id}`}>
                    View bundle
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          {(!bundles || bundles.length === 0) && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No bundles available yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
