import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminCredentials, isAdminAuthenticated } from "@/lib/auth";

export default async function AdminLoginPage() {
  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    redirect("/admin");
  }

  const credentials = getAdminCredentials();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7ecd2_0%,#fff8ef_46%,#ead8b7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[40px] border border-black/10 bg-white/[0.88] shadow-[0_35px_90px_rgba(24,16,7,0.12)] backdrop-blur-sm lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[linear-gradient(160deg,rgba(24,17,10,0.98),rgba(16,11,7,0.96))] p-8 text-white lg:p-10">
            <p className="text-xs uppercase tracking-[0.34em] text-[#f3d991]">
              Protected admin
            </p>
            <h1 className="mt-5 font-[family:var(--font-display)] text-5xl leading-tight">
              Golden Bake dashboard access.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/[0.72]">
              Use the admin credentials from your environment variables to manage
              the luxury storefront, orders, and booking inquiries.
            </p>
          </div>
          <div className="p-8 lg:p-10">
            <p className="text-xs uppercase tracking-[0.34em] text-stone-500">
              Sign in
            </p>
            <h2 className="mt-4 font-[family:var(--font-display)] text-4xl text-stone-950">
              Enter the control room
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              Default email: {credentials.email}
            </p>
            <div className="mt-8">
              <AdminLoginForm defaultEmail={credentials.email} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
