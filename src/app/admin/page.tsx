import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { LogoutButton } from "@/components/logout-button";
import { isAdminAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const store = await getStore();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f1e6_0%,#fff8ee_48%,#f0dfc0_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[34px] border border-black/10 bg-white/85 p-6 shadow-[0_28px_80px_rgba(27,17,7,0.10)] backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-stone-500">
              Golden Bake & Cakes
            </p>
            <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-950">
              Admin dashboard
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Manage products, orders, and custom cake bookings.
            </p>
          </div>
          <LogoutButton />
        </div>

        <AdminDashboard
          categories={store.categories}
          products={store.products}
          orders={store.orders}
          bookings={store.bookings}
        />
      </div>
    </main>
  );
}
