"use client";

import { useEffect, useState } from "react";

type TodayPriceInfo = {
  id?: string;
  price: number;
  showOnSite: boolean;
};

type ApiRow = {
  metalId: string;
  name: string;
  basePrice: number;
  todayPrice: TodayPriceInfo | null;
};

type EditableRow = {
  metalId: string;
  name: string;
  basePrice: number;
  priceInput: string;
  showOnSite: boolean;
};

const GOLD_COLOR = "#B8860B";

export default function TodayPriceManagementPage() {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    void fetchTodayPrices();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
    setPage((p) => Math.min(p, pages));
  }, [rows.length, rowsPerPage]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pagedRows = rows.slice(
    (page - 1) * rowsPerPage,
    (page - 1) * rowsPerPage + rowsPerPage
  );

  async function fetchTodayPrices() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/today-prices");
      if (!res.ok) {
        throw new Error("Failed to load today's prices");
      }

      const data: ApiRow[] = await res.json();
      const mapped: EditableRow[] = data.map((row) => ({
        metalId: row.metalId,
        name: row.name,
        basePrice: row.basePrice,
        priceInput:
          row.todayPrice && typeof row.todayPrice.price === "number"
            ? String(row.todayPrice.price)
            : "",
        showOnSite: row.todayPrice ? Boolean(row.todayPrice.showOnSite) : true,
      }));

      setRows(mapped);
    } catch (err) {
      console.error(err);
      setError("Unable to load today's prices. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePriceChange(metalId: string, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.metalId === metalId ? { ...row, priceInput: value } : row
      )
    );
  }

  function handleShowOnSiteChange(metalId: string, value: boolean) {
    setRows((prev) =>
      prev.map((row) =>
        row.metalId === metalId ? { ...row, showOnSite: value } : row
      )
    );
  }

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = rows
      .map((row) => {
        const trimmed = row.priceInput.trim();
        if (trimmed === "") {
          return null;
        }

        const priceNumber = Number(trimmed);
        if (Number.isNaN(priceNumber) || priceNumber < 0) {
          return null;
        }

        return {
          metalId: row.metalId,
          price: priceNumber,
          showOnSite: row.showOnSite,
        };
      })
      .filter(Boolean);

    if (payload.length === 0) {
      setError("Enter at least one valid price before saving.");
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch("/api/admin/today-prices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update today's prices");
      }

      setToast("Today’s prices updated successfully.");
      await fetchTodayPrices();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Failed to update today's prices. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Today&apos;s Metal Prices
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage today&apos;s selling prices for all metals and choose which
            ones appear on the public website.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-4">
        <div className="overflow-hidden rounded-lg bg-white shadow-md border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Metal Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Today&apos;s Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Show on Website
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Loading today&apos;s prices...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No metals found. Add metals first in the Metals section.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={row.metalId}>
                      <td className="px-4 py-3 align-middle text-sm text-gray-900">
                        {row.name}
                        <div className="text-xs text-gray-400">
                          Base price: CA${row.basePrice.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-gray-900">
                        <div className="relative max-w-xs">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-xs text-gray-500">CA$</span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.priceInput}
                            onChange={(e) =>
                              handlePriceChange(row.metalId, e.target.value)
                            }
                            className="block w-full rounded-md border border-gray-300 pl-12 pr-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                            placeholder="Enter price"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-gray-900">
                        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={row.showOnSite}
                            onChange={(e) =>
                              handleShowOnSiteChange(
                                row.metalId,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-[#B8860B] focus:ring-[#B8860B]"
                          />
                          <span>Visible on website</span>
                        </label>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[11px] text-gray-500">
                Showing {(page - 1) * rowsPerPage + 1}–
                {Math.min(page * rowsPerPage, rows.length)} of {rows.length}
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

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving || loading || rows.length === 0}
            className="inline-flex items-center rounded-md text-xs font-semibold shadow-sm px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: GOLD_COLOR,
              color: "white",
            }}
          >
            {isSaving ? "Updating Prices..." : "Update All Prices"}
          </button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-4 right-4 z-40 rounded-md bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

