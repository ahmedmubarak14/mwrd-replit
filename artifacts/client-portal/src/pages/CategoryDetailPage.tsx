import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useListCategories,
  useListMasterProducts,
  useAddToCart,
  getListCategoriesQueryKey,
  getListMasterProductsQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchLg, ShoppingCart01, ChevronRight } from "@untitledui/icons";
import { useToast } from "@/hooks/use-toast";

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const category = (categories ?? []).find((c) => c.slug === slug);

  const { data: productsData, isLoading: productsLoading } = useListMasterProducts(
    { search, category_id: category?.id },
    {
      query: {
        enabled: Boolean(category?.id),
        queryKey: getListMasterProductsQueryKey({ search, category_id: category?.id }),
      },
    },
  );

  const addToCart = useAddToCart();

  const handleAddToCart = (productId: string, packType: string) => {
    addToCart.mutate(
      { data: { master_product_id: productId, qty: 1, pack_type: packType } },
      {
        onSuccess: () => toast({ title: "Added to cart", description: "Product added to your procurement cart." }),
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not add to cart", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (categoriesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-[rgb(102,112,133)]">Category not found.</p>
        <Link href="/catalog">
          <Button variant="outline">Back to catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[rgb(102,112,133)]">
        <Link href="/catalog" className="hover:text-[rgb(255,109,67)]" data-testid="breadcrumb-catalog">Catalog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[rgb(52,64,84)] font-medium">{category.name_en}</span>
      </nav>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[rgb(16,24,40)]">{category.name_en}</h1>
          <p className="mt-1 text-sm text-[rgb(102,112,133)]" dir="rtl">{category.name_ar}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <SearchLg className="absolute left-2 top-2.5 h-4 w-4 text-[rgb(152,162,179)]" />
          <Input
            placeholder={`Search in ${category.name_en}…`}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-category-search"
          />
        </div>
      </div>

      {productsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : (productsData?.data ?? []).length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <p className="text-sm text-[rgb(102,112,133)]">
            No products in {category.name_en}{search ? ` matching "${search}"` : ""}.
          </p>
          <Link href="/rfqs/new/custom">
            <Button data-testid="link-custom-request-empty">Submit a custom request</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(productsData?.data ?? []).map((product) => {
            const defaultPack = product.pack_types?.[0] ?? "standard";
            return (
              <Card key={product.id} className="overflow-hidden flex flex-col" data-testid={`card-product-${product.id}`}>
                <Link href={`/catalog/products/${product.id}`} className="aspect-square bg-[rgb(249,250,251)] relative block">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name_en} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[rgb(152,162,179)]">No image</div>
                  )}
                </Link>
                <CardHeader className="p-4">
                  <Link href={`/catalog/products/${product.id}`} data-testid={`link-product-${product.id}`}>
                    <CardTitle className="text-lg hover:text-[rgb(255,109,67)] transition-colors">{product.name_en}</CardTitle>
                  </Link>
                  {product.master_product_code && (
                    <Badge variant="outline" className="w-fit text-xs">{product.master_product_code}</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <p className="text-sm text-[rgb(102,112,133)] line-clamp-2">{product.description_en}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleAddToCart(product.id, defaultPack)}
                    disabled={addToCart.isPending}
                    data-testid={`button-add-to-cart-${product.id}`}
                  >
                    <ShoppingCart01 className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
