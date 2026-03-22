"use client";

import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

import { SectionHeading } from "@/components/section-heading";
import {
  featureHighlights,
  galleryItems,
  inspirationOptions,
  menuReferenceImages,
  showcaseCollections,
  siteConfig,
  testimonials,
} from "@/lib/content";
import { formatCurrency } from "@/lib/format";
import type { BookingRecord, Category, OrderRecord, Product } from "@/lib/types";

type SiteClientProps = {
  categories: Category[];
  products: Product[];
};

type OrderFormState = {
  customerName: string;
  phone: string;
  address: string;
  serviceType: "delivery" | "pickup";
  notes: string;
};

type BookingFormState = {
  customerName: string;
  phone: string;
  eventDate: string;
  flavor: string;
  servings: string;
  budget: string;
  inspirationLabel: string;
  designBrief: string;
  notes: string;
};

const navigation = [
  { href: "#story", label: "About" },
  { href: "#showcase", label: "Cakes" },
  { href: "#order", label: "Menu" },
  { href: "#gallery", label: "Gallery" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
];

const storyMetrics = [
  { label: "Google rating", value: "4.7" },
  { label: "Happy reviews", value: "400+" },
  { label: "Signature promise", value: "100% Eggless" },
  { label: "Delivery zone", value: "Across Gurgaon" },
];

const orderFormDefault: OrderFormState = {
  customerName: "",
  phone: "",
  address: "",
  serviceType: "delivery",
  notes: "",
};

const bookingFormDefault: BookingFormState = {
  customerName: "",
  phone: "",
  eventDate: "",
  flavor: "Belgian Chocolate",
  servings: "12",
  budget: "2000",
  inspirationLabel: inspirationOptions[0],
  designBrief: "",
  notes: "",
};

function accentForCategory(categories: Category[], categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.accent ??
    "from-[#f6e6c7] via-[#fff9ef] to-[#d5af67]"
  );
}

function categoryName(categories: Category[], categoryId: string) {
  return (
    categories.find((category) => category.id === categoryId)?.name ?? "Signature"
  );
}

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-6 w-6 text-[#f5db84]"
      fill="none"
    >
      <path
        d="M18 27C18 18.72 24.72 12 33 12C41.28 12 48 18.72 48 27"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M21 28H45L42.5 40H23.5L21 28Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M16 44H50"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25 48H41"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M29 22C30.4 19.8 30.17 17.71 28.5 15.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M37 22C38.4 19.8 38.17 17.71 36.5 15.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SiteClient({ categories, products }: SiteClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderForm, setOrderForm] = useState(orderFormDefault);
  const [bookingForm, setBookingForm] = useState(bookingFormDefault);
  const [orderError, setOrderError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderRecord | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingRecord | null>(null);

  const deferredSearch = useDeferredValue(search);

  const handleScroll = useEffectEvent(() => {
    setScrollY(window.scrollY);
  });

  useEffect(() => {
    function onScroll() {
      handleScroll();
    }

    handleScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -40px 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const visibleProducts = [...products]
    .filter((product) => product.available)
    .filter((product) =>
      activeCategory === "all" ? true : product.categoryId === activeCategory,
    )
    .filter((product) => {
      const query = deferredSearch.trim().toLowerCase();
      if (!query) {
        return true;
      }

      const category = categoryName(categories, product.categoryId).toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        category.includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((left, right) => Number(right.featured) - Number(left.featured));

  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = products.find((entry) => entry.id === productId);
      if (!product || quantity <= 0) {
        return null;
      }

      return {
        productId,
        quantity,
        name: product.name,
        price: product.price,
        categoryName: categoryName(categories, product.categoryId),
      };
    })
    .filter((item) => item !== null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function updateCart(productId: string, nextQuantity: number) {
    setCart((current) => {
      const safeQuantity = Math.max(0, nextQuantity);
      if (safeQuantity === 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return { ...current, [productId]: safeQuantity };
    });
  }

  async function handleOrderSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingOrder(true);
    setOrderError("");
    setOrderSuccess(null);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...orderForm,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      order?: OrderRecord;
    };

    if (!response.ok || !result.order) {
      setOrderError(result.error ?? "Unable to place your order right now.");
      setSubmittingOrder(false);
      return;
    }

    setOrderSuccess(result.order);
    setCart({});
    setSubmittingOrder(false);
    window.open(result.order.whatsappUrl, "_blank", "noopener,noreferrer");
  }

  async function handleBookingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingBooking(true);
    setBookingError("");
    setBookingSuccess(null);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...bookingForm,
        servings: Number(bookingForm.servings),
        budget: Number(bookingForm.budget),
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      booking?: BookingRecord;
    };

    if (!response.ok || !result.booking) {
      setBookingError(result.error ?? "Unable to send your custom cake request.");
      setSubmittingBooking(false);
      return;
    }

    setBookingSuccess(result.booking);
    setSubmittingBooking(false);
    window.open(result.booking.whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="luxury-shell">
      <header className="fixed inset-x-0 top-4 z-50 px-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/40 bg-[rgba(22,16,10,0.58)] px-5 py-3 text-white shadow-[0_20px_60px_rgba(16,10,5,0.24)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4af37]/50 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <BrandMark />
            </div>
            <div>
              <p className="font-[family:var(--font-cinzel)] text-sm uppercase tracking-[0.28em] text-[#f5db84]">
                Golden Bake
              </p>
              <p className="text-xs text-white/70">Luxury bakery in Gurgaon</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/80 lg:flex">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#order"
              className="hidden rounded-full bg-[#d4af37] px-4 py-2 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-[#e3c25a] md:inline-flex"
            >
              Cart ({cartCount})
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white lg:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? "X" : "Menu"}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="mx-auto mt-4 max-w-7xl rounded-[28px] border border-white/30 bg-[rgba(18,12,8,0.92)] p-5 text-white shadow-[0_20px_60px_rgba(16,10,5,0.25)] backdrop-blur-xl lg:hidden">
            <div className="grid gap-3 text-sm">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-white/80 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative isolate min-h-screen overflow-hidden bg-[linear-gradient(135deg,#1f140f_0%,#362116_32%,#7a542e_66%,#f4dfb0_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,220,151,0.34),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,248,235,0.24),transparent_26%),linear-gradient(180deg,rgba(21,14,10,0.08),rgba(21,14,10,0.34))]" />
          <div
            className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-[#d4af37]/26 blur-3xl"
            style={{ transform: `translate3d(0, ${scrollY * 0.14}px, 0)` }}
          />
          <div
            className="pointer-events-none absolute right-[-4rem] top-28 h-[26rem] w-[26rem] rounded-full bg-[#fff4dc]/14 blur-3xl"
            style={{ transform: `translate3d(0, ${scrollY * -0.1}px, 0)` }}
          />
          <div
            className="pointer-events-none absolute bottom-[-6rem] left-[18%] h-64 w-64 rounded-full bg-[#a56f1f]/22 blur-3xl"
            style={{ transform: `translate3d(0, ${scrollY * 0.08}px, 0)` }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent,rgba(16,10,7,0.42))]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:54px_54px]" />

          <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 pb-16 pt-36 md:px-8">
            <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <p className="eyebrow text-[#f5db84]" data-reveal>
                  Gurgaon&apos;s premium bakery atelier
                </p>
                <h1 className="mt-6 font-[family:var(--font-display)] text-5xl leading-[0.95] text-white sm:text-6xl lg:text-8xl" data-reveal>
                  Crafting Sweet Perfection
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl" data-reveal>
                  Premium Cakes & Bakery Experience in Gurgaon. Warm hospitality,
                  luxurious eggless bakes, and designer creations that turn everyday
                  moments into celebrations.
                </p>
                <div className="mt-8 flex flex-wrap gap-4" data-reveal>
                  <a href="#order" className="luxury-button">
                    Order Now
                  </a>
                  <a href="#showcase" className="luxury-button ghost">
                    Explore Menu
                  </a>
                </div>
                <div
                  className="mt-10 flex flex-wrap gap-4 text-sm text-white/[0.82]"
                  data-reveal
                >
                  <span className="pill-dark">4.7 Rating</span>
                  <span className="pill-dark">400+ Reviews</span>
                  <span className="pill-dark">Custom Cakes</span>
                  <span className="pill-dark">Delivery</span>
                  <span className="pill-dark">Dine-in</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                <div
                  className="floating-card ml-auto overflow-hidden rounded-[32px] border border-white/18 bg-[linear-gradient(155deg,rgba(255,250,241,0.18),rgba(255,255,255,0.06))] p-6 text-white shadow-[0_28px_90px_rgba(20,13,8,0.22)] backdrop-blur-xl"
                  data-reveal
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-[#f5db84]/30 bg-[rgba(255,255,255,0.06)] text-[#f5db84]">
                      <BrandMark />
                    </div>
                    <span className="rounded-full border border-[#f5db84]/25 bg-[#f5db84]/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[#f5db84]">
                      Signature
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.32em] text-[#f3d991]">
                    Premium promise
                  </p>
                  <p className="mt-4 text-3xl font-semibold">Eggless luxury, daily.</p>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    Designer cakes, celebratory pastries, and savory comfort food
                    layered with boutique warmth.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] border border-white/12 bg-black/12 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                        Finish
                      </p>
                      <p className="mt-2 text-lg font-semibold">Patisserie look</p>
                    </div>
                    <div className="rounded-[22px] border border-white/12 bg-black/12 p-4">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">
                        Crafted
                      </p>
                      <p className="mt-2 text-lg font-semibold">Daily fresh</p>
                    </div>
                  </div>
                </div>
                <div
                  className="floating-card max-w-sm rounded-[32px] border border-white/16 bg-[linear-gradient(160deg,rgba(255,241,206,0.18),rgba(37,24,16,0.28))] p-6 text-white shadow-[0_24px_70px_rgba(20,13,8,0.18)] backdrop-blur-xl"
                  data-reveal
                >
                  <p className="text-xs uppercase tracking-[0.32em] text-[#f3d991]">
                    Visit us
                  </p>
                  <p className="mt-4 text-xl font-semibold">{siteConfig.address}</p>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    Open daily with fast Gurgaon delivery and celebration-ready custom
                    orders.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
                      Custom cakes
                    </span>
                    <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
                      Fast delivery
                    </span>
                    <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
                      Dine-in
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="story" className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="relative" data-reveal>
              <div className="overflow-hidden rounded-[36px] border border-white/60 shadow-[0_35px_90px_rgba(36,24,11,0.18)]">
                <Image
                  src="/brand-assets/interior-display.webp"
                  alt="Golden Bake & Cakes interior display"
                  width={680}
                  height={480}
                  className="h-auto w-full object-cover transition duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 46vw"
                />
              </div>
              <div className="absolute -bottom-10 right-6 hidden w-52 overflow-hidden rounded-[28px] border border-white/70 shadow-[0_25px_70px_rgba(36,24,11,0.16)] sm:block">
                <Image
                  src="/brand-assets/team-service.webp"
                  alt="Golden Bake & Cakes team outside the store"
                  width={380}
                  height={460}
                  className="h-auto w-full object-cover"
                  sizes="208px"
                />
              </div>
            </div>

            <div className="lg:pl-6">
              <SectionHeading
                eyebrow="Our Story"
                title="At Golden Bake & Cakes, we blend passion with perfection."
                description="From custom celebration cakes to warm bakery comfort food, every order is crafted with emotion, freshness, and a signature premium finish. The feeling is intimate and local, but the presentation is inspired by designer patisserie culture."
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {storyMetrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    data-reveal
                    style={{ transitionDelay: `${index * 80}ms` }}
                    className="rounded-[28px] border border-black/[0.08] bg-white/[0.72] p-5 shadow-[0_20px_50px_rgba(31,18,8,0.08)] backdrop-blur-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                      {metric.label}
                    </p>
                    <p className="mt-3 font-[family:var(--font-display)] text-3xl text-stone-950">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="showcase" className="section-shell pt-0">
          <SectionHeading
            eyebrow="Signature Collections"
            title="Celebration categories with a couture bakery feel."
            description="A curated mix of designer cakes, birthday heroes, pastry indulgence, and bakery snacks that keep Golden Bake & Cakes both luxurious and comforting."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {showcaseCollections.map((collection, index) => (
              <article
                key={collection.title}
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
                className="group overflow-hidden rounded-[34px] border border-white/70 bg-white/75 shadow-[0_25px_70px_rgba(30,18,8,0.10)] backdrop-blur-sm"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/35 bg-[rgba(18,11,8,0.64)] p-4 text-white shadow-[0_12px_30px_rgba(14,9,6,0.28)] backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#f1d785]">
                      {collection.metric}
                    </p>
                    <h3 className="mt-2 font-[family:var(--font-display)] text-2xl">
                      {collection.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {collection.subtitle}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell pt-0">
          <div className="grid gap-6 lg:grid-cols-4">
            {featureHighlights.map((feature, index) => (
              <div
                key={feature.title}
                data-reveal
                style={{ transitionDelay: `${index * 60}ms` }}
                className="rounded-[30px] border border-[#d4af37]/20 bg-[linear-gradient(160deg,rgba(255,248,233,0.95),rgba(246,233,209,0.72))] p-6 shadow-[0_22px_55px_rgba(34,22,10,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.32em] text-[#9a7b1e]">
                  Feature {index + 1}
                </p>
                <h3 className="mt-4 text-2xl font-semibold text-stone-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="order" className="section-shell pt-0">
          <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeading
                eyebrow="Menu & Orders"
                title="Search the full menu, build your cart, and place your order."
                description="Filter by category, add quantities, and send your order to Golden Bake & Cakes with a checkout flow designed for fast bakery service."
              />

              <div className="mt-8 flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_70px_rgba(29,19,8,0.08)] backdrop-blur-sm">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search cakes, burgers, momos, pastries..."
                  className="w-full rounded-full border border-black/[0.08] bg-stone-50 px-5 py-3 text-sm outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/30"
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() => setActiveCategory("all"))
                    }
                    className={`filter-chip ${activeCategory === "all" ? "active" : ""}`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        startTransition(() => setActiveCategory(category.id))
                      }
                      className={`filter-chip ${
                        activeCategory === category.id ? "active" : ""
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {visibleProducts.map((product, index) => (
                  <article
                    key={product.id}
                    data-reveal
                    style={{ transitionDelay: `${(index % 8) * 55}ms` }}
                    className="group overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_22px_60px_rgba(29,18,8,0.08)] backdrop-blur-sm"
                  >
                    <div
                      className={`relative ${
                        product.image ? "aspect-[4/3]" : "min-h-[170px]"
                      } overflow-hidden bg-gradient-to-br ${accentForCategory(
                        categories,
                        product.categoryId,
                      )}`}
                    >
                      {product.image ? (
                        <>
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,11,8,0.65)] to-transparent" />
                        </>
                      ) : (
                        <div className="flex h-full items-end p-6">
                          <div>
                            <p className="text-xs uppercase tracking-[0.32em] text-stone-700/60">
                              {categoryName(categories, product.categoryId)}
                            </p>
                            <p className="mt-3 font-[family:var(--font-display)] text-3xl text-stone-950">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/35 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-900">
                          {categoryName(categories, product.categoryId)}
                        </span>
                        {product.badge ? (
                          <span className="rounded-full border border-[#d4af37]/20 bg-[#1b140d]/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5db84]">
                            {product.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-semibold text-stone-950">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm text-stone-500">
                            {product.prepTime ?? "Made fresh"}
                          </p>
                        </div>
                        <p className="font-[family:var(--font-display)] text-2xl text-[#a27d18]">
                          {formatCurrency(product.price)}
                        </p>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-stone-600">
                        {product.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.22em] text-stone-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4">
                        <div className="inline-flex items-center rounded-full border border-black/10 bg-stone-50 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateCart(product.id, (cart[product.id] ?? 0) - 1)
                            }
                            className="h-9 w-9 rounded-full text-lg text-stone-700 transition hover:bg-white"
                          >
                            -
                          </button>
                          <span className="min-w-10 text-center text-sm font-semibold text-stone-900">
                            {cart[product.id] ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCart(product.id, (cart[product.id] ?? 0) + 1)
                            }
                            className="h-9 w-9 rounded-full text-lg text-stone-700 transition hover:bg-white"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateCart(product.id, (cart[product.id] ?? 0) + 1)
                          }
                          className="rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {menuReferenceImages.map((item, index) => (
                  <div
                    key={item.title}
                    data-reveal
                    style={{ transitionDelay: `${index * 80}ms` }}
                    className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(29,18,8,0.08)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition duration-700 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                        House menu snapshot
                      </p>
                      <p className="mt-2 text-lg font-semibold text-stone-950">
                        {item.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:sticky xl:top-28 xl:self-start">
              <div className="rounded-[34px] border border-[#d4af37]/25 bg-[linear-gradient(160deg,rgba(28,20,12,0.98),rgba(18,12,9,0.92))] p-6 text-white shadow-[0_28px_90px_rgba(18,12,7,0.24)]">
                <p className="text-xs uppercase tracking-[0.32em] text-[#f3d991]">
                  Online order system
                </p>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-semibold">Your cart</h3>
                    <p className="mt-2 text-sm text-white/65">
                      Add quantities, complete checkout, then confirm instantly on
                      WhatsApp.
                    </p>
                  </div>
                  <p className="font-[family:var(--font-display)] text-3xl text-[#f6df8c]">
                    {formatCurrency(cartTotal)}
                  </p>
                </div>

                <div className="mt-6 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                  {cartItems.length ? (
                    cartItems.map((item) => (
                      <div
                        key={item.productId}
                        className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/45">
                              {item.categoryName}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[#f3d991]">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateCart(item.productId, item.quantity - 1)
                            }
                            className="h-8 w-8 rounded-full text-lg transition hover:bg-white/[0.08]"
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCart(item.productId, item.quantity + 1)
                            }
                            className="h-8 w-8 rounded-full text-lg transition hover:bg-white/[0.08]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.04] p-6 text-sm leading-7 text-white/65">
                      Your cart is empty right now. Pick from sandwiches, pizzas,
                      patties, shakes, or premium cakes to begin checkout.
                    </div>
                  )}
                </div>

                <form onSubmit={handleOrderSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-white/75">
                      <span>Name</span>
                      <input
                        value={orderForm.customerName}
                        onChange={(event) =>
                          setOrderForm((current) => ({
                            ...current,
                            customerName: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 outline-none transition focus:border-[#d4af37]"
                        required
                      />
                    </label>
                    <label className="space-y-2 text-sm text-white/75">
                      <span>Phone</span>
                      <input
                        value={orderForm.phone}
                        onChange={(event) =>
                          setOrderForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 outline-none transition focus:border-[#d4af37]"
                        required
                      />
                    </label>
                  </div>

                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] p-1 text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((current) => ({
                          ...current,
                          serviceType: "delivery",
                        }))
                      }
                      className={`rounded-full px-4 py-2 transition ${
                        orderForm.serviceType === "delivery"
                          ? "bg-[#d4af37] text-stone-950"
                          : "text-white/75"
                      }`}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((current) => ({
                          ...current,
                          serviceType: "pickup",
                        }))
                      }
                      className={`rounded-full px-4 py-2 transition ${
                        orderForm.serviceType === "pickup"
                          ? "bg-[#d4af37] text-stone-950"
                          : "text-white/75"
                      }`}
                    >
                      Pickup
                    </button>
                  </div>

                  {orderForm.serviceType === "delivery" ? (
                    <label className="block space-y-2 text-sm text-white/75">
                      <span>Address</span>
                      <textarea
                        value={orderForm.address}
                        onChange={(event) =>
                          setOrderForm((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-3xl border border-white/10 bg-white/[0.08] px-4 py-3 outline-none transition focus:border-[#d4af37]"
                        required
                      />
                    </label>
                  ) : null}

                  <label className="block space-y-2 text-sm text-white/75">
                    <span>Notes</span>
                    <textarea
                      value={orderForm.notes}
                      onChange={(event) =>
                        setOrderForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-3xl border border-white/10 bg-white/[0.08] px-4 py-3 outline-none transition focus:border-[#d4af37]"
                      placeholder="Delivery landmark, birthday note, spice preference..."
                    />
                  </label>

                  {orderError ? (
                    <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                      {orderError}
                    </p>
                  ) : null}

                  {orderSuccess ? (
                    <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-50">
                      Order {orderSuccess.id} saved. Your WhatsApp confirmation is
                      ready.
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submittingOrder || cartItems.length === 0}
                    className="w-full rounded-full bg-[#d4af37] px-5 py-4 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-[#e3c25a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingOrder ? "Placing order..." : "Checkout & Send to WhatsApp"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="section-shell pt-0">
          <SectionHeading
            eyebrow="Gallery"
            title="A visual tasting room of cakes, ambience, and bakery moments."
            description="We used the brand's real storefront, display, menu, and celebration photos to keep the website premium but authentic."
            align="center"
          />

          <div className="mt-12 columns-1 gap-5 md:columns-2 xl:columns-3">
            {galleryItems.map((item, index) => (
              <figure
                key={item.title}
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
                className="group mb-5 break-inside-avoid overflow-hidden rounded-[34px] border border-white/70 bg-white/80 shadow-[0_22px_65px_rgba(29,18,8,0.08)]"
              >
                <div className="relative">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={680}
                    height={860}
                    className="h-auto w-full object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>
                <figcaption className="p-5">
                  <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                    Golden bake moments
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {item.title}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="reviews" className="section-shell pt-0">
          <SectionHeading
            eyebrow="Testimonials"
            title="Guests remember the softness, richness, and service."
            description="The experience is built to feel warm and celebratory from first click to first bite."
            align="center"
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <article
                key={testimonial.quote}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
                className="rounded-[32px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_70px_rgba(29,18,8,0.08)] backdrop-blur-sm"
              >
                <p className="font-[family:var(--font-display)] text-4xl text-[#d4af37]">
                    &quot;
                  </p>
                <p className="mt-4 text-lg leading-8 text-stone-700">
                  {testimonial.quote}
                </p>
                <p className="mt-6 text-xs uppercase tracking-[0.32em] text-stone-500">
                  {testimonial.name}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell pt-0">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="Custom Cake Booking"
                title="Reserve a designer cake with a brief that feels personal and premium."
                description="Tell us the date, flavor, servings, budget, and inspiration. We save the request and open a WhatsApp conversation for quick coordination."
              />

              <div
                className="mt-8 overflow-hidden rounded-[36px] border border-white/70 bg-white/80 shadow-[0_28px_80px_rgba(29,18,8,0.10)]"
                data-reveal
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src="/brand-assets/storefront-outdoor.webp"
                    alt="Golden Bake & Cakes outdoor boutique view"
                    fill
                    className="object-cover transition duration-700 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,11,8,0.68)] to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/30 bg-[rgba(17,11,7,0.6)] p-5 text-white backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.32em] text-[#f1d785]">
                      Celebration concierge
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      Anniversaries, birthdays, proposals, and corporate gifting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleBookingSubmit}
              data-reveal
              className="rounded-[36px] border border-white/70 bg-white/[0.82] p-6 shadow-[0_28px_80px_rgba(29,18,8,0.08)] backdrop-blur-sm"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Name</span>
                  <input
                    value={bookingForm.customerName}
                    onChange={(event) =>
                      setBookingForm((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Phone</span>
                  <input
                    value={bookingForm.phone}
                    onChange={(event) =>
                      setBookingForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Event date</span>
                  <input
                    type="date"
                    value={bookingForm.eventDate}
                    onChange={(event) =>
                      setBookingForm((current) => ({
                        ...current,
                        eventDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Flavor</span>
                  <input
                    value={bookingForm.flavor}
                    onChange={(event) =>
                      setBookingForm((current) => ({
                        ...current,
                        flavor: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Servings</span>
                  <input
                    type="number"
                    min={1}
                    value={bookingForm.servings}
                    onChange={(event) =>
                      setBookingForm((current) => ({
                        ...current,
                        servings: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                </label>
                <label className="space-y-2 text-sm text-stone-700">
                  <span>Budget</span>
                  <input
                    type="number"
                    min={0}
                    value={bookingForm.budget}
                    onChange={(event) =>
                      setBookingForm((current) => ({
                        ...current,
                        budget: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-2 text-sm text-stone-700">
                <span>Inspiration</span>
                <select
                  value={bookingForm.inspirationLabel}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      inspirationLabel: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                >
                  {inspirationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block space-y-2 text-sm text-stone-700">
                <span>Design brief</span>
                <textarea
                  value={bookingForm.designBrief}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      designBrief: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-3xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  placeholder="Theme, colors, text on cake, event mood, reference details..."
                  required
                />
              </label>

              <label className="mt-4 block space-y-2 text-sm text-stone-700">
                <span>Additional notes</span>
                <textarea
                  value={bookingForm.notes}
                  onChange={(event) =>
                    setBookingForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-3xl border border-black/10 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20"
                  placeholder="Preferred delivery slot, allergies, topper note..."
                />
              </label>

              {bookingError ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {bookingError}
                </p>
              ) : null}

              {bookingSuccess ? (
                <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Booking {bookingSuccess.id} saved. WhatsApp is ready for your cake discussion.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submittingBooking}
                className="mt-6 w-full rounded-full bg-stone-950 px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingBooking
                  ? "Sending request..."
                  : "Book Custom Cake on WhatsApp"}
              </button>
            </form>
          </div>
        </section>

        <section id="contact" className="section-shell pt-0">
          <div className="rounded-[40px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,251,243,0.92),rgba(246,231,203,0.82))] p-8 shadow-[0_28px_80px_rgba(29,18,8,0.08)] lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <SectionHeading
                  eyebrow="Contact"
                  title="Visit the boutique or place your next order in minutes."
                  description="Golden Bake & Cakes brings together premium bakery aesthetics, fast comfort food service, and celebration-ready custom work from South City II."
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-black/[0.08] bg-white/[0.72] p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                      Address
                    </p>
                    <p className="mt-3 text-lg font-semibold text-stone-950">
                      {siteConfig.address}
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-black/[0.08] bg-white/[0.72] p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                      Phone
                    </p>
                    <a
                      href={`tel:${siteConfig.phoneDisplay}`}
                      className="mt-3 block text-lg font-semibold text-stone-950"
                    >
                      {siteConfig.phoneDisplay}
                    </a>
                  </div>
                  <div className="rounded-[28px] border border-black/[0.08] bg-white/[0.72] p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                      Hours
                    </p>
                    <p className="mt-3 text-lg font-semibold text-stone-950">
                      {siteConfig.hours}
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-black/[0.08] bg-white/[0.72] p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                      Service
                    </p>
                    <p className="mt-3 text-lg font-semibold text-stone-950">
                      Delivery, pickup, dine-in
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={`https://wa.me/${siteConfig.phoneRaw}`}
                    target="_blank"
                    rel="noreferrer"
                    className="luxury-button"
                  >
                    WhatsApp Now
                  </a>
                  <a href="#order" className="luxury-button ghost light">
                    Start an Order
                  </a>
                </div>
              </div>

              <div
                data-reveal
                className="overflow-hidden rounded-[36px] border border-white/70 shadow-[0_28px_80px_rgba(29,18,8,0.10)]"
              >
                <Image
                  src="/brand-assets/storefront-outdoor.webp"
                  alt="Golden Bake & Cakes contact storefront"
                  width={860}
                  height={760}
                  className="h-auto w-full object-cover transition duration-700 hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 48vw"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.08] px-4 py-8 text-sm text-stone-500 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>
            {siteConfig.brand} - Premium cakes, pastries, snacks, and designer
            celebrations in Gurgaon.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={`tel:${siteConfig.phoneDisplay}`} className="hover:text-stone-900">
              {siteConfig.phoneDisplay}
            </a>
          </div>
        </div>
      </footer>

      <a
        href="#order"
        className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-full bg-stone-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(20,14,9,0.28)] md:hidden"
      >
        <span>{cartCount ? `${cartCount} items in cart` : "Open cart & checkout"}</span>
        <span>{formatCurrency(cartTotal)}</span>
      </a>
    </div>
  );
}
