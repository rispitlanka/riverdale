import { getAdminDashboardData } from "@/lib/admin-dashboard-service";
import SellRequestsWithModal from "./SellRequestsWithModal";

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
  const { newPurchases, upcomingAppointments } =
    await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of sell orders, purchases, and appointments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sell Orders / Sell Metal Requests – from SellRequest model, modal with full details */}
        <SellRequestsWithModal />

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

