
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Language, User, Order, SellerProfile } from '../types';
import { LOCATIONS, PRODUCTS as INITIAL_PRODUCTS } from '../data/mock';

interface LocationData {
  id: string;
  name: string;
  lat: number;
  long: number;
}

interface Settings {
  notifications: boolean;
  darkMode: boolean;
  dataSaver: boolean;
}

interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
}

interface StoreContextType {
  products: Product[];
  addProduct: (product: Product) => void;

  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  moveToCart: (productId: string) => void;
  
  orders: Order[];
  checkoutItems: CartItem[];
  initiateCheckout: (items: CartItem[]) => void;
  placeOrder: (deliveryDetails: { address: string; phone: string; payment: string }) => void;
  cancelOrder: (orderId: string) => void;
  orderSuccess: boolean;
  closeOrderSuccess: () => void;
  redeemOrder: (orderId: string) => void;

  language: Language;
  setLanguage: (lang: Language) => void;
  
  user: User | null;
  login: (phone: string, name: string) => void;
  logout: () => void;
  upgradeToSeller: (role: string, sellerProfile: SellerProfile) => void;
  isAuthenticated: boolean;
  
  location: LocationData;
  setLocation: (loc: LocationData) => void;
  
  settings: Settings;
  updateSettings: (key: keyof Settings, value: boolean) => void;

  toast: ToastMessage | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;

  t: (key: string) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    'home': 'Home',
    'categories': 'Categories',
    'cart': 'Cart',
    'account': 'Account',
    'search_placeholder': "Search...",
    'deals_near_me': 'Deals Nearby',
    'rural_gold': 'Rural Gold',
    'makers_mart': 'Makers Mart',
    'trending': 'ClearX Finds',
    'add': 'ADD',
    'out_of_stock': 'SOLD OUT',
    'login_title': 'ClearX',
    'login_subtitle': 'Unified. Eco-friendly. Local.',
    'login_btn': 'Continue',
    'verify_btn': 'Verify',
    'otp_sent': 'OTP sent to',
    'change_loc': 'Change Location',
    'select_loc': 'Select your location',
    'logout': 'Logout',
    'profile': 'Profile',
    'settings': 'Settings',
    'my_orders': 'My Orders',
    'help_support': 'Help & Support',
    'how_to_use': 'How to use ClearX',
  },
  hi: {
    'home': 'होम',
    'categories': 'श्रेणियाँ',
    'cart': 'कार्ट',
    'account': 'खाता',
    'search_placeholder': "खोजें...",
    'deals_near_me': 'नज़दीकी डील्स',
    'rural_gold': 'रूरल गोल्ड',
    'makers_mart': 'मेकर्स मार्ट',
    'trending': 'ClearX खोजें',
    'add': 'जोड़ें',
    'out_of_stock': 'स्टॉक नहीं',
    'login_title': 'ClearX',
    'login_subtitle': 'स्थानीय। जैविक। किफायती।',
    'login_btn': 'जारी रखें',
    'verify_btn': 'सत्यापित करें',
    'otp_sent': 'OTP भेजा गया',
    'change_loc': 'स्थान बदलें',
    'select_loc': 'स्थान चुनें',
    'logout': 'लॉग आउट',
    'profile': 'प्रोफ़ाइल',
    'settings': 'सेटिंग्स',
    'my_orders': 'मेरे ऑर्डर',
    'help_support': 'सहायता',
    'how_to_use': 'ClearX का उपयोग कैसे करें',
  },
  te: {
    'home': 'హోమ్',
    'categories': 'వర్గాలు',
    'cart': 'కార్ట్',
    'account': 'ఖాతా',
    'search_placeholder': "వెతకండి...",
    'deals_near_me': 'డీల్స్',
    'rural_gold': 'రూరల్ గోల్డ్',
    'makers_mart': 'మేకర్స్ మార్ట్',
    'trending': 'ClearX',
    'add': 'జోడించు',
    'out_of_stock': 'అందుబాటులో లేదు',
    'login_title': 'ClearX',
    'login_subtitle': 'లోకల్. ఎకో-ఫ్రెండ్లీ.',
    'login_btn': 'కొనసాగించు',
    'verify_btn': 'ధృవీకరించండి',
    'otp_sent': 'OTP పంపబడింది',
    'change_loc': 'స్థానాన్ని మార్చండి',
    'select_loc': 'స్థానాన్ని ఎంచుకోండి',
    'logout': 'లాగ్ అవుట్',
    'profile': 'ప్రొఫైల్',
    'settings': 'సెట్టింగ్‌లు',
    'my_orders': 'నా ఆర్డర్లు',
    'help_support': 'సహాయం',
    'how_to_use': 'ఉపయోగించడం ఎలా',
  },
  ta: {
    'home': 'முகப்பு',
    'categories': 'வகைகள்',
    'cart': 'கூடை',
    'account': 'கணக்கு',
    'search_placeholder': "தேடுங்கள்...",
    'deals_near_me': 'சலுகைகள்',
    'rural_gold': 'ரூரல் கோல்ட்',
    'makers_mart': 'மேக்கர்ஸ் மார்ட்',
    'trending': 'ClearX',
    'add': 'சேர்',
    'out_of_stock': 'இருப்பு இல்லை',
    'login_title': 'ClearX',
    'login_subtitle': 'உள்ளூர். இயற்கை.',
    'login_btn': 'தொடரவும்',
    'verify_btn': 'சரிபார்க்கவும்',
    'otp_sent': 'OTP அனுப்பப்பட்டது',
    'change_loc': 'இடத்தை மாற்றவும்',
    'select_loc': 'இடத்தைத் தேர்ந்தெடுக்கவும்',
    'logout': 'வெளியேறு',
    'profile': 'சுயவிவரம்',
    'settings': 'அமைப்புகள்',
    'my_orders': 'எனது ஆர்டர்கள்',
    'help_support': 'உதவி',
    'how_to_use': 'எப்படி பயன்படுத்துவது',
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocationState] = useState<LocationData>(LOCATIONS[0]);
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    darkMode: false,
    dataSaver: false
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // User State
  const [user, setUser] = useState<User | null>(null);

  const login = (phone: string, name: string) => {
    setUser({
      id: 'u_' + Date.now(),
      name: name,
      phone: phone,
      role: 'consumer',
      address: location.name,
      coins: 50
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCart([]);
    setWishlist([]);
  };

  const upgradeToSeller = (role: string, sellerProfile: SellerProfile) => {
      if (user) {
          setUser({ 
              ...user, 
              role: role as any,
              sellerProfile: sellerProfile
          });
          showToast('Seller Profile Created!', 'success');
      }
  };

  const addProduct = (product: Product) => {
      setProductsState(prev => [product, ...prev]);
      if (user) {
          setUser(prev => prev ? ({ ...prev, myProducts: [...(prev.myProducts || []), product.id] }) : null);
      }
      showToast('Product Listed Successfully!', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type, id: Date.now() });
      setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast('Product added to cart!', 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
      setWishlist(prev => {
         if (prev.includes(productId)) {
             return prev.filter(id => id !== productId);
         } else {
             showToast('Added to Wishlist', 'success');
             return [...prev, productId];
         }
      });
  };

  const moveToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        addToCart(product);
        setWishlist(prev => prev.filter(id => id !== productId));
    }
  };

  const initiateCheckout = (items: CartItem[]) => {
      setCheckoutItems(items);
  };

  const placeOrder = (deliveryDetails: { address: string; phone: string; payment: string }) => {
    const total = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newOrder: Order = {
        id: 'ord-' + Date.now().toString().slice(-6),
        items: [...checkoutItems],
        total: total,
        status: 'confirmed',
        date: new Date().toISOString(),
        deliveryAddress: deliveryDetails.address,
        paymentMode: deliveryDetails.payment
    };
    setOrders([newOrder, ...orders]);
    
    // Remove purchased items from cart
    setCart(prev => prev.filter(c => !checkoutItems.find(i => i.id === c.id)));
    setCheckoutItems([]);
    setOrderSuccess(true);
  };

  const closeOrderSuccess = () => {
      setOrderSuccess(false);
  };

  const redeemOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: 'delivered' } : o
    ));
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast('Order cancelled successfully', 'success');
  };

  const setLocation = (loc: LocationData) => {
    setLocationState(loc);
    if (user) {
        setUser({ ...user, address: loc.name });
    }
  };

  const updateSettings = (key: keyof Settings, value: boolean) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const t = (key: string) => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <StoreContext.Provider value={{ 
      products, addProduct,
      cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal,
      wishlist, toggleWishlist, moveToCart,
      orders, checkoutItems, initiateCheckout, placeOrder, cancelOrder, orderSuccess, closeOrderSuccess, redeemOrder,
      language, setLanguage, user, login, logout, upgradeToSeller, isAuthenticated,
      location, setLocation, 
      settings, updateSettings,
      toast, showToast,
      t
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
