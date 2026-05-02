import { useState } from "react";
import {
  useAdminListProducts,
  useAdminDeprecateProduct,
  getAdminListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SearchMd, Plus, DotsHorizontal, Package } from "@untitledui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useAdminListProducts({ search });
  const deprecateMutation = useAdminDeprecateProduct();

  const rows = products?.data ?? [];

  const handleDeprecate = (productId: string) => {
    if (!confirm("Are you sure you want to deprecate this product?")) return;
    deprecateMutation.mutate({ id: productId }, {
      onSuccess: () => {
        toast({ title: "Product deprecated" });
        queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey({ search }) });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Product Catalog</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage the master product database</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
          data-testid="button-create-product"
        >
          <Plus className="h-4 w-4" /> Create Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)] pointer-events-none" />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[rgb(228,231,236)] bg-white text-[rgb(52,64,84)] placeholder:text-[rgb(152,162,179)] focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20 focus:border-[rgb(255,109,67)]"
          data-testid="input-search"
        />
      </div>

      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No products found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(228,231,236)]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Product</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">SKU</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(242,244,247)]">
              {rows.map((product) => (
                <tr key={product.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[rgb(16,24,40)]">{product.name_en}</div>
                    <div className="text-xs text-[rgb(102,112,133)] truncate max-w-[300px] mt-0.5">{product.description_en}</div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[rgb(102,112,133)] hidden sm:table-cell">{product.master_product_code}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
                      product.status === "deprecated"
                        ? "bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]"
                        : "bg-[rgb(236,253,243)] text-[rgb(7,148,85)] border-[rgb(167,243,208)]"
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[rgb(102,112,133)] hover:bg-[rgb(242,244,247)] transition-colors"
                          data-testid={`button-actions-${product.id}`}
                        >
                          <DotsHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Product</DropdownMenuItem>
                        <DropdownMenuItem>View Stats</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[rgb(217,45,32)]"
                          disabled={product.status === "deprecated"}
                          onClick={() => handleDeprecate(product.id)}
                        >
                          Deprecate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
