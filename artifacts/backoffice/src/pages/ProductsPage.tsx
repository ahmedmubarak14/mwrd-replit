import { useMemo, useState, type FormEvent } from "react";
import {
  useAdminListProducts,
  useAdminDeprecateProduct,
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useListCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
  getListCategoriesQueryKey,
  type MasterProduct,
  type Category,
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
import { SearchMd, Plus, DotsHorizontal, Package, ChevronDown, ChevronRight } from "@untitledui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EditTarget = MasterProduct | null;
type Tab = "categories" | "products";

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("categories");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  const { data: products, isLoading } = useAdminListProducts({ search });
  const { data: categories, isLoading: categoriesLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });
  const deprecateMutation = useAdminDeprecateProduct();
  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();

  const rows = products?.data ?? [];
  const cats = categories ?? [];

  const productCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of rows) {
      if (p.status === "deprecated") continue;
      map.set(p.category_id, (map.get(p.category_id) ?? 0) + 1);
    }
    return map;
  }, [rows]);

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
          <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Master Catalog</h1>
          <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Manage categories and master products</p>
        </div>
        {tab === "products" && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
            data-testid="button-create-product"
          >
            <Plus className="h-4 w-4" /> Add Master Product
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-[rgb(228,231,236)]">
        {([
          { id: "categories", label: "Categories" },
          { id: "products", label: "Master Products" },
        ] as const).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-[rgb(255,109,67)] text-[rgb(255,109,67)]"
                  : "border-transparent text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "categories" && (
        <CategoriesPanel
          categories={cats}
          loading={categoriesLoading}
          productCountByCategory={productCountByCategory}
        />
      )}

      {tab === "products" && (
      <>
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
                <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Active offers</th>
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
                  <td className="px-5 py-3.5 text-[rgb(102,112,133)] hidden md:table-cell">
                    {cats.find((c) => c.id === product.category_id)?.name_en ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right" data-testid={`offers-count-${product.id}`}>
                    {product.active_offers_count === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(254,243,242)] text-[rgb(180,35,24)] border-[rgb(254,205,202)]">
                        No offers
                      </span>
                    ) : (
                      <span className="font-medium text-[rgb(16,24,40)]">{product.active_offers_count ?? "—"}</span>
                    )}
                  </td>
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
      </>
      )}

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

type CategoryEditTarget = Category | null;

function CategoriesPanel({
  categories,
  loading,
  productCountByCategory,
}: {
  categories: Category[];
  loading: boolean;
  productCountByCategory: Map<string, number>;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useAdminCreateCategory();
  const updateMutation = useAdminUpdateCategory();
  const deleteMutation = useAdminDeleteCategory();

  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<CategoryEditTarget>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const byParent = new Map<string | null, Category[]>();
    for (const c of categories) {
      const key = c.parent_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }
    for (const list of byParent.values()) list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name_en.localeCompare(b.name_en));
    return byParent;
  }, [categories]);

  const invalidateCategories = () =>
    queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name_en: String(fd.get("name_en") || "").trim(),
      name_ar: String(fd.get("name_ar") || "").trim(),
      slug: String(fd.get("slug") || "").trim(),
      parent_id: (String(fd.get("parent_id") || "").trim() || null) as string | null,
      sort_order: parseInt(String(fd.get("sort_order") || "0"), 10) || 0,
    };
    if (!data.name_en || !data.name_ar || !data.slug) {
      toast({ variant: "destructive", title: "Missing fields", description: "Name (EN/AR) and slug are required." });
      return;
    }
    createMutation.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({ title: "Category created" });
          invalidateCategories();
          setCreateOpen(false);
          setCreateParentId(null);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not create", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      name_en: String(fd.get("name_en") || "").trim(),
      name_ar: String(fd.get("name_ar") || "").trim(),
      slug: String(fd.get("slug") || "").trim(),
      parent_id: (String(fd.get("parent_id") || "").trim() || null) as string | null,
      sort_order: parseInt(String(fd.get("sort_order") || "0"), 10) || 0,
    };
    updateMutation.mutate(
      { id: editTarget.id, data: data as any },
      {
        onSuccess: () => {
          toast({ title: "Category updated" });
          invalidateCategories();
          setEditTarget(null);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not update", description: err?.message ?? "Please try again." }),
      },
    );
  };

  const handleDelete = (cat: Category) => {
    if (!confirm(`Delete "${cat.name_en}"? This is blocked if it still has products or sub-categories.`)) return;
    deleteMutation.mutate(
      { id: cat.id },
      {
        onSuccess: () => {
          toast({ title: "Category deleted" });
          invalidateCategories();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not delete", description: err?.message ?? "See server log." }),
      },
    );
  };

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (cat: Category, depth: number) => {
    const children = tree.get(cat.id) ?? [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed.has(cat.id);
    const productCount = productCountByCategory.get(cat.id) ?? 0;
    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-[rgb(249,250,251)] rounded-md group"
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          data-testid={`category-row-${cat.slug}`}
        >
          <button
            type="button"
            onClick={() => hasChildren && toggleCollapse(cat.id)}
            className={`h-5 w-5 inline-flex items-center justify-center text-[rgb(152,162,179)] ${hasChildren ? "hover:text-[rgb(52,64,84)]" : "invisible"}`}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[rgb(16,24,40)] truncate">{cat.name_en}</p>
            <p className="text-[11px] text-[rgb(102,112,133)] truncate" dir="rtl">{cat.name_ar}</p>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)]">
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>
          <code className="hidden md:inline text-[11px] font-mono text-[rgb(152,162,179)]">{cat.slug}</code>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setCreateParentId(cat.id);
                setCreateOpen(true);
              }}
              className="text-xs text-[rgb(102,112,133)] hover:text-[rgb(255,109,67)] px-2 py-1"
              data-testid={`category-add-child-${cat.slug}`}
            >
              + Sub
            </button>
            <button
              type="button"
              onClick={() => setEditTarget(cat)}
              className="text-xs text-[rgb(102,112,133)] hover:text-[rgb(255,109,67)] px-2 py-1"
              data-testid={`category-edit-${cat.slug}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(cat)}
              disabled={deleteMutation.isPending}
              className="text-xs text-[rgb(217,45,32)] hover:text-[rgb(180,35,24)] px-2 py-1 disabled:opacity-50"
              data-testid={`category-deprecate-${cat.slug}`}
            >
              Deprecate
            </button>
          </div>
        </div>
        {hasChildren && !isCollapsed && (
          <div>{children.map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  const roots = tree.get(null) ?? [];

  return (
    <>
      <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(228,231,236)]">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Category tree</h2>
          <button
            type="button"
            onClick={() => {
              setCreateParentId(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-[rgb(255,109,67)] text-white hover:bg-[rgb(205,56,22)] transition-colors"
            data-testid="button-add-root-category"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : roots.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
            <p className="text-sm text-[rgb(152,162,179)]">No categories yet. Add a root category to get started.</p>
          </div>
        ) : (
          <div className="py-2">{roots.map((c) => renderNode(c, 0))}</div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateParentId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              {createParentId
                ? `Creating a sub-category under "${categories.find((c) => c.id === createParentId)?.name_en ?? ""}".`
                : "Creating a top-level category."}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            categories={categories}
            initialParentId={createParentId}
            onSubmit={handleCreate}
            submitLabel={createMutation.isPending ? "Creating…" : "Create category"}
            disabled={createMutation.isPending}
            onCancel={() => {
              setCreateOpen(false);
              setCreateParentId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <CategoryForm
              key={editTarget.id}
              categories={categories}
              initial={editTarget}
              onSubmit={handleUpdate}
              submitLabel={updateMutation.isPending ? "Saving…" : "Save changes"}
              disabled={updateMutation.isPending}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryForm({
  categories,
  initial,
  initialParentId,
  onSubmit,
  submitLabel,
  disabled,
  onCancel,
}: {
  categories: Category[];
  initial?: Category;
  initialParentId?: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  disabled: boolean;
  onCancel: () => void;
}) {
  // Block self-reference when editing.
  const parentOptions = categories.filter((c) => c.id !== initial?.id);
  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Name (EN) *</span>
          <Input name="name_en" defaultValue={initial?.name_en ?? ""} required data-testid="category-name-en" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Name (AR) *</span>
          <Input name="name_ar" defaultValue={initial?.name_ar ?? ""} required dir="rtl" data-testid="category-name-ar" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Slug *</span>
          <Input name="slug" defaultValue={initial?.slug ?? ""} required placeholder="e.g. office-supplies" data-testid="category-slug" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Sort order</span>
          <Input name="sort_order" type="number" defaultValue={initial?.sort_order ?? 0} />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Parent</span>
        <select
          name="parent_id"
          defaultValue={initial?.parent_id ?? initialParentId ?? ""}
          className="w-full rounded-lg border border-[rgb(228,231,236)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/20 focus:border-[rgb(255,109,67)]"
          data-testid="category-parent"
        >
          <option value="">— Top level —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={disabled} data-testid="category-submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
