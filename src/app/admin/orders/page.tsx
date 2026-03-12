"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
type OrderStatus = "new" | "processing" | "shipped" | "delivered" | "cancelled";

type OrderListItem = {
  id: string;
  orderRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
};

type OrdersApiResponse = {
  data: OrderListItem[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

const GOLD_COLOR = "#B8860B";

type OrderDetail = {
  id: string;
  orderRef: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string | null;
  updatedAt: string | null;
  shippingAddress: any | null;
  address: any | null;
  items: any[];
};

function paymentStatusBadgeClasses(status: PaymentStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-50 text-yellow-800 ring-yellow-200";
    case "paid":
      return "bg-green-50 text-green-700 ring-green-200";
    case "failed":
      return "bg-red-50 text-red-700 ring-red-200";
    case "refunded":
      return "bg-gray-100 text-gray-700 ring-gray-300";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-200";
  }
}

function orderStatusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "processing":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "shipped":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "delivered":
      return "bg-green-50 text-green-700 ring-green-200";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-200";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [statusModalOrder, setStatusModalOrder] = useState<OrderListItem | null>(
    null
  );
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [viewOrderDetail, setViewOrderDetail] = useState<OrderDetail | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const hasFilters = useMemo(
    () => !!orderStatusFilter || !!paymentStatusFilter,
    [orderStatusFilter, paymentStatusFilter]
  );

  useEffect(() => {
    void fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, orderStatusFilter, paymentStatusFilter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (orderStatusFilter) params.set("orderStatus", orderStatusFilter);
      if (paymentStatusFilter)
        params.set("paymentStatus", paymentStatusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to load orders");
      }

      const data: OrdersApiResponse = await res.json();

      setOrders(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err) {
      console.error(err);
      setError("Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeOrderStatusFilter(value: string) {
    setPage(1);
    setOrderStatusFilter(value);
  }

  function handleChangePaymentStatusFilter(value: string) {
    setPage(1);
    setPaymentStatusFilter(value);
  }

  function openStatusModal(order: OrderListItem) {
    setStatusModalOrder(order);
    setSelectedStatus(order.orderStatus);
  }

  function closeStatusModal() {
    setStatusModalOrder(null);
    setSelectedStatus("");
  }

  async function openViewModal(orderId: string) {
    setViewOrderId(orderId);
    setViewOrderDetail(null);
    setIsLoadingDetail(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load order details");
      }
      const data: OrderDetail = await res.json();
      setViewOrderDetail(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load order details");
      setViewOrderId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function closeViewModal() {
    setViewOrderId(null);
    setViewOrderDetail(null);
    setIsLoadingDetail(false);
  }

  async function handleUpdateStatus() {
    if (!statusModalOrder || !selectedStatus) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const res = await fetch(
        `/api/admin/orders/${statusModalOrder.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update order status");
      }

      await fetchOrders();
      closeStatusModal();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Failed to update order status. Please try again."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function formatAddress(detail: OrderDetail): string {
    const addr = detail.shippingAddress;
    if (addr && typeof addr === "object") {
      const street = typeof addr.street === "string" ? addr.street.trim() : "";
      const city = typeof addr.city === "string" ? addr.city.trim() : "";
      const state = typeof addr.state === "string" ? addr.state.trim() : "";
      const zip = typeof addr.zipCode === "string" ? addr.zipCode.trim() : "";
      const country =
        typeof addr.country === "string" ? addr.country.trim() : "";

      const line1 = street;
      const line2 = [city, state, zip].filter(Boolean).join(", ");
      const line3 = country;

      const lines = [line1, line2, line3].filter(Boolean);
      if (lines.length > 0) return lines.join("\n");
    }

    if (detail.address != null) {
      return String(detail.address);
    }

    return "—";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Orders
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review customer orders, track payment and fulfillment status.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Order Status
            </label>
            <select
              value={orderStatusFilter}
              onChange={(e) => handleChangeOrderStatusFilter(e.target.value)}
              className="block w-40 rounded-md border border-gray-300 px-3 py-1.5 text-xs shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
            >
              <option value="">All</option>
              <option value="new">New</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) =>
                handleChangePaymentStatusFilter(e.target.value)
              }
              className="block w-40 rounded-md border border-gray-300 px-3 py-1.5 text-xs shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setOrderStatusFilter("");
                setPaymentStatusFilter("");
                setPage(1);
              }}
              className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
          <div className="text-[11px] text-gray-500">
            Showing page {page} of {totalPages} ({totalItems} orders)
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-md border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order Ref
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order Date
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
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 align-middle text-sm font-medium text-gray-900">
                      {order.orderRef}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-sm text-gray-900">
                      CA$
                      {order.totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${paymentStatusBadgeClasses(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() +
                          order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${orderStatusBadgeClasses(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus.charAt(0).toUpperCase() +
                          order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-gray-700">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-sm">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(order.id)}
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                          title="View"
                        >
                          <span className="sr-only">View</span>
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openStatusModal(order)}
                          className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((prev) => (prev < totalPages ? prev + 1 : prev))
              }
              disabled={page >= totalPages || loading}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {statusModalOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Update Order Status
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {statusModalOrder.orderRef} — {statusModalOrder.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStatusModal}
                className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>×
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as OrderStatus | "")
                  }
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B]"
                >
                  <option value="">Select status</option>
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={!selectedStatus || isUpdatingStatus}
                  className="inline-flex items-center rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                  style={{
                    backgroundColor: GOLD_COLOR,
                  }}
                >
                  {isUpdatingStatus ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewOrderId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Order Details
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {viewOrderDetail?.orderRef ?? "—"} —{" "}
                  {viewOrderDetail?.customerName ?? "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>×
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {isLoadingDetail ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading order details...
                </div>
              ) : !viewOrderDetail ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Unable to load details.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-gray-200 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Order Ref
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {viewOrderDetail.orderRef ?? "—"}
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Order Date
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {viewOrderDetail.createdAt
                          ? formatDate(viewOrderDetail.createdAt)
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Customer Name
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {viewOrderDetail.customerName || "—"}
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Total Amount
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        CA$
                        {viewOrderDetail.totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Payment Status
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${paymentStatusBadgeClasses(
                            viewOrderDetail.paymentStatus
                          )}`}
                        >
                          {viewOrderDetail.paymentStatus
                            .charAt(0)
                            .toUpperCase() +
                            viewOrderDetail.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Order Status
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${orderStatusBadgeClasses(
                            viewOrderDetail.orderStatus
                          )}`}
                        >
                          {viewOrderDetail.orderStatus
                            .charAt(0)
                            .toUpperCase() +
                            viewOrderDetail.orderStatus.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3 sm:col-span-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Contact
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        <div>
                          <span className="text-gray-500">Email:</span>{" "}
                          {viewOrderDetail.customerEmail || "—"}
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>{" "}
                          {viewOrderDetail.customerPhone || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-gray-200 p-3 sm:col-span-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Address
                      </div>
                      <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {formatAddress(viewOrderDetail)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Items
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Type
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {viewOrderDetail.items.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-4 text-center text-sm text-gray-500"
                              >
                                No items found.
                              </td>
                            </tr>
                          ) : (
                            viewOrderDetail.items.map((it: any, idx: number) => (
                              <tr key={`${idx}-${it?.itemId ?? "item"}`}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {it?.name ?? "—"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {it?.itemType ?? "—"}
                                </td>
                                <td className="px-4 py-2 text-right text-sm text-gray-700">
                                  {typeof it?.quantity === "number"
                                    ? it.quantity
                                    : Number(it?.quantity ?? 0)}
                                </td>
                                <td className="px-4 py-2 text-right text-sm text-gray-700">
                                  CA$
                                  {Number(it?.unitPrice ?? 0).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right text-sm text-gray-900">
                                  CA$
                                  {Number(it?.subtotal ?? 0).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

