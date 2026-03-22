import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { deleteProduct } from "@/lib/store";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteProduct(id);
  return NextResponse.json({ success: true });
}
