import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { updateBookingStatus } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as { status?: BookingStatus };
  if (!payload.status) {
    return NextResponse.json({ error: "Status is required." }, { status: 400 });
  }

  const { id } = await context.params;
  await updateBookingStatus(id, payload.status);
  return NextResponse.json({ success: true });
}
