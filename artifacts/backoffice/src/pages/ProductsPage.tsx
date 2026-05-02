import { useState, type FormEvent } from "react";
import {
  useAdminListProducts,
  useAdminDeprecateProduct,
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useListCategories,
  type MasterProduct,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { SearchMd, Plus, DotsHorizontal, Package } from "@untitledui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EditTarget = MasterProduct | null;

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  const { data: products, isLoading } = useAdminListProducts({ search });
  const { data: categories } = useListCategories();
  const deprecateMutation = useAdminDeprecateProduct();
  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();

  const rows = products?.data ?? [];
  const cats = categories ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && typeof q.queryKey[0] === "string" && q.queryKey[0].includes("/backoffice/products"),
    });

  const handleDeprecate = (productId: string) => {
    if (!confirm("Are you sure you want to deprecate this product?")) return;
    deprecateMutation.mutate({ id: productId }, {
      onSuccess: () => {
        toast({ title: "Product deprecated" });
        invalidate();
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = {
      name_en: String(fd.get("name_en") || "").trim(),
      name_ar: String(fd.get("name_ar") || "").trim(),
      category_id: String(fd.get("category_id") || "").trim(),
      description_en: String(fd.get("description_en") || "").trim() || undefined,
      description_ar: String(fd.get("description_ar") || "").trim() || undefined,
      default_unit: String(fd.get("default_unit") || "").trim() || undefined,
    };
    if (!data.name_en || !data.name_ar || !data.category_id) {
      toast({ title: "Missing fields", description: "Name (EN/AR) and category are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Product created" });
        invalidate();
        setCreateOpen(false);
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    const fd = new FormData(e.currentTarget);
    const data: any = {
      name_en: String(fd.get("name_en") || "").trim(),
      name_ar: String(fd.get("name_ar") || "").trim(),
      category_id: String(fd.get("category_id") || "").trim(),
      description_en: String(fd.get("description_en") || "").trim() || undefined,
      description_ar: String(fd.get("description_ar") || "").trim() || undefined,
      default_unit: String(fd.get("default_unit") || "").trim() || undefined,
    };
    if (!data.name_en || !data.name_ar || !data.category_id) {
      toast({ title: "Missing fields", description: "Name (EN/AR) and category are required.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editTarget.id, data }, {
      onSuccess: () => {
        toast({ title: "Product updated" });
        invalidate();
        setEditTarget(null);
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleViewStats = (product: MasterProduct) => {
    toast({
      title: `${product.name_en}`,
      description: `Code: ${product.master_product_code ?? "—"} • Status: ${product.status}`,
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
          onClick={() => setCreateOpen(true)}
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
                        <DropdownMenuItem onSelect={() => setEditTarget(product)}>Edit Product</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleViewStats(product)}>View Stats</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[rgb(217,45,32)]"
                          disabled={product.status === "deprecated"}
                          onSelect={() => handleDeprecate(product.id)}
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

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>Add a new entry to the master catalog.</DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreate}
            categories={cats}
            submitLabel={createMutation.isPending ? "Creating…" : "Create product"}
            disabled={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update master catalog details.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <ProductForm
              key={editTarget.id}
              initial={editTarget}
              onSubmit={handleUpdate}
              categories={cats}
              submitLabel={updateMutation.isPending ? "Saving…" : "Save changes"}
              disabled={updateMutation.isPending}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({
  initial,
  onSubmit,
  categories,
  submitLabel,
  disabled,
  onCancel,
}: {
  initial?: MasterProduct;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  categories: { id: string; name_en?: string; name_ar?: string }[];
  submitLabel: string;
  disabled: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Name (EN) *</span>
          <Input name="name_en" defaultValue={initial?.name_en ?? ""} required data-testid="product-name-en" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Name (AR) *</span>
          <Input name="name_ar" defaultValue={initial?.name_ar ?? ""} required dir="rtl" data-testid="product-name-ar" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Category *</span>
        <select
          name="category_id"
          required
          defaultValue={initial?.category_id ?? ""}
          className="w-full rounded-lg border border-[rgb(228,231,236)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20 focus:border-[rgb(255,109,67)]"
          data-testid="product-category"
        >
          <option value="" disabled>Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en ?? c.id}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Description (EN)</span>
          <Input name="description_en" defaultValue={initial?.description_en ?? ""} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Description (AR)</span>
          <Input name="description_ar" defaultValue={initial?.description_ar ?? ""} dir="rtl" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Default unit</span>
        <Input name="default_unit" placeholder="e.g. box, kg, piece" defaultValue={(initial as any)?.default_unit ?? ""} />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={disabled} data-testid="product-submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
