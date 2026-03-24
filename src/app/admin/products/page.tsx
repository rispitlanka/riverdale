"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type ProductItem = {
  id: string;
  name: string;
  sku?: string;
  metalId: string | null;
  metalName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subCategoryId: string | null;
  subCategoryName: string | null;
  weight: number;
  purity: string;
  unit: string;
  description?: string;
  imageUrl?: string;
  inStock: boolean;
  taxIncluded?: boolean;
  taxPercent?: number | null;
  finalPrice: number;
};

type MetalOption = {
  id: string;
  name: string;
  basePrice: number;
};

type CategoryOption = {
  id: string;
  name: string;
  type: "parent" | "sub";
  parentId?: string | null;
  makePrice?: number | null;
  status?: "active" | "inactive";
};

type FormState = {
  id?: string;
  name: string;
  sku: string;
  metalId: string;
  categoryId: string;
  subCategoryId: string;
  weight: string;
  purity: string;
  unit: string;
  description: string;
  imageFile?: File | null;
  imagePreview?: string | null;
  inStock: boolean;
  taxIncluded: boolean;
  taxPercent: string;
};

const GOLD_COLOR = "#B8860B";

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [metals, setMetals] = useState<MetalOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [metalsLoading, setMetalsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    sku: "",
    metalId: "",
    categoryId: "",
    subCategoryId: "",
    weight: "",
    purity: "",
    unit: "grams",
    description: "",
    imageFile: undefined,
    imagePreview: undefined,
    inStock: true,
    taxIncluded: true,
    taxPercent: "",
  });

  useEffect(() => {
    void Promise.all([fetchProducts(), fetchMetals(), fetchCategories()]);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(items.length / rowsPerPage));
    setPage((p) => Math.min(p, pages));
  }, [items.length, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const pagedItems = items.slice(
    (page - 1) * rowsPerPage,
    (page - 1) * rowsPerPage + rowsPerPage
  );

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/products");
      if (!res.ok) {
        throw new Error("Failed to load products");
      }
      const data: ProductItem[] = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetals() {
    try {
      setMetalsLoading(true);
      const res = await fetch("/api/admin/metals");
      if (!res.ok) {
        throw new Error("Failed to load metals");
      }
      const data: MetalOption[] = await res.json();
      setMetals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMetalsLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      setCategoriesLoading(true);
      const [parentsRes, subsRes] = await Promise.all([
        fetch("/api/admin/categories?type=parent"),
        fetch("/api/admin/categories?type=sub"),
      ]);

      if (!parentsRes.ok || !subsRes.ok) {
        throw new Error("Failed to load categories");
      }

      const parents: CategoryOption[] = await parentsRes.json();
      const subs: CategoryOption[] = await subsRes.json();

      const combined = [...parents, ...subs];
      const dedupedById = Array.from(
        new Map(combined.map((cat) => [cat.id, cat])).values()
      );

      setCategories(dedupedById);
    } catch (err) {
      console.error(err);
    } finally {
      setCategoriesLoading(false);
    }
  }

  const parentCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.type === "parent" &&
          (c.status === "active" || c.status === undefined)
      ),
    [categories]
  );

  const subCategoriesForSelectedParent = useMemo(() => {
    if (!form.categoryId) return [];
    return categories.filter(
      (c) =>
        c.type === "sub" &&
        c.parentId === form.categoryId &&
        (c.status === "active" || c.status === undefined)
    );
  }, [categories, form.categoryId]);

  const selectedMetal = useMemo(
    () => metals.find((m) => m.id === form.metalId) || null,
    [metals, form.metalId]
  );

  const selectedSubCategory = useMemo(
    () =>
      subCategoriesForSelectedParent.find(
        (c) => c.id === form.subCategoryId
      ) || null,
    [subCategoriesForSelectedParent, form.subCategoryId]
  );

  const estimatedFinalPrice = useMemo(() => {
    const metalPrice = selectedMetal?.basePrice ?? 0;

    const weight =
      form.weight.trim() === ""
        ? 0
        : Number.parseFloat(form.weight.replace(",", "."));

    if (Number.isNaN(weight)) {
      return 0;
    }

    const final = metalPrice * weight;
    return Number.isFinite(final) ? final : 0;
  }, [selectedMetal, form.weight]);

  function openCreateForm() {
    setForm({
      name: "",
      sku: "",
      metalId: "",
      categoryId: "",
      subCategoryId: "",
      weight: "",
      purity: "",
      unit: "grams",
      description: "",
      imageFile: undefined,
      imagePreview: undefined,
      inStock: true,
      taxIncluded: true,
      taxPercent: "",
    });
    setIsFormOpen(true);
  }

  function openEditForm(item: ProductItem) {
    setForm({
      id: item.id,
      name: item.name,
      sku: item.sku ?? "",
      metalId: item.metalId ?? "",
      categoryId: item.categoryId ?? "",
      subCategoryId: item.subCategoryId ?? "",
      weight: item.weight ? String(item.weight) : "",
      purity: item.purity ?? "",
      unit: "grams",
      description: item.description ?? "",
      imageFile: undefined,
      imagePreview: item.imageUrl ?? null,
      inStock: item.inStock,
      taxIncluded: item.taxIncluded ?? true,
      taxPercent:
        item.taxPercent !== null && item.taxPercent !== undefined
          ? String(item.taxPercent)
          : "",
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  function handleInputChange<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "categoryId"
        ? { subCategoryId: "" }
        : {}),
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null, imagePreview: null }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview:
          typeof reader.result === "string" ? reader.result : null,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!form.metalId || !form.categoryId) {
        throw new Error("Please select a metal and category.");
      }

      const weightNumber =
        form.weight.trim() === ""
          ? NaN
          : Number.parseFloat(form.weight.replace(",", "."));

      if (Number.isNaN(weightNumber) || weightNumber <= 0) {
        throw new Error("Please enter a valid weight.");
      }

      let taxPercentNumber: number | null = null;
      if (form.taxIncluded && form.taxPercent.trim() !== "") {
        const parsed = Number.parseFloat(
          form.taxPercent.replace(",", ".")
        );
        if (!Number.isNaN(parsed) && parsed >= 0) {
          taxPercentNumber = parsed;
        }
      }

      const payload: any = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        metalId: form.metalId,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId || null,
        weight: weightNumber,
        purity: form.purity.trim(),
        unit: "grams",
        description: form.description.trim(),
        imageUrl: form.imagePreview,
        inStock: form.inStock,
        taxIncluded: form.taxIncluded,
        taxPercent: taxPercentNumber,
      };

      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `/api/admin/products/${form.id}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save product");
      }

      await fetchProducts();
      setIsFormOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  function cancelDelete() {
    setDeleteId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete product");
      }

      await fetchProducts();
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "Failed to delete product. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Products
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, pricing, stock, and categories.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center rounded-md bg-[#B8860B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a37509] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8860B]"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-md border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Metal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Sub Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Weight
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Final Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No products found. Start by adding a new product.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 align-middle">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {item.sku || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {item.metalName || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {item.categoryName || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {item.subCategoryName || "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {item.weight} {item.unit}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-900">
                      CA$
                      {item.finalPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.inStock
                            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                            : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                        }`}
                      >
                        {item.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(item.id)}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[11px] text-gray-500">
                Showing {(page - 1) * rowsPerPage + 1}–
                {Math.min(page * rowsPerPage, items.length)} of {items.length}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Rows:</span>
                <select
                  value={String(rowsPerPage)}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                >
                  <option value="5">5</option>
                  <option value="8">8</option>
                  <option value="10">10</option>
                </select>
              </div>
            </div>

            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-[11px] text-gray-500">
                Page {page} of {totalPages}
              </div>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                }
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {form.id ? "Edit Product" : "Add Product"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {form.id
                    ? "Update the product details below."
                    : "Create a new product with pricing and stock details."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    placeholder="e.g. Gold Pendant"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) =>
                      handleInputChange("sku", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    placeholder="e.g. PRO-1001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Metal
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.metalId}
                      onChange={(e) =>
                        handleInputChange("metalId", e.target.value)
                      }
                      disabled={metalsLoading}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">
                        {metalsLoading ? "Loading metals..." : "Select metal"}
                      </option>
                    {metals.map((metal) => (
                      <option key={metal.id} value={metal.id}>
                        {metal.name} (CA$
                        {metal.basePrice.toLocaleString()})
                      </option>
                    ))}
                    </select>
                    {metalsLoading && (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) =>
                        handleInputChange("categoryId", e.target.value)
                      }
                      disabled={categoriesLoading}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">
                        {categoriesLoading
                          ? "Loading categories..."
                          : "Select parent category"}
                      </option>
                    {parentCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    </select>
                    {categoriesLoading && (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Sub Category
                  </label>
                  <div className="relative">
                    <select
                      value={form.subCategoryId}
                      onChange={(e) =>
                        handleInputChange("subCategoryId", e.target.value)
                      }
                      disabled={!form.categoryId || categoriesLoading}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                    <option value="">
                      {categoriesLoading
                        ? "Loading sub categories..."
                        : form.categoryId
                        ? "Select sub category (optional)"
                        : "Select a category first"}
                    </option>
                    {subCategoriesForSelectedParent.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    </select>
                    {categoriesLoading && (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Weight
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.weight}
                    onChange={(e) =>
                      handleInputChange("weight", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    placeholder="e.g. 10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Purity
                  </label>
                  <input
                    type="text"
                    required
                    value={form.purity}
                    onChange={(e) =>
                      handleInputChange("purity", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    placeholder="e.g. 22K"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Unit
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="grams"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-600"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    placeholder="Describe this product"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">
                    Image
                  </label>
                  <div className="flex items-center gap-3">
                    {form.imagePreview ? (
                      <img
                        src={form.imagePreview}
                        alt={form.name || "Preview"}
                        className="h-16 w-16 rounded object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-xs text-gray-500 ring-1 ring-gray-200">
                        No image
                      </div>
                    )}
                    <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    For now, images are stored as base64 in the database.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Stock Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange("inStock", !form.inStock)
                    }
                    className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs shadow-inner"
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        form.inStock
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      In Stock
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        !form.inStock
                          ? "bg-gray-500 text-white shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Out of Stock
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Tax
                  </label>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange("taxIncluded", !form.taxIncluded)
                      }
                      className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs shadow-inner"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          form.taxIncluded
                            ? "bg-[#B8860B] text-white shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        Tax Included
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          !form.taxIncluded
                            ? "bg-gray-500 text-white shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        Tax Excluded
                      </span>
                    </button>
                    {form.taxIncluded && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">
                          Tax Percentage
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.taxPercent}
                          onChange={(e) =>
                            handleInputChange("taxPercent", e.target.value)
                          }
                          className="block w-24 rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                          placeholder="e.g. 3"
                        />
                        <span className="text-[11px] text-gray-500">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
                <div>
                  <div className="text-xs font-medium text-gray-700">
                    Estimated Final Price
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Formula: Metal Price × Weight. Tax is applied separately at checkout.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    CA$
                    {estimatedFinalPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Estimated Final Price
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md"
                  style={{
                    backgroundColor: GOLD_COLOR,
                    color: "white",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    boxShadow:
                      "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.02)",
                  }}
                >
                  {isSubmitting
                    ? form.id
                      ? "Saving..."
                      : "Creating..."
                    : form.id
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-100">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Delete product?
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

