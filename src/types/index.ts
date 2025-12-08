import { Product, Order, OrderItem, User, Influencer, Category, OrderStatus } from '@prisma/client';

export type ProductWithItems = Product & {
  orderItems: OrderItem[];
};

export type OrderWithDetails = Order & {
  user: User;
  items: (OrderItem & {
    product: Product;
  })[];
  influencer: Influencer | null;
};

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface InfluencerStats {
  code: string;
  name: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  commission: number;
  commissionEarned: number;
  active: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  longDesc?: string;
  price: number;
  category: Category;
  featured: boolean;
  active: boolean;
  file?: File;
  image?: File;
}

export interface LoginFormData {
  identifier: string;
  password: string;
  isAdmin?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface CheckoutData {
  productIds: string[];
  influencerCode?: string;
}