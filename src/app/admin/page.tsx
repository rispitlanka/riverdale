import { getAdminDashboardData } from "@/lib/admin-dashboard-service";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDashboardPage() {
  const { sellMetalRequests, newPurchases, upcomingAppointments } =
    await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of new sell metal requests, purchases, and appointments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sell Metal Requests */}
        <section className="lg:col-span-1 rounded-lg bg-white shadow-md border border-gray-100 overflow-hidden">
          <header className="bg-[#B8860B] px-4 py-3">
            <h3 className="text-sm font-semibold tracking-wide text-white">
              Sell Metal Requests
            </h3>
            <p className="text-xs text-[#F5DEB3]">
              {sellMetalRequests.count} new request
              {sellMetalRequests.count === 1 ? "" : "s"}
            </p>
          </header>
          <div className="p-4 space-y-3">
            {sellMetalRequests.count === 0 ? (
              <p className="text-sm text-gray-500">
                No new sell metal requests at this time.
              </p>
            ) : (
              sellMetalRequests.items.map((request, idx) => (
                <article
                  key={`${request.customerName}-${idx}`}
                  className="rounded-md border border-gray-100 bg-white px-3 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.metalType ?? "Metal type not specified"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-xs font-medium text-[#B8860B]">
                      New
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDate(request.date)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        {/* New Purchases */}
        {newPurchases.count > 0 && (
          <section className="lg:col-span-1 rounded-lg bg-white shadow-md border border-gray-100 overflow-hidden">
            <header className="bg-[#B8860B] px-4 py-3">
              <h3 className="text-sm font-semibold tracking-wide text-white">
                New Purchases
              </h3>
              <p className="text-xs text-[#F5DEB3]">
                {newPurchases.count} pending payment
                {newPurchases.count === 1 ? "" : "s"}
              </p>
            </header>
            <div className="p-4 space-y-3">
              {newPurchases.items.map((purchase) => (
                <article
                  key={purchase.orderId}
                  className="rounded-md border border-gray-100 bg-white px-3 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Order #{purchase.orderId}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {purchase.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        CA${purchase.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(purchase.date)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Appointments */}
        <section className="lg:col-span-1 rounded-lg bg-white shadow-md border border-gray-100 overflow-hidden">
          <header className="bg-[#B8860B] px-4 py-3">
            <h3 className="text-sm font-semibold tracking-wide text-white">
              Upcoming Appointments
            </h3>
            <p className="text-xs text-[#F5DEB3]">
              {upcomingAppointments.length} scheduled
            </p>
          </header>
          <div className="p-4 space-y-3">
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No upcoming appointments scheduled.
              </p>
            ) : (
              upcomingAppointments.map((appt) => (
                <article
                  key={appt.id}
                  className="rounded-md border border-gray-100 bg-white px-3 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {appt.customerName}
                      </p>
                      <p className="text-xs text-gray-500">{appt.phone}</p>
                    </div>
                    <span className="rounded-full bg-[#B8860B]/10 px-2 py-0.5 text-xs font-medium text-[#B8860B] capitalize">
                      {appt.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(appt.date)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{appt.purpose}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

