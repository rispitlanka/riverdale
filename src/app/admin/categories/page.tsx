"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryType = "parent" | "sub";
type CategoryStatus = "active" | "inactive";

type Category = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  type: CategoryType;
  parentId?: string | null;
  parentName?: string | null;
  makePrice?: number | null;
  status: CategoryStatus;
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  imageFile?: File | null;
  imagePreview?: string | null;
  type: CategoryType;
  parentId: string | "";
  makePrice: string;
  status: CategoryStatus;
};

const GOLD_COLOR = "#B8860B";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    imageFile: undefined,
    imagePreview: undefined,
    type: "parent",
    parentId: "",
    makePrice: "",
    status: "active",
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/categories");
      if (!res.ok) {
        throw new Error("Failed to load categories");
      }
      const data: Category[] = await res.json();

      // Ensure no duplicate IDs to avoid React key collisions
      const dedupedById = Array.from(
        new Map(data.map((cat) => [cat.id, cat])).values()
      );

      setCategories(dedupedById);
    } catch (err) {
      console.error(err);
      setError("Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setForm({
      name: "",
      description: "",
      imageFile: undefined,
      imagePreview: undefined,
      type: "parent",
      parentId: "",
      makePrice: "",
      status: "active",
    });
    setIsFormOpen(true);
  }

  function openEditForm(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
      imageFile: undefined,
      imagePreview: category.imageUrl ?? null,
      type: category.type,
      parentId: category.parentId ?? "",
      makePrice:
        category.makePrice !== undefined && category.makePrice !== null
          ? String(category.makePrice)
          : "",
      status: category.status,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  function handleInputChange<
    K extends keyof Omit<FormState, "imageFile" | "imagePreview">
  >(field: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "type" && value === "parent"
        ? { parentId: "", makePrice: "" }
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
        imagePreview: typeof reader.result === "string" ? reader.result : null,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        status: form.status,
      };

      if (form.imagePreview) {
        payload.imageUrl = form.imagePreview;
      }

      if (form.type === "sub") {
        payload.parentId = form.parentId || null;
        payload.makePrice =
          form.makePrice.trim() === "" ? null : Number(form.makePrice);
      } else {
        payload.parentId = null;
        payload.makePrice = null;
      }

      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `/api/admin/categories/${form.id}`
        : "/api/admin/categories";
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
        throw new Error(data.error || "Failed to save category");
      }

      await fetchCategories();
      setIsFormOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
    setDeleteError(null);
  }

  function cancelDelete() {
    setDeleteId(null);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/categories/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.error) {
          setDeleteError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to delete category");
      }

      await fetchCategories();
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      setDeleteError(
        err.message || "Failed to delete category. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const parentCategories = useMemo(
    () => categories.filter((c) => c.type === "parent" && c.status === "active"),
    [categories]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Categories
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage parent and sub categories for your jewellery catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center rounded-md bg-[#B8860B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a37509] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8860B]"
        >
          + Add Category
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Parent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Make Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No categories found. Start by adding a new category.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="h-8 w-8 rounded object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          category.type === "parent"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-[#B8860B]/10 text-[#B8860B]"
                        }`}
                      >
                        {category.type === "parent"
                          ? "Parent Category"
                          : "Sub Category"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {category.type === "sub"
                        ? category.parentName || "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {category.type === "sub" && category.makePrice != null
                        ? `CA$${category.makePrice.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          category.status === "active"
                            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                            : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                        }`}
                      >
                        {category.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(category)}
                          className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(category.id)}
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
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {form.id ? "Edit Category" : "Add Category"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {form.id
                    ? "Update the category details below."
                    : "Create a new category for your catalogue."}
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                  placeholder="e.g. Necklaces"
                />
              </div>

              <div className="space-y-1">
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
                  placeholder="Short description of this category"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Image
                </label>
                <div className="flex items-center gap-3">
                  {form.imagePreview ? (
                    <img
                      src={form.imagePreview}
                      alt={form.name || "Preview"}
                      className="h-12 w-12 rounded object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-500 ring-1 ring-gray-200">
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

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-700">
                    Category Type
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "type",
                        form.type === "parent" ? "sub" : "parent"
                      )
                    }
                    className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs shadow-inner"
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        form.type === "parent"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Parent Category
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        form.type === "sub"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Sub Category
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-700">
                    Status
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "status",
                        form.status === "active" ? "inactive" : "active"
                      )
                    }
                    className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-1 py-0.5 text-xs shadow-inner"
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        form.status === "active"
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Active
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        form.status === "inactive"
                          ? "bg-gray-500 text-white shadow-sm"
                          : "text-gray-500"
                      }`}
                    >
                      Inactive
                    </span>
                  </button>
                </div>
              </div>

              {form.type === "sub" && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">
                      Parent Category
                    </label>
                    <select
                      value={form.parentId}
                      onChange={(e) =>
                        handleInputChange("parentId", e.target.value)
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    >
                      <option value="">Select a parent category</option>
                      {parentCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">
                      Make Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.makePrice}
                      onChange={(e) =>
                        handleInputChange("makePrice", e.target.value)
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                      placeholder="e.g. 500"
                    />
                  </div>
                </>
              )}

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
                  className="inline-flex items-center rounded-md bg-[#B8860B] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#a37509] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8860B] disabled:opacity-60"
                >
                  {isSubmitting
                    ? form.id
                      ? "Saving..."
                      : "Creating..."
                    : form.id
                    ? "Save Changes"
                    : "Create Category"}
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
                Delete category?
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                This action cannot be undone. If the category has sub-categories
                or linked jewellery items, deletion will be blocked.
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {deleteError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {deleteError}
                </div>
              )}
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

