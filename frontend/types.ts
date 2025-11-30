
export enum VerticalType {
  DEALS = 'DEALS',
  RURAL = 'RURAL',
  MAKERS = 'MAKERS',
}

export type Language = 'en' | 'hi' | 'te' | 'ta';

export interface SellerProfile {
  businessName: string;
  businessType: string; // Grocery, Bakery, Restaurant, etc.
  email: string;
  storeAddress: string;
  storePhone: string;
  openingTime: string;
  closingTime: string;
  productTypes: string[];
  isVerified: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'consumer' | 'retailer' | 'rural_seller' | 'maker' | 'admin';
  address: string;
  coins: number;
  sellerProfile?: SellerProfile;
  myProducts?: string[]; // IDs of products listed by this user
}

export interface Store {
  id: string;
  name: string;
  ownerId: string;
  lat: number;
  long: number;
  location: string;
  image: string;
  rating: number;
  tags: string[];
  vertical: VerticalType;
  verified?: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  rating: number;
  deliveryTime: string;
  storeName: string; // Denormalized for UI
  distance: string;
  category: string; // Fresh, Bakery, Dairy, Packaged, etc.
  vertical: VerticalType;
  stock: number;
  isVegetarian?: boolean;
  
  // Vertical Specific Fields
  expiryDate?: string; // Deals
  weight?: string;     // Rural
  origin?: string;     // Rural
  makerMaterial?: string; // Makers
  dimensions?: string; // Makers
  audioPrompt?: string; // Rural (URL to audio file)
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  date: string;
  deliveryAddress?: string;
  paymentMode?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Category {
  id: number;
  name: string;
  image: string;
  vertical?: VerticalType;
}
