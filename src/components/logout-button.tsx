"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-stone-900 transition hover:-translate-y-0.5 hover:bg-white"
    >
      Log out
    </button>
  );
}
