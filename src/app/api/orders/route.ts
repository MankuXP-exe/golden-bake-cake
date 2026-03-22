import { NextResponse } from "next/server";

import { siteConfig } from "@/lib/content";
import { createWhatsAppUrl } from "@/lib/format";
import { createOrder, getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    customerName?: string;
    phone?: string;
    address?: string;
    serviceType?: "delivery" | "pickup";
    notes?: string;
    items?: Array<{ productId?: string; quantity?: number }>;
  };

  const customerName = payload.customerName?.trim();
  const phone = payload.phone?.trim();
  const address = payload.address?.trim() ?? "";
  const serviceType = payload.serviceType ?? "delivery";
  const notes = payload.notes?.trim() ?? "";
  const requestedItems = payload.items ?? [];

  if (!customerName || !phone || requestedItems.length === 0) {
    return NextResponse.json(
      { error: "Customer name, phone, and at least one cart item are required." },
      { status: 400 },
    );
  }

  const store = await getStore();

  const items = requestedItems
    .map((item) => {
      const product = store.products.find((entry) => entry.id === item.productId);
      const category = store.categories.find(
        (entry) => entry.id === product?.categoryId,
      );
      const quantity = Math.max(1, Number(item.quantity ?? 1));

      if (!product || !category) {
        return null;
      }

      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        categoryName: category.name,
      };
    })
    .filter((item) => item !== null);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Selected products could not be matched with the catalog." },
      { status: 400 },
    );
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = items
    .map(
      (item) =>
        `- ${item.name} x${item.quantity} (${item.categoryName}) - Rs. ${item.price * item.quantity}`,
    )
    .join("\n");

  const message = [
    `New order for ${siteConfig.brand}`,
    `Customer: ${customerName}`,
    `Phone: ${phone}`,
    `Service: ${serviceType}`,
    `Address: ${address || "Pickup at store"}`,
    "",
    "Items:",
    lines,
    "",
    `Notes: ${notes || "None"}`,
    `Total: Rs. ${total}`,
  ].join("\n");

  const order = await createOrder({
    customerName,
    phone,
    address: serviceType === "pickup" ? "Pickup at store" : address,
    serviceType,
    notes,
    items,
    total,
    whatsappUrl: createWhatsAppUrl(siteConfig.phoneRaw, message),
  });

  return NextResponse.json({ success: true, order });
}
