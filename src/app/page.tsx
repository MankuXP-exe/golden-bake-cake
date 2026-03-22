import { SiteClient } from "@/components/site-client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();

  return <SiteClient categories={store.categories} products={store.products} />;
}
