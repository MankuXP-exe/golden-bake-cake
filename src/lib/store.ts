import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { neon } from "@neondatabase/serverless";

import { createDefaultStore } from "@/lib/content";
import { createId } from "@/lib/format";
import type {
  BookingRecord,
  BookingStatus,
  OrderRecord,
  OrderStatus,
  Product,
  StoreData,
} from "@/lib/types";

type ProductInput = Omit<Product, "id" | "slug"> & {
  id?: string;
  slug?: string;
};

type OrderInput = Pick<
  OrderRecord,
  "customerName" | "phone" | "address" | "serviceType" | "notes" | "items" | "total" | "whatsappUrl"
>;

type BookingInput = Pick<
  BookingRecord,
  | "customerName"
  | "phone"
  | "eventDate"
  | "flavor"
  | "servings"
  | "budget"
  | "designBrief"
  | "notes"
  | "inspirationLabel"
  | "whatsappUrl"
>;

const DATA_FILE = join(process.cwd(), "data", "store.json");
const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "out-for-delivery",
  "completed",
];
const BOOKING_STATUSES: BookingStatus[] = [
  "new",
  "consulting",
  "confirmed",
  "completed",
];

type GlobalStoreState = typeof globalThis & {
  __goldenBakeStore__?: StoreData;
  __goldenBakeNeonReady__?: Promise<void>;
};

const globalStoreState = globalThis as GlobalStoreState;

function cloneStore(store: StoreData) {
  return structuredClone(store);
}

function getConnectionString() {
  return (
    process.env.DATABASE_URL ??
    process.env.NEON_DATABASE_URL ??
    process.env.POSTGRES_URL ??
    ""
  );
}

function hasRemoteDatabase() {
  return Boolean(getConnectionString());
}

function getSql() {
  return neon(getConnectionString());
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readLocalStore(): Promise<StoreData> {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    return JSON.parse(content) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const fresh = createDefaultStore();
      return persistLocalStore(fresh);
    }

    if (globalStoreState.__goldenBakeStore__) {
      return cloneStore(globalStoreState.__goldenBakeStore__);
    }

    const fallback = createDefaultStore();
    globalStoreState.__goldenBakeStore__ = cloneStore(fallback);
    return fallback;
  }
}

async function persistLocalStore(store: StoreData) {
  const next = cloneStore(store);
  try {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
  } catch {
    globalStoreState.__goldenBakeStore__ = cloneStore(next);
  }

  return next;
}

async function ensureRemoteSchema() {
  if (globalStoreState.__goldenBakeNeonReady__) {
    return globalStoreState.__goldenBakeNeonReady__;
  }

  globalStoreState.__goldenBakeNeonReady__ = (async () => {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        accent TEXT NOT NULL,
        sort_order INTEGER NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        image TEXT,
        badge TEXT,
        tags TEXT NOT NULL,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        available BOOLEAN NOT NULL DEFAULT TRUE,
        prep_time TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        service_type TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL,
        total INTEGER NOT NULL,
        items TEXT NOT NULL,
        whatsapp_url TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        event_date TEXT NOT NULL,
        flavor TEXT NOT NULL,
        servings INTEGER NOT NULL,
        budget INTEGER NOT NULL,
        design_brief TEXT NOT NULL,
        notes TEXT NOT NULL,
        inspiration_label TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL,
        whatsapp_url TEXT NOT NULL
      )
    `;

    const [categoryCount] = (await sql`
      SELECT COUNT(*)::text AS count FROM categories
    `) as { count: string }[];
    const [productCount] = (await sql`
      SELECT COUNT(*)::text AS count FROM products
    `) as { count: string }[];

    const seed = createDefaultStore();

    if (Number(categoryCount?.count ?? "0") === 0) {
      for (const category of seed.categories) {
        await sql`
          INSERT INTO categories (id, name, description, accent, sort_order)
          VALUES (
            ${category.id},
            ${category.name},
            ${category.description},
            ${category.accent},
            ${category.sortOrder}
          )
        `;
      }
    }

    if (Number(productCount?.count ?? "0") === 0) {
      for (const product of seed.products) {
        await sql`
          INSERT INTO products (
            id,
            slug,
            name,
            category_id,
            description,
            price,
            image,
            badge,
            tags,
            featured,
            available,
            prep_time
          )
          VALUES (
            ${product.id},
            ${product.slug},
            ${product.name},
            ${product.categoryId},
            ${product.description},
            ${product.price},
            ${product.image ?? null},
            ${product.badge ?? null},
            ${JSON.stringify(product.tags)},
            ${product.featured},
            ${product.available},
            ${product.prepTime ?? null}
          )
        `;
      }
    }
  })();

  return globalStoreState.__goldenBakeNeonReady__;
}

export async function getStore(): Promise<StoreData> {
  if (!hasRemoteDatabase()) {
    return readLocalStore();
  }

  await ensureRemoteSchema();

  const sql = getSql();

  const categories = (await sql`
    SELECT id, name, description, accent, sort_order
    FROM categories
    ORDER BY sort_order ASC
  `) as {
    id: string;
    name: string;
    description: string;
    accent: string;
    sort_order: number;
  }[];

  const products = (await sql`
    SELECT
      id,
      slug,
      name,
      category_id,
      description,
      price,
      image,
      badge,
      tags,
      featured,
      available,
      prep_time
    FROM products
    ORDER BY name ASC
  `) as {
    id: string;
    slug: string;
    name: string;
    category_id: string;
    description: string;
    price: number;
    image: string | null;
    badge: string | null;
    tags: string;
    featured: boolean;
    available: boolean;
    prep_time: string | null;
  }[];

  const orders = (await sql`
    SELECT
      id,
      customer_name,
      phone,
      address,
      service_type,
      notes,
      created_at,
      status,
      total,
      items,
      whatsapp_url
    FROM orders
    ORDER BY created_at DESC
  `) as {
    id: string;
    customer_name: string;
    phone: string;
    address: string;
    service_type: OrderRecord["serviceType"];
    notes: string;
    created_at: string;
    status: OrderStatus;
    total: number;
    items: string;
    whatsapp_url: string;
  }[];

  const bookings = (await sql`
    SELECT
      id,
      customer_name,
      phone,
      event_date,
      flavor,
      servings,
      budget,
      design_brief,
      notes,
      inspiration_label,
      created_at,
      status,
      whatsapp_url
    FROM bookings
    ORDER BY created_at DESC
  `) as {
    id: string;
    customer_name: string;
    phone: string;
    event_date: string;
    flavor: string;
    servings: number;
    budget: number;
    design_brief: string;
    notes: string;
    inspiration_label: string;
    created_at: string;
    status: BookingStatus;
    whatsapp_url: string;
  }[];

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      accent: category.accent,
      sortOrder: category.sort_order,
    })),
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryId: product.category_id,
      description: product.description,
      price: Number(product.price),
      image: product.image ?? undefined,
      badge: product.badge ?? undefined,
      tags: JSON.parse(product.tags) as string[],
      featured: product.featured,
      available: product.available,
      prepTime: product.prep_time ?? undefined,
    })),
    orders: orders.map((order) => ({
      id: order.id,
      customerName: order.customer_name,
      phone: order.phone,
      address: order.address,
      serviceType: order.service_type,
      notes: order.notes,
      createdAt: order.created_at,
      status: order.status,
      total: Number(order.total),
      items: JSON.parse(order.items) as OrderRecord["items"],
      whatsappUrl: order.whatsapp_url,
    })),
    bookings: bookings.map((booking) => ({
      id: booking.id,
      customerName: booking.customer_name,
      phone: booking.phone,
      eventDate: booking.event_date,
      flavor: booking.flavor,
      servings: Number(booking.servings),
      budget: Number(booking.budget),
      designBrief: booking.design_brief,
      notes: booking.notes,
      inspirationLabel: booking.inspiration_label,
      createdAt: booking.created_at,
      status: booking.status,
      whatsappUrl: booking.whatsapp_url,
    })),
  };
}

export async function createOrder(input: OrderInput) {
  const order: OrderRecord = {
    id: createId("ord"),
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    serviceType: input.serviceType,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    status: "new",
    total: input.total,
    items: input.items,
    whatsappUrl: input.whatsappUrl,
  };

  if (!hasRemoteDatabase()) {
    const store = await readLocalStore();
    store.orders.unshift(order);
    await persistLocalStore(store);
    return order;
  }

  await ensureRemoteSchema();
  const sql = getSql();

  await sql`
    INSERT INTO orders (
      id,
      customer_name,
      phone,
      address,
      service_type,
      notes,
      created_at,
      status,
      total,
      items,
      whatsapp_url
    )
    VALUES (
      ${order.id},
      ${order.customerName},
      ${order.phone},
      ${order.address},
      ${order.serviceType},
      ${order.notes},
      ${order.createdAt},
      ${order.status},
      ${order.total},
      ${JSON.stringify(order.items)},
      ${order.whatsappUrl}
    )
  `;

  return order;
}

export async function createBooking(input: BookingInput) {
  const booking: BookingRecord = {
    id: createId("bok"),
    customerName: input.customerName,
    phone: input.phone,
    eventDate: input.eventDate,
    flavor: input.flavor,
    servings: input.servings,
    budget: input.budget,
    designBrief: input.designBrief,
    notes: input.notes,
    inspirationLabel: input.inspirationLabel,
    createdAt: new Date().toISOString(),
    status: "new",
    whatsappUrl: input.whatsappUrl,
  };

  if (!hasRemoteDatabase()) {
    const store = await readLocalStore();
    store.bookings.unshift(booking);
    await persistLocalStore(store);
    return booking;
  }

  await ensureRemoteSchema();
  const sql = getSql();

  await sql`
    INSERT INTO bookings (
      id,
      customer_name,
      phone,
      event_date,
      flavor,
      servings,
      budget,
      design_brief,
      notes,
      inspiration_label,
      created_at,
      status,
      whatsapp_url
    )
    VALUES (
      ${booking.id},
      ${booking.customerName},
      ${booking.phone},
      ${booking.eventDate},
      ${booking.flavor},
      ${booking.servings},
      ${booking.budget},
      ${booking.designBrief},
      ${booking.notes},
      ${booking.inspirationLabel},
      ${booking.createdAt},
      ${booking.status},
      ${booking.whatsappUrl}
    )
  `;

  return booking;
}

export async function saveProduct(input: ProductInput) {
  const product: Product = {
    id: input.id ?? createId("prd"),
    slug: input.slug ? slugify(input.slug) : slugify(input.name),
    name: input.name.trim(),
    categoryId: input.categoryId,
    description: input.description.trim(),
    price: Number(input.price),
    image: input.image?.trim() || undefined,
    badge: input.badge?.trim() || undefined,
    tags: input.tags,
    featured: Boolean(input.featured),
    available: Boolean(input.available),
    prepTime: input.prepTime?.trim() || undefined,
  };

  if (!hasRemoteDatabase()) {
    const store = await readLocalStore();
    const index = store.products.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      store.products[index] = product;
    } else {
      store.products.unshift(product);
    }
    await persistLocalStore(store);
    return product;
  }

  await ensureRemoteSchema();
  const sql = getSql();

  await sql`
    INSERT INTO products (
      id,
      slug,
      name,
      category_id,
      description,
      price,
      image,
      badge,
      tags,
      featured,
      available,
      prep_time
    )
    VALUES (
      ${product.id},
      ${product.slug},
      ${product.name},
      ${product.categoryId},
      ${product.description},
      ${product.price},
      ${product.image ?? null},
      ${product.badge ?? null},
      ${JSON.stringify(product.tags)},
      ${product.featured},
      ${product.available},
      ${product.prepTime ?? null}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      slug = EXCLUDED.slug,
      name = EXCLUDED.name,
      category_id = EXCLUDED.category_id,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      image = EXCLUDED.image,
      badge = EXCLUDED.badge,
      tags = EXCLUDED.tags,
      featured = EXCLUDED.featured,
      available = EXCLUDED.available,
      prep_time = EXCLUDED.prep_time
  `;

  return product;
}

export async function deleteProduct(productId: string) {
  if (!hasRemoteDatabase()) {
    const store = await readLocalStore();
    store.products = store.products.filter((product) => product.id !== productId);
    await persistLocalStore(store);
    return;
  }

  await ensureRemoteSchema();
  const sql = getSql();
  await sql`DELETE FROM products WHERE id = ${productId}`;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid order status");
  }

  if (!hasRemoteDatabase()) {
    const store = await readLocalStore();
    store.orders = store.orders.map((order) =>
      order.id === orderId ? { ...order, status } : order,
    );
    await persistLocalStore(store);
    return;
  }

  await ensureRemoteSchema();
  const sql = getSql();
  await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new Error("Invalid booking status");
  }

  if (!hasRemoteDatabase()) {
    const store = await readLocalStore();
    store.bookings = store.bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, status } : booking,
    );
    await persistLocalStore(store);
    return;
  }

  await ensureRemoteSchema();
  const sql = getSql();
  await sql`UPDATE bookings SET status = ${status} WHERE id = ${bookingId}`;
}
