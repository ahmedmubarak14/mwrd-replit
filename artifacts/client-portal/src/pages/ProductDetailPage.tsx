import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  useGetMasterProduct,
  useListCategories,
  useAddToCart,
  getGetMasterProductQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart01, ChevronRight, Image01 } from "@untitledui/icons";

const inputCls =
  "block w-32 rounded-md border border-[rgb(228,231,236)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: product, isLoading } = useGetMasterProduct(id!, {
    query: { queryKey: getGetMasterProductQueryKey(id!) },
  });

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const category = useMemo(
    () => (categories ?? []).find((c) => c.id === product?.category_id),
    [categories, product],
  );

  const [activeImage, setActiveImage] = useState(0);
  const [packType, setPackType] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    if (product?.pack_types?.[0] && !packType) setPackType(product.pack_types[0]);
  }, [product, packType]);

  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    if (!product) return;
    if (qty < 1) {
      toast({ variant: "destructive", title: "Quantity must be at least 1" });
      return;
    }
    addToCart.mutate(
      { data: { master_product_id: product.id, qty, pack_type: packType || "standard" } },
      {
        onSuccess: () =>
          toast({
            title: "Added to cart",
            description: `${qty} × ${product.name_en} added to your procurement cart.`,
          }),
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not add to cart", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-[rgb(102,112,133)]">Product not found.</p>
        <Link href="/catalog"><Button variant="outline">Back to catalog</Button></Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const hero = images[activeImage];
  const specs = Object.entries(product.specs ?? {});

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[rgb(102,112,133)] flex-wrap">
        <Link href="/catalog" className="hover:text-[rgb(255,109,67)]">Catalog</Link>
        <ChevronRight className="h-3 w-3" />
        {category ? (
          <>
            <Link href={`/catalog/categories/${category.slug}`} className="hover:text-[rgb(255,109,67)]" data-testid="breadcrumb-category">
              {category.name_en}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        ) : null}
        <span className="text-[rgb(52,64,84)] font-medium truncate max-w-xs">{product.name_en}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-[rgb(249,250,251)] rounded-xl border border-[rgb(228,231,236)] overflow-hidden flex items-center justify-center">
            {hero ? (
              <img src={hero} alt={product.name_en} className="object-cover w-full h-full" data-testid="product-hero-image" />
            ) : (
              <Image01 className="h-12 w-12 text-[rgb(208,213,221)]" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  data-testid={`thumb-${idx}`}
                  className={`w-16 h-16 rounded-md border overflow-hidden shrink-0 ${
                    idx === activeImage ? "border-[rgb(255,109,67)] ring-2 ring-[rgb(255,109,67)]/20" : "border-[rgb(228,231,236)]"
                  }`}
                >
                  <img src={src} alt={`${product.name_en} ${idx + 1}`} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="space-y-5">
          <div>
            {product.master_product_code && (
              <p className="text-xs font-mono text-[rgb(102,112,133)]">{product.master_product_code}</p>
            )}
            <h1 className="mt-1 text-2xl font-semibold text-[rgb(16,24,40)]">{product.name_en}</h1>
            {product.name_ar && (
              <p className="mt-1 text-sm text-[rgb(102,112,133)]" dir="rtl">{product.name_ar}</p>
            )}
            {category && (
              <Link href={`/catalog/categories/${category.slug}`}>
                <Badge variant="outline" className="mt-2 cursor-pointer hover:border-[rgb(255,109,67)]" data-testid="badge-category">
                  {category.name_en}
                </Badge>
              </Link>
            )}
          </div>

          {product.description_en && (
            <div>
              <p className="text-sm text-[rgb(52,64,84)] whitespace-pre-wrap">{product.description_en}</p>
              {product.description_ar && (
                <p className="mt-2 text-sm text-[rgb(102,112,133)] whitespace-pre-wrap" dir="rtl">{product.description_ar}</p>
              )}
            </div>
          )}

          {/* Pack type + qty + Add to Cart */}
          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 space-y-4">
            {(product.pack_types ?? []).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-2">Pack type</label>
                <div className="flex flex-wrap gap-2">
                  {product.pack_types!.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setPackType(pt)}
                      data-testid={`pack-${pt}`}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        packType === pt
                          ? "bg-[rgb(255,109,67)]/10 text-[rgb(194,84,28)] border-[rgb(255,109,67)]"
                          : "bg-white text-[rgb(52,64,84)] border-[rgb(228,231,236)] hover:border-[rgb(208,213,221)]"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">
                  Quantity {product.default_unit ? `(${product.default_unit})` : ""}
                </label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
                  className={inputCls}
                  data-testid="input-qty"
                />
              </div>
              <Button
                className="gap-2 flex-1 min-w-[160px]"
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart01 className="h-4 w-4" />
                {addToCart.isPending ? "Adding…" : "Add to Cart"}
              </Button>
            </div>
            <p className="text-xs text-[rgb(152,162,179)]">
              MWRD is quote-only. Pricing arrives once suppliers respond to your RFQ.
            </p>
          </div>

          {specs.length > 0 && (
            <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[rgb(228,231,236)]">
                <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Specifications</h2>
              </div>
              <dl className="divide-y divide-[rgb(242,244,247)]">
                {specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 px-5 py-2.5 text-sm">
                    <dt className="text-[rgb(102,112,133)] capitalize">{k.replace(/_/g, " ")}</dt>
                    <dd className="col-span-2 text-[rgb(52,64,84)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
