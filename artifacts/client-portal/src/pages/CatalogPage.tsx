import { useState } from "react";
import { 
  useListCategories, 
  useListMasterProducts, 
  useAddToCart,
  getListMasterProductsQueryKey,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchLg, ShoppingCart01, FilterLines } from "@untitledui/icons";
import { useToast } from "@/hooks/use-toast";

export default function CatalogPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories, isLoading: categoriesLoading } = useListCategories({
    query: {
      queryKey: getListCategoriesQueryKey(),
    }
  });

  const { data: productsData, isLoading: productsLoading } = useListMasterProducts(
    { search, category_id: selectedCategory || undefined },
    {
      query: {
        queryKey: getListMasterProductsQueryKey({ search, category_id: selectedCategory || undefined }),
      }
    }
  );

  const addToCartMutation = useAddToCart();

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({ 
      data: { master_product_id: productId, qty: 1, pack_type: "standard" } 
    }, {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: "Product has been added to your procurement cart.",
        });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Failed to add to cart",
          description: error.message || "Please try again later.",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
        <p className="text-muted-foreground">Browse and source products for your RFQs.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <div className="relative">
            <SearchLg className="absolute left-2 top-2.5 h-4 w-4 text-color-fg-quaternary" />
            <Input 
              placeholder="Search products..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FilterLines className="h-4 w-4" />
              Categories
            </h3>
            <div className="space-y-1">
              <Button 
                variant={selectedCategory === null ? "secondary" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedCategory(null)}
                data-testid="button-category-all"
              >
                All Categories
              </Button>
              {categoriesLoading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
              ) : (
                categories?.map((cat) => (
                  <Button 
                    key={cat.id} 
                    variant={selectedCategory === cat.id ? "secondary" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.name_en}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {productsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productsData?.data?.map((product) => (
                <Card key={product.id} className="overflow-hidden flex flex-col" data-testid={`card-product-${product.id}`}>
                  <div className="aspect-square bg-muted relative">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name_en} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg" data-testid={`text-product-name-${product.id}`}>{product.name_en}</CardTitle>
                    <Badge variant="outline" className="w-fit">{product.category_id}</Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description_en}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addToCartMutation.isPending}
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <ShoppingCart01 className="h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {(!productsData?.data || productsData.data.length === 0) && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  No products found in this category.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
