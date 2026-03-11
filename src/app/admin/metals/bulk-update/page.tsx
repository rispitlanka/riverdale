 "use client";

import { useEffect, useMemo, useState } from "react";

type Metal = {
  id: string;
  name: string;
  basePrice: number;
};

type AdjustmentType = "increase" | "decrease";

const GOLD_COLOR = "#B8860B";

export default function BulkMetalPriceUpdatePage() {
  const [metals, setMetals] = useState<Metal[]>([]);
  const [selectedMetalId, setSelectedMetalId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] =
    useState<AdjustmentType>("increase");
  const [percentage, setPercentage] = useState<string>("");

  const [loadingMetals, setLoadingMetals] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    void fetchMetals();
  }, []);

  async function fetchMetals() {
    try {
      setLoadingMetals(true);
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
      setLoadingMetals(false);
    }
  }

  const selectedMetal = useMemo(
    () => metals.find((m) => m.id === selectedMetalId) ?? null,
    [metals, selectedMetalId]
  );

  const numericPercentage = useMemo(() => {
    if (percentage.trim() === "") return NaN;
    const value = Number(percentage);
    return Number.isNaN(value) ? NaN : value;
  }, [percentage]);

  const previewNewPrice = useMemo(() => {
    if (!selectedMetal || Number.isNaN(numericPercentage)) return null;
    if (numericPercentage < 0.01 || numericPercentage > 100) return null;

    const factor =
      adjustmentType === "increase"
        ? 1 + numericPercentage / 100
        : 1 - numericPercentage / 100;

    const newPrice = selectedMetal.basePrice * factor;
    return Math.round(newPrice * 100) / 100;
  }, [selectedMetal, numericPercentage, adjustmentType]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedMetal) {
      setError("Please select a metal to update.");
      return;
    }

    if (Number.isNaN(numericPercentage)) {
      setError("Please enter a valid percentage.");
      return;
    }

    if (numericPercentage < 0.01 || numericPercentage > 100) {
      setError("Percentage must be between 0.01 and 100.");
      return;
    }

    setShowConfirm(true);
  }

  async function confirmUpdate() {
    if (!selectedMetal || Number.isNaN(numericPercentage)) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/metals/bulk-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metalId: selectedMetal.id,
          adjustmentType,
          percentage: numericPercentage,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to apply bulk update.");
      }

      setSuccess("Bulk price update applied successfully.");
      setShowConfirm(false);

      await fetchMetals();
      if (data?.newBasePrice !== undefined) {
        const updatedPrice = data.newBasePrice;
        setMetals((prev) =>
          prev.map((metal) =>
            metal.id === selectedMetal.id
              ? { ...metal, basePrice: updatedPrice }
              : metal
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to apply bulk update. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Bulk Metal Price Update
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Apply percentage-based adjustments to a metal's base price. This
            will impact all linked jewellery and product pricing.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="rounded-lg bg-white p-5 shadow-md border border-gray-100 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Select Metal
            </label>
            <select
              value={selectedMetalId}
              onChange={(e) => setSelectedMetalId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
              disabled={loadingMetals}
            >
              <option value="">
                {loadingMetals ? "Loading metals..." : "Choose a metal"}
              </option>
              {metals.map((metal) => (
                <option key={metal.id} value={metal.id}>
                  {metal.name} — CA${metal.basePrice.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-700">
              Adjustment Type
            </span>
            <div className="inline-flex rounded-md border border-gray-300 bg-gray-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setAdjustmentType("increase")}
                className={[
                  "px-3 py-1.5 rounded-md font-medium transition-colors",
                  adjustmentType === "increase"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                Increase
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("decrease")}
                className={[
                  "px-3 py-1.5 rounded-md font-medium transition-colors",
                  adjustmentType === "decrease"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                Decrease
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Percentage
            </label>
            <div className="relative rounded-md shadow-sm max-w-xs">
              <input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                placeholder="e.g. 5"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500">
                %
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Allowed range: 0.01% to 100%.
            </p>
          </div>

          <div className="rounded-md bg-gray-50 px-4 py-3 text-xs text-gray-700 border border-dashed border-gray-200">
            {selectedMetal && previewNewPrice !== null ? (
              <p>
                This will change{" "}
                <span className="font-semibold">{selectedMetal.name}</span> price
                from{" "}
                <span className="font-semibold">
                  CA${selectedMetal.basePrice.toLocaleString()}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  CA${previewNewPrice.toLocaleString()}
                </span>
                .
              </p>
            ) : (
              <p>
                Select a metal and enter a valid percentage to see the price
                change preview.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                loadingMetals ||
                !selectedMetal ||
                Number.isNaN(numericPercentage)
              }
              className="inline-flex items-center rounded-md text-xs font-semibold shadow-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: GOLD_COLOR,
                color: "white",
              }}
            >
              {isSubmitting ? "Applying..." : "Apply Bulk Update"}
            </button>
          </div>
        </form>
      </div>

      {showConfirm && selectedMetal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-100">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Confirm Bulk Update
              </h3>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-gray-700">
              <p>
                Are you sure you want to{" "}
                <span className="font-semibold">{adjustmentType}</span> the base
                price of{" "}
                <span className="font-semibold">{selectedMetal.name}</span> by{" "}
                <span className="font-semibold">
                  {Number.isNaN(numericPercentage)
                    ? ""
                    : `${numericPercentage}%`}
                </span>
                ?
              </p>
              {previewNewPrice !== null && (
                <p>
                  This will change the price from{" "}
                    <span className="font-semibold">
                      CA${selectedMetal.basePrice.toLocaleString()}
                    </span>{" "}
                  to{" "}
                    <span className="font-semibold text-gray-900">
                      CA${previewNewPrice.toLocaleString()}
                    </span>
                  .
                </p>
              )}
              <p className="text-xs text-red-600">
                This affects all linked jewellery and product prices.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUpdate}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md text-xs font-semibold shadow-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: GOLD_COLOR,
                  color: "white",
                }}
              >
                {isSubmitting ? "Applying..." : "Yes, Apply Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

