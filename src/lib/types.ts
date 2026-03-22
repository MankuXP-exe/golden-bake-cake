export type Category = {
  id: string;
  name: string;
  description: string;
  accent: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  price: number;
  image?: string;
  badge?: string;
  tags: string[];
  featured: boolean;
  available: boolean;
  prepTime?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  categoryName: string;
};

export type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "out-for-delivery"
  | "completed";

export type BookingStatus =
  | "new"
  | "consulting"
  | "confirmed"
  | "completed";

export type OrderRecord = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  serviceType: "delivery" | "pickup";
  notes: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  items: CartItem[];
  whatsappUrl: string;
};

export type BookingRecord = {
  id: string;
  customerName: string;
  phone: string;
  eventDate: string;
  flavor: string;
  servings: number;
  budget: number;
  designBrief: string;
  notes: string;
  inspirationLabel: string;
  createdAt: string;
  status: BookingStatus;
  whatsappUrl: string;
};

export type StoreData = {
  categories: Category[];
  products: Product[];
  orders: OrderRecord[];
  bookings: BookingRecord[];
};
