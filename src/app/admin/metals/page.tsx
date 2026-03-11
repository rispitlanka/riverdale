"use client";

import { useEffect, useState } from "react";

type Metal = {
  id: string;
  name: string;
  basePrice: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  id?: string;
  name: string;
  basePrice: string;
  imageFile?: File | null;
  imagePreview?: string | null;
};

const GOLD_COLOR = "#B8860B";

export default function AdminMetalsPage() {
  const [metals, setMetals] = useState<Metal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    basePrice: "",
    imageFile: undefined,
    imagePreview: undefined,
  });

  useEffect(() => {
    void fetchMetals();
  }, []);

  async function fetchMetals() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/metals");
      if (!res.ok) {
        throw new Error("Failed to load metals");
      }
      const data: Metal[] = await res.json();
      setMetals(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load metals. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setForm({
      name: "",
      basePrice: "",
      imageFile: undefined,
      imagePreview: undefined,
    });
    setIsFormOpen(true);
  }

  function openEditForm(metal: Metal) {
    setForm({
      id: metal.id,
      name: metal.name,
      basePrice:
        metal.basePrice !== undefined && metal.basePrice !== null
          ? String(metal.basePrice)
          : "",
      imageFile: undefined,
      imagePreview: metal.imageUrl ?? null,
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  function handleInputChange<K extends keyof Omit<FormState, "imageFile" | "imagePreview">>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
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
      const priceNumber =
        form.basePrice.trim() === "" ? NaN : Number(form.basePrice);

      if (Number.isNaN(priceNumber)) {
        throw new Error("Please enter a valid base price.");
      }

      const payload: any = {
        name: form.name.trim(),
        basePrice: priceNumber,
      };

      if (form.imagePreview) {
        payload.imageUrl = form.imagePreview;
      }

      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `/api/admin/metals/${form.id}`
        : "/api/admin/metals";
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
        throw new Error(data.error || "Failed to save metal");
      }

      await fetchMetals();
      setIsFormOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save metal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Metals
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage base metals and their standard prices used across your
            jewellery catalogue.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center rounded-md bg-[#B8860B] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a37509] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8860B]"
        >
          + Add Metal
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
                  Metal Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Base Price
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
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading metals...
                  </td>
                </tr>
              ) : metals.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No metals found. Start by adding a new metal.
                  </td>
                </tr>
              ) : (
                metals.map((metal) => (
                  <tr key={metal.id}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center">
                        {metal.imageUrl ? (
                          <img
                            src={metal.imageUrl}
                            alt={metal.name}
                            className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                            {metal.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-900">
                      {metal.name}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-900">
                      CA${metal.basePrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-sm">
                      <button
                        type="button"
                        onClick={() => openEditForm(metal)}
                        className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
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
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {form.id ? "Edit Metal" : "Add Metal"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {form.id
                    ? "Update the metal details below."
                    : "Create a new metal with its base price."}
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
                  Metal Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                  placeholder="e.g. 22K Gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Metal Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-sm text-gray-500">CA$</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.basePrice}
                    onChange={(e) =>
                      handleInputChange("basePrice", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                    placeholder="e.g. 5500"
                  />
                </div>
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
                    : "Create Metal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

