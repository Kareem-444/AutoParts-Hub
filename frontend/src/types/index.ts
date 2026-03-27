export interface User {
  id: number;
  username: string;
  email: string;
  is_seller: boolean;
  phone?: string;
  address?: string;
  avatar?: string | null;
  date_joined: string;
  is_staff?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent: number | null;
  children: Category[];
  product_count: number;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Review {
  id: number;
  user: User;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SellerProfile {
  id: number;
  user: User;
  store_name: string;
  description: string;
  logo: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: string | number;
  stock: number;
  condition: "new" | "used" | "refurbished";
  car_make: string;
  car_model: string;
  car_year: string;
  category: Category | number;
  category_name?: string;
  seller: User | number;
  seller_name?: string;
  seller_profile?: SellerProfile;
  primary_image?: string | null;
  images?: ProductImage[];
  reviews?: Review[];
  average_rating: number;
  review_count: number;
  featured: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_title: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total: string;
  shipping_address: string;
  phone: string;
  notes: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}
