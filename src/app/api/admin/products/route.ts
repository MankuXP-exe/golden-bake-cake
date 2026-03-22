import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { saveProduct } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    id?: string;
    slug?: string;
    name?: string;
    categoryId?: string;
    description?: string;
    price?: number;
    image?: string;
    badge?: string;
    tags?: string[] | string;
    featured?: boolean;
    available?: boolean;
    prepTime?: string;
  };

  if (!payload.name?.trim() || !payload.categoryId?.trim() || !payload.description?.trim()) {
    return NextResponse.json(
      { error: "Product name, category, and description are required." },
      { status: 400 },
    );
  }

  const tags =
    typeof payload.tags === "string"
      ? payload.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : (payload.tags ?? []).map((item) => item.trim()).filter(Boolean);

  const product = await saveProduct({
    id: payload.id,
    slug: payload.slug,
    name: payload.name,
    categoryId: payload.categoryId,
    description: payload.description,
    price: Number(payload.price ?? 0),
    image: payload.image,
    badge: payload.badge,
    tags,
    featured: Boolean(payload.featured),
    available: payload.available ?? true,
    prepTime: payload.prepTime,
  });

  return NextResponse.json({ success: true, product });
}
