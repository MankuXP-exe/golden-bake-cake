import { NextResponse } from "next/server";

import { siteConfig } from "@/lib/content";
import { createWhatsAppUrl } from "@/lib/format";
import { createBooking } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    customerName?: string;
    phone?: string;
    eventDate?: string;
    flavor?: string;
    servings?: number;
    budget?: number;
    inspirationLabel?: string;
    designBrief?: string;
    notes?: string;
  };

  const customerName = payload.customerName?.trim();
  const phone = payload.phone?.trim();
  const eventDate = payload.eventDate?.trim();
  const flavor = payload.flavor?.trim();
  const servings = Math.max(1, Number(payload.servings ?? 1));
  const budget = Math.max(0, Number(payload.budget ?? 0));
  const inspirationLabel = payload.inspirationLabel?.trim() ?? "Need help deciding";
  const designBrief = payload.designBrief?.trim();
  const notes = payload.notes?.trim() ?? "";

  if (!customerName || !phone || !eventDate || !flavor || !designBrief) {
    return NextResponse.json(
      { error: "Please complete the essential custom cake booking details." },
      { status: 400 },
    );
  }

  const message = [
    `Custom cake booking for ${siteConfig.brand}`,
    `Customer: ${customerName}`,
    `Phone: ${phone}`,
    `Event date: ${eventDate}`,
    `Flavor: ${flavor}`,
    `Servings: ${servings}`,
    `Budget: Rs. ${budget}`,
    `Inspiration: ${inspirationLabel}`,
    "",
    `Design brief: ${designBrief}`,
    `Extra notes: ${notes || "None"}`,
  ].join("\n");

  const booking = await createBooking({
    customerName,
    phone,
    eventDate,
    flavor,
    servings,
    budget,
    designBrief,
    notes,
    inspirationLabel,
    whatsappUrl: createWhatsAppUrl(siteConfig.phoneRaw, message),
  });

  return NextResponse.json({ success: true, booking });
}
