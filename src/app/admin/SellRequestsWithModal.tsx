'use client';

import { useEffect, useState } from 'react';

function formatDate(date: string | Date | undefined) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase();
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u) || /cloudinary.*\.(jpe?g|png|gif|webp)/i.test(u) || (u.includes('cloudinary') && !u.includes('.pdf'));
}

function DocPreview({ url, label }: { url: string; label: string }) {
  const showPreview = isImageUrl(url);
  return (
    <div className="flex flex-col items-start gap-1">
      {showPreview ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-200 overflow-hidden hover:opacity-90">
          <img src={url} alt={label} className="h-24 w-auto max-w-[200px] object-cover" />
        </a>
      ) : null}
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#9A0156] underline">
        {showPreview ? 'Open full size' : label}
      </a>
    </div>
  );
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_process', label: 'In Process' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

type SellRequestListItem = {
  _id: string;
  referenceNumber: string;
  customerName: string;
  email?: string;
  phone?: string;
  metalType?: string;
  categoryName?: string;
  approximateWeight?: number;
  purity?: string;
  status?: string;
  submittedAt?: string;
  preferredDate?: string;
  preferredTime?: string;
  location?: string;
  pickupPreference?: string;
};

type SellRequestDetail = SellRequestListItem & {
  address?: string;
  description?: string;
  preferredPrice?: number;
  metalPhotos?: string[];
  purchaseInvoice?: string;
  idProof?: { type?: string; documents?: string[] };
  adminNotes?: string;
  quotedPrice?: number;
  submittedAt?: string;
  reviewedAt?: string;
  completedAt?: string;
};

export default function SellRequestsWithModal() {
  const [list, setList] = useState<SellRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SellRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/sell-requests')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/admin/sell-requests/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const updateStatus = (newStatus: string) => {
    if (!selectedId || !detail) return;
    setStatusUpdating(true);
    fetch(`/api/admin/sell-requests/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setDetail(data);
          setList((prev) =>
            prev.map((r) =>
              r._id === selectedId ? { ...r, status: data.status } : r
            )
          );
        }
      })
      .finally(() => setStatusUpdating(false));
  };

  return (
    <>
      <section className="lg:col-span-1 rounded-lg bg-white shadow-md border border-gray-100 overflow-hidden">
        <header className="bg-[#B8860B] px-4 py-3">
          <h3 className="text-sm font-semibold tracking-wide text-white">
            Sell Orders / Sell Metal Requests
          </h3>
          <p className="text-xs text-[#F5DEB3]">
            {list.length} request{list.length === 1 ? '' : 's'}
          </p>
        </header>
        <div className="p-4 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-gray-500">
              No sell requests at this time.
            </p>
          ) : (
            list.map((request) => (
              <article
                key={request._id}
                role="button"
                tabIndex={0}
                onClick={() => openModal(request._id)}
                onKeyDown={(e) => e.key === 'Enter' && openModal(request._id)}
                className="rounded-md border border-gray-100 bg-white px-3 py-3 shadow-sm hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {request.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.metalType ?? '—'} · {request.referenceNumber}
                    </p>
                  </div>
<span className="rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-xs font-medium text-[#B8860B]">
                      {STATUS_OPTIONS.find((o) => o.value === (request.status ?? 'submitted'))?.label ?? request.status}
                    </span>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {formatDate(request.submittedAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Sell order details"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Sell Order Details
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {detailLoading ? (
                <p className="text-sm text-gray-500">Loading details...</p>
              ) : detail ? (
                <>
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Reference
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {detail.referenceNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted {formatDate(detail.submittedAt)}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="modal-status" className="block text-sm font-semibold text-gray-900 mb-2">
                      Update status
                    </label>
                    <select
                      id="modal-status"
                      value={detail.status ?? 'submitted'}
                      onChange={(e) => updateStatus(e.target.value)}
                      disabled={statusUpdating}
                      className="w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#B8860B] focus:outline-none focus:ring-1 focus:ring-[#B8860B] disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {statusUpdating && (
                      <p className="mt-1 text-xs text-gray-500">Updating...</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Customer
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Name:</strong> {detail.customerName}</li>
                      <li><strong>Email:</strong> {detail.email ?? '—'}</li>
                      <li><strong>Phone:</strong> {detail.phone ?? '—'}</li>
                      <li><strong>Address:</strong> {detail.address ?? '—'}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Metal
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Type:</strong> {detail.metalType ?? '—'}</li>
                      <li><strong>Category:</strong> {detail.categoryName ?? '—'}</li>
                      <li><strong>Approx. weight:</strong> {detail.approximateWeight ?? '—'} g</li>
                      <li><strong>Purity:</strong> {detail.purity ?? '—'}</li>
                      {detail.preferredPrice != null && (
                        <li><strong>Preferred price:</strong> CA${Number(detail.preferredPrice).toLocaleString()}</li>
                      )}
                      {detail.description && (
                        <li><strong>Description:</strong> {detail.description}</li>
                      )}
                    </ul>
                  </div>

                  {detail.metalPhotos && detail.metalPhotos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Metal photos
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {detail.metalPhotos.map((url, i) => (
                          <div key={i} className="flex flex-col items-start gap-1">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg border border-gray-200 overflow-hidden hover:opacity-90 bg-gray-50"
                            >
                              <img
                                src={url}
                                alt={`Metal photo ${i + 1}`}
                                className="h-28 w-28 object-cover"
                              />
                            </a>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#9A0156] underline"
                            >
                              Photo {i + 1}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.purchaseInvoice && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Purchase invoice
                      </h4>
                      <DocPreview url={detail.purchaseInvoice} label="View document" />
                    </div>
                  )}

                  {detail.idProof && detail.idProof.documents && detail.idProof.documents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        ID proof ({detail.idProof.type ?? '—'})
                      </h4>
                      <div className="flex flex-wrap gap-4">
                        {detail.idProof.documents.map((url, i) => (
                          <DocPreview
                            key={i}
                            url={url}
                            label={detail.idProof!.documents!.length > 1 ? `Document ${i + 1}` : 'View document'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Pickup & location
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Preference:</strong> {detail.pickupPreference ?? '—'}</li>
                      <li><strong>Location:</strong> {detail.location ?? '—'}</li>
                      <li><strong>Preferred date:</strong> {detail.preferredDate ? formatDate(detail.preferredDate) : '—'}</li>
                      <li><strong>Preferred time:</strong> {detail.preferredTime ?? '—'}</li>
                    </ul>
                  </div>

                  {(detail.quotedPrice != null || detail.adminNotes) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Admin
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {detail.quotedPrice != null && (
                          <li><strong>Quoted price:</strong> CA${Number(detail.quotedPrice).toLocaleString()}</li>
                        )}
                        {detail.adminNotes && (
                          <li><strong>Notes:</strong> {detail.adminNotes}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Could not load details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
