"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  BookingRecord,
  BookingStatus,
  Category,
  OrderRecord,
  OrderStatus,
  Product,
} from "@/lib/types";

type AdminDashboardProps = {
  categories: Category[];
  products: Product[];
  orders: OrderRecord[];
  bookings: BookingRecord[];
};

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: string;
  image: string;
  badge: string;
  tags: string;
  prepTime: string;
  featured: boolean;
  available: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  categoryId: "sandwich",
  description: "",
  price: "",
  image: "",
  badge: "",
  tags: "",
  prepTime: "",
  featured: false,
  available: true,
};

const orderStatuses: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "out-for-delivery",
  "completed",
];

const bookingStatuses: BookingStatus[] = [
  "new",
  "consulting",
  "confirmed",
  "completed",
];

export function AdminDashboard({
  categories,
  products,
  orders,
  bookings,
}: AdminDashboardProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  function fillForm(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      description: product.description,
      price: String(product.price),
      image: product.image ?? "",
      badge: product.badge ?? "",
      tags: product.tags.join(", "),
      prepTime: product.prepTime ?? "",
      featured: product.featured,
      available: product.available,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
  }

  async function handleSaveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price || 0),
      }),
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Unable to save product.");
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDeleteProduct(productId: string) {
    setBusyId(productId);
    await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
    });
    setBusyId("");
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleOrderStatus(orderId: string, status: OrderStatus) {
    setBusyId(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    setBusyId("");
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleBookingStatus(bookingId: string, status: BookingStatus) {
    setBusyId(bookingId);
    await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    setBusyId("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] border border-black/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(30,19,8,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Products
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{products.length}</p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(30,19,8,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Orders
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{orders.length}</p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(30,19,8,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Bookings
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{bookings.length}</p>
        </div>
        <div className="rounded-[28px] border border-black/10 bg-white/85 p-5 shadow-[0_20px_60px_rgba(30,19,8,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Revenue
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{formatCurrency(revenue)}</p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSaveProduct}
          className="space-y-4 rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_30px_90px_rgba(27,17,7,0.12)]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                Product manager
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                {form.id ? "Edit catalog item" : "Add a new catalog item"}
              </h2>
            </div>
            {form.id ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Clear form
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-stone-700">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                placeholder="Optional"
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Category</span>
              <select
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Price (INR)</span>
              <input
                type="number"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                min={0}
                required
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Image path</span>
              <input
                value={form.image}
                onChange={(event) =>
                  setForm((current) => ({ ...current, image: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                placeholder="/brand-assets/cake-rainbow-luxe.webp"
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Badge</span>
              <input
                value={form.badge}
                onChange={(event) =>
                  setForm((current) => ({ ...current, badge: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                placeholder="Best seller"
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Tags</span>
              <input
                value={form.tags}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tags: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                placeholder="veg, premium, popular"
              />
            </label>
            <label className="space-y-2 text-sm text-stone-700">
              <span>Prep time</span>
              <input
                value={form.prepTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, prepTime: event.target.value }))
                }
                className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
                placeholder="18 mins"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-stone-700">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              className="w-full rounded-3xl border border-black/10 bg-stone-50 px-4 py-3 outline-none focus:border-[#d4af37]"
              required
            />
          </label>

          <div className="flex flex-wrap gap-4 text-sm text-stone-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({ ...current, featured: event.target.checked }))
                }
              />
              Featured item
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(event) =>
                  setForm((current) => ({ ...current, available: event.target.checked }))
                }
              />
              Available now
            </label>
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : form.id ? "Update product" : "Create product"}
          </button>
        </form>

        <div className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_30px_90px_rgba(27,17,7,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                Catalog
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                Current menu inventory
              </h2>
            </div>
            <p className="text-sm text-stone-500">{products.length} active entries</p>
          </div>

          <div className="mt-6 space-y-3">
            {products.map((product) => {
              const categoryName =
                categories.find((category) => category.id === product.categoryId)?.name ??
                "Unknown";

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-black/[0.08] bg-stone-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">{product.name}</p>
                      <p className="text-sm text-stone-500">
                        {categoryName} · {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fillForm(product)}
                        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={busyId === product.id}
                        className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-stone-600">{product.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_30px_90px_rgba(27,17,7,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                Orders
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                Incoming online orders
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {orders.length ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[24px] border border-black/[0.08] bg-stone-50/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-stone-500">
                        {formatDateTime(order.createdAt)} · {formatCurrency(order.total)}
                      </p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        handleOrderStatus(order.id, event.target.value as OrderStatus)
                      }
                      disabled={busyId === order.id}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-3 text-sm text-stone-600">
                    {order.phone} · {order.address}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-stone-600">
                    {order.items.map((item) => (
                      <li key={item.productId}>
                        {item.name} x{item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-black/10 bg-stone-50/70 p-6 text-sm text-stone-500">
                Orders will appear here after customers complete checkout.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-[0_30px_90px_rgba(27,17,7,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                Bookings
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                Custom cake requests
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {bookings.length ? (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[24px] border border-black/[0.08] bg-stone-50/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">
                        {booking.customerName}
                      </p>
                      <p className="text-sm text-stone-500">
                        Event {booking.eventDate} · {formatCurrency(booking.budget)}
                      </p>
                    </div>
                    <select
                      value={booking.status}
                      onChange={(event) =>
                        handleBookingStatus(
                          booking.id,
                          event.target.value as BookingStatus,
                        )
                      }
                      disabled={busyId === booking.id}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
                    >
                      {bookingStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-3 text-sm text-stone-600">
                    {booking.phone} · {booking.flavor} · {booking.servings} servings
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {booking.designBrief}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-black/10 bg-stone-50/70 p-6 text-sm text-stone-500">
                Custom cake leads will appear here after visitors submit the booking form.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
