import { useRoute, Link, useLocation } from "wouter";
import {
  useGetBundle,
  getGetBundleQueryKey,
  useAddBundleToCart,
  getGetCartQueryKey,
  useListMasterProducts,
  getListMasterProductsQueryKey,
} from "@workspace/api-client-react";
import type { BundleItem, MasterProduct } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart01 } from "@untitledui/icons";

export default function BundleDetailPage() {
  const [, params] = useRoute("/catalog/bundles/:slug");
  const slug = params?.slug;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bundle, isLoading } = useGetBundle(slug!, {
    query: { enabled: !!slug, queryKey: getGetBundleQueryKey(slug!) },
  });

  // Hydrate item details. listMasterProducts returns paginated results;
  // for the small bundle sizes (3-6 items) we fetch a single page and filter.
  const { data: productsData } = useListMasterProducts(
    {},
    { query: { queryKey: getListMasterProductsQueryKey({}) } },
  );
  const productMap = new Map<string, MasterProduct>(
    (productsData?.data ?? []).map((p: MasterProduct) => [p.id, p]),
  );

  const addBundleToCart = useAddBundleToCart();

  const handleAdd = () => {
    if (!bundle) return;
    addBundleToCart.mutate(
      { bundleId: bundle.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: "Bundle added to cart",
            description: `${bundle.items?.length ?? 0} items added. Submit your cart as an RFQ from /cart.`,
          });
          navigate("/cart");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Failed to add bundle", description: err.message });
        },
      },
    );
  };

  if (isLoading) return <Skeleton className="h-[60vh] w-full" />;
  if (!bundle) return <div className="p-8 text-center">Bundle not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/catalog/bundles">
          <Button variant="ghost" size="sm" data-testid="button-back-to-bundles">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to bundles
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          {bundle.image_url && (
            <div className="aspect-[3/2] bg-muted">
              <img src={bundle.image_url} alt={bundle.name_en} className="object-cover w-full h-full" />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{bundle.name_en}</CardTitle>
            {bundle.description && (
              <p className="text-sm text-muted-foreground">{bundle.description}</p>
            )}
            <Badge variant="outline" className="w-fit mt-2">{bundle.items?.length ?? 0} items</Badge>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add to RFQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All items will be added to your active cart. No prices shown — you'll receive line-by-line quotes after submitting the RFQ.
            </p>
            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={addBundleToCart.isPending}
              data-testid="button-add-bundle-to-rfq"
            >
              <ShoppingCart01 className="h-4 w-4 mr-2" />
              Add bundle to cart
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items in this bundle</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="p-3 text-left font-medium">Product</th>
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-right font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {bundle.items?.map((it: BundleItem) => {
                const p = productMap.get(it.master_product_id);
                return (
                  <tr key={it.id} className="border-b last:border-0" data-testid={`row-bundle-item-${it.id}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                          {p?.images?.[0] && (
                            <img src={p.images[0]} alt={p.name_en} className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{p?.name_en ?? it.master_product_id}</div>
                          {p?.description_en && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{p.description_en}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {p?.master_product_code ?? "—"}
                    </td>
                    <td className="p-3 text-right font-medium">{it.qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
