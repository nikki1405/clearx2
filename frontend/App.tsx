import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  HomeIcon, SearchIcon, ShoppingBagIcon, UserIcon, MapPinIcon, MicIcon, StarIcon, 
  ArrowLeftIcon, SparklesIcon, ChevronRightIcon, GlobeIcon, SpeakerIcon, QrCodeIcon, WalletIcon,
  HelpCircleIcon, ClockIcon, CheckCircleIcon, ChevronDownIcon, SettingsIcon, BellIcon, ShieldIcon,
  CameraIcon, CloseIcon, HeartIcon, GridIcon, ListIcon, LeafIcon, StoreIcon, UploadCloudIcon,
  FilterIcon, CreditCardIcon, TruckIcon, TrashIcon, FileTextIcon
} from './components/Icons';
import { STORES, LOCATIONS, CATEGORIES } from './data/mock';
import { VerticalType, Product, ChatMessage, Language, Order, CartItem } from './types';
import { generateAssistantResponse } from './services/gemini';
import { sendOTP, verifyOTP } from './services/firebaseAuth';
import { StoreProvider, useStore } from './context/StoreContext';

// --- Shared Components ---

const ToastNotification = () => {
    const { toast } = useStore();
    if (!toast) return null;

    const bg = toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800';

    return (
        <div className={`fixed top-4 left-4 right-4 z-[100] max-w-sm mx-auto p-3.5 rounded-xl shadow-2xl text-white text-sm font-bold text-center animate-in slide-in-from-top duration-300 ${bg}`}>
            {toast.message}
        </div>
    );
};

const OrderSuccessModal = () => {
    const { orderSuccess, closeOrderSuccess } = useStore();
    const navigate = useNavigate();

    if (!orderSuccess) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-[90%] max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="w-12 h-12 text-emerald-600 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h2>
                <p className="text-gray-500 mb-8 font-medium">Your order has been placed successfully.</p>
                <button 
                    onClick={() => {
                        closeOrderSuccess();
                        navigate('/orders');
                    }}
                    className="w-full bg-emerald-900 text-white font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                    View My Orders
                </button>
            </div>
        </div>
    );
};

const FilterBar = ({ availableCategories, onFilterChange }: { availableCategories: string[], onFilterChange: (filters: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        discount: '',
        priceRange: '',
        expiry: ''
    });

    const handleChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-700"
            >
                <FilterIcon className="w-4 h-4" /> Filters
            </button>
        );
    }

    return (
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 mt-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Filters</h3>
                <button onClick={() => setIsOpen(false)}><CloseIcon className="w-4 h-4 text-gray-400" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
                <select 
                    className="p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"
                    onChange={(e) => handleChange('category', e.target.value)}
                    value={filters.category}
                >
                    <option value="">Category</option>
                    {availableCategories.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select 
                    className="p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"
                    onChange={(e) => handleChange('discount', e.target.value)}
                    value={filters.discount}
                >
                    <option value="">Discount</option>
                    <option value="10">10% or more</option>
                    <option value="20">20% or more</option>
                    <option value="50">50% or more</option>
                </select>
                 <select 
                    className="p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"
                    onChange={(e) => handleChange('priceRange', e.target.value)}
                    value={filters.priceRange}
                >
                    <option value="">Price</option>
                    <option value="0-100">Under ₹100</option>
                    <option value="100-500">₹100 - ₹500</option>
                    <option value="500+">₹500+</option>
                </select>
                <select 
                    className="p-2 bg-gray-50 rounded-lg text-xs font-bold outline-none border"
                    onChange={(e) => handleChange('expiry', e.target.value)}
                    value={filters.expiry}
                >
                    <option value="">Expiry</option>
                    <option value="1">Expiring in 1 Day</option>
                    <option value="2">Expiring in 2 Days</option>
                    <option value="7">Expiring in 1 Week</option>
                </select>
            </div>
            <button 
                onClick={() => {
                    setFilters({ category: '', discount: '', priceRange: '', expiry: '' });
                    onFilterChange({ category: '', discount: '', priceRange: '', expiry: '' });
                }}
                className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
            >
                Clear Filters
            </button>
        </div>
    );
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
    const { cart, t, isAuthenticated } = useStore();

  const navItems = [
    { icon: <HomeIcon className="w-6 h-6" />, label: t('home'), path: "/" },
    { icon: <GridIcon className="w-6 h-6" />, label: t('categories'), path: "/categories" },
    { icon: <ShoppingBagIcon className="w-6 h-6" />, label: t('cart'), path: "/cart", badge: cart.length },
    { icon: <ListIcon className="w-6 h-6" />, label: t('my_orders'), path: "/orders" },
    { icon: <UserIcon className="w-6 h-6" />, label: t('account'), path: "/account" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 py-3 px-2 flex justify-around items-center z-50 max-w-md mx-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
                    <button
                        key={item.label}
                        onClick={() => {
                            // Require sign-in when navigating to protected routes like Cart
                            if (item.path === '/cart' && !isAuthenticated) {
                                navigate('/login');
                                return;
                            }
                            navigate(item.path);
                        }}
                        className={`relative flex flex-col items-center gap-1.5 transition-colors ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}
                    >
            {item.icon}
            {item.badge ? (
              <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">
                {item.badge}
              </span>
            ) : null}
            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const LocationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { setLocation, location: currentLocation, t } = useStore();
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">{t('select_loc')}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                        <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <button 
                  onClick={() => {
                     alert("Location detected!");
                     onClose();
                  }}
                  className="w-full mb-4 py-3.5 flex items-center justify-center gap-2 text-emerald-700 font-bold bg-emerald-50 rounded-2xl border border-emerald-100 active:scale-95 transition-transform"
                >
                   <MapPinIcon className="w-5 h-5" /> Detect Current Location
                </button>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {LOCATIONS.map(loc => (
                        <button
                            key={loc.id}
                            onClick={() => {
                                setLocation(loc);
                                onClose();
                            }}
                            className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                                currentLocation.id === loc.id 
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                                : 'border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                            <div className={`p-2 rounded-full ${currentLocation.id === loc.id ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                <MapPinIcon className={`w-5 h-5 ${currentLocation.id === loc.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                            </div>
                            <span className={`font-medium ${currentLocation.id === loc.id ? 'text-emerald-900' : 'text-gray-700'}`}>
                                {loc.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Header = ({ showBack = false, title }: { showBack?: boolean, title?: string }) => {
  const { language, setLanguage, user, t, location, wishlist } = useStore();
  const [showLocModal, setShowLocModal] = useState(false);
  const navigate = useNavigate();
  
  const toggleLanguage = () => {
    const langs: Language[] = ['en', 'hi', 'te', 'ta'];
    const nextIdx = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIdx]);
  };

  return (
    <>
    <div className="bg-white/90 backdrop-blur-md sticky top-0 z-40 pt-2 pb-3 px-4 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-center">
        {showBack ? (
            <div className="flex items-center gap-3">
                 <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800" />
                </button>
                {title && <h1 className="font-bold text-lg text-gray-900">{title}</h1>}
            </div>
        ) : (
            <div className="flex flex-col">
                <h1 className="font-extrabold text-xl text-gray-900">
                    Hi {user?.name?.split(' ')[0] || 'Guest'} 👋
                </h1>
            </div>
        )}
        
        <div className="flex gap-3 items-center">
           <button onClick={() => navigate('/wishlist')} className="relative p-2 text-gray-600">
                <HeartIcon className="w-6 h-6" />
                {wishlist.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
           </button>
           <button onClick={toggleLanguage} className="bg-gray-100 px-2.5 py-1.5 rounded-full text-xs font-bold uppercase text-gray-600 border border-gray-200">
             {language}
           </button>
           <div className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer" onClick={() => navigate('/account')}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} alt="User" className="w-full h-full object-cover" />
           </div>
        </div>
      </div>
      
      {/* Location Bar - Only show on home-like screens if not strictly a back-nav screen */}
      {!title && (
          <div className="flex items-center gap-3 w-full">
              <div 
                className="flex items-center gap-1 cursor-pointer bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 w-full"
                onClick={() => setShowLocModal(true)}
              >
                <MapPinIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivering to</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-800 truncate">{location.name}</span>
                        <ChevronDownIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                    </div>
                </div>
              </div>
          </div>
      )}
    </div>
    <LocationModal isOpen={showLocModal} onClose={() => setShowLocModal(false)} />
    </>
  );
};

const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
  const { toggleWishlist, wishlist, addToCart } = useStore();
  const isLiked = wishlist.includes(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart(product);
  };

  // Determine Vertical Specific Badge
  const getBadge = () => {
      if (product.vertical === VerticalType.DEALS && product.expiryDate) {
          return (
             <div className="absolute top-2 left-2 bg-red-100 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-bold text-red-700 shadow-sm border border-red-200">
                {product.expiryDate}
             </div>
          );
      }
      if (product.vertical === VerticalType.RURAL && product.origin) {
          return (
             <div className="absolute top-2 left-2 bg-green-100 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-bold text-green-800 shadow-sm border border-green-200 flex items-center gap-1">
                <LeafIcon className="w-3 h-3" /> {product.origin}
             </div>
          );
      }
      if (product.vertical === VerticalType.MAKERS && product.makerMaterial) {
          return (
             <div className="absolute top-2 left-2 bg-orange-100 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-bold text-orange-800 shadow-sm border border-orange-200">
                {product.makerMaterial}
             </div>
          );
      }
      return null;
  };

  return (
    <div onClick={onClick} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden active:scale-[0.98] transition-all relative group h-full flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button 
            onClick={handleWishlist}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors z-10"
        >
            <HeartIcon className="w-4 h-4" fill={isLiked} />
        </button>
        
        {getBadge()}

        {product.discount && (
             <div className="absolute bottom-2 left-2 bg-blue-600/90 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-bold text-white shadow-sm">
                {product.discount}
             </div>
        )}
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1 h-10">{product.name}</h3>
        <p className="text-[10px] text-gray-400 mb-2 truncate">{product.storeName}</p>
        
        <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-sm">₹{product.price}</span>
                    {product.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through decoration-red-400">₹{product.originalPrice}</span>
                    )}
                </div>
            </div>
            <button 
                onClick={handleAddToCart}
                className="p-1.5 bg-emerald-50 rounded text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
                <ShoppingBagIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Screens ---

const LandingPage = () => {
    const navigate = useNavigate();

    const modules = [
        { 
            id: VerticalType.DEALS, 
            title: "Deals Nearby", 
            desc: "Clearance sales & expiry deals near you.",
            icon: "⚡", 
            color: "bg-blue-50 text-blue-900 border-blue-100",
            img: "https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=400"
        },
        { 
            id: VerticalType.RURAL, 
            title: "Rural Gold", 
            desc: "Farm-fresh produce & tribal goods.", 
            icon: "🌾", 
            color: "bg-emerald-50 text-emerald-900 border-emerald-100",
            img: "https://static2.bigstockphoto.com/6/0/2/large1500/206436961.jpg"
        },
        { 
            id: VerticalType.MAKERS, 
            title: "Makers Mart", 
            desc: "Direct from artisans & manufacturers.", 
            icon: "🎨", 
            color: "bg-orange-50 text-orange-900 border-orange-100",
            img: "https://images.pexels.com/photos/2474374/pexels-photo-2474374.jpeg?auto=compress&cs=tinysrgb&w=400"
        }
    ];

    return (
        <div className="min-h-screen bg-white pb-24">
            <Header />
            <div className="p-6">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome to ClearX</h2>
                    <p className="text-gray-500 text-sm">A unified platform connecting you to local deals, rural producers, and creative makers.</p>
                </div>

                <div className="space-y-6">
                    {modules.map(m => (
                        <div 
                            key={m.id}
                            onClick={() => navigate(`/vertical/${m.id}`)}
                            className={`relative overflow-hidden rounded-3xl border shadow-lg cursor-pointer active:scale-95 transition-transform group ${m.color}`}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1/3">
                                <img src={m.img} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt={m.title} />
                                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/90"></div>
                            </div>
                            <div className="relative p-6 w-3/4">
                                <div className="text-3xl mb-3">{m.icon}</div>
                                <h3 className="text-2xl font-black mb-1">{m.title}</h3>
                                <p className="text-sm font-medium opacity-80">{m.desc}</p>
                                <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                                    Shop Now <ChevronRightIcon className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <BottomNav />
        </div>
    );
};

const VerticalFeed = () => {
  const { type } = useParams<{ type: VerticalType }>();
  const navigate = useNavigate();
  const { t, products } = useStore();
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!type) return <Navigate to="/" />;

  // Filter products by vertical FIRST
  const verticalProducts = products.filter(p => p.vertical === type);

  // Derive available categories dynamically from the filtered products
  const availableCategories = Array.from(new Set(verticalProducts.map(p => p.category))) as string[];

  // Title Logic
  const titles: Record<string, string> = {
      [VerticalType.DEALS]: "Deals Nearby",
      [VerticalType.RURAL]: "Rural Gold",
      [VerticalType.MAKERS]: "Makers Mart"
  };

  const filteredProducts = verticalProducts.filter(p => {
      // Search Filter
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.category.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
      }
      
      let matches = true;
      if (activeFilters.category && p.category !== activeFilters.category) matches = false;
      if (activeFilters.discount && parseFloat(p.discount?.replace(/\D/g, '') || '0') < parseFloat(activeFilters.discount)) matches = false;
      if (activeFilters.priceRange) {
          const [min, max] = activeFilters.priceRange.split('-').map(Number);
          if (max && (p.price < min || p.price > max)) matches = false;
          if (!max && p.price < min) matches = false; // 500+ case
      }
      return matches;
  });

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <Header showBack={true} title={titles[type]} />
      
      {/* Module Specific Search Bar */}
      <div className="px-4 mt-4">
        <div className="relative">
            <input 
            type="text" 
            placeholder={`Search in ${titles[type]}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 outline-none transition-all"
            />
            <SearchIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {/* Product Grid Header */}
      <div className="px-4 mt-4 mb-4">
          <FilterBar availableCategories={availableCategories} onFilterChange={setActiveFilters} />
      </div>

      {/* Masonry Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
          {filteredProducts.length > 0 ? filteredProducts.map((p) => (
             <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
          )) : (
              <div className="col-span-2 text-center py-20 text-gray-400">
                  <p>No products found matching your criteria.</p>
              </div>
          )}
      </div>

      {/* AI Floating Action Button */}
      <button 
        onClick={() => navigate('/ai')}
        className="fixed bottom-24 right-4 bg-emerald-900 text-white p-4 rounded-full shadow-2xl z-40 active:scale-90 transition-transform"
      >
        <SparklesIcon className="w-6 h-6 text-emerald-200" />
      </button>

      <BottomNav />
    </div>
  );
};

const WishlistScreen = () => {
    const { wishlist, products, removeFromCart, moveToCart } = useStore();
    const navigate = useNavigate();

    const wishlistItems = products.filter(p => wishlist.includes(p.id));

    if (wishlistItems.length === 0) {
        return (
            <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <HeartIcon className="w-16 h-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Your Wishlist is Empty</h2>
                <button onClick={() => navigate('/')} className="mt-6 py-3 px-8 font-bold text-white bg-emerald-600 rounded-xl shadow-lg">Explore Items</button>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="pb-32 min-h-screen bg-gray-50">
            <Header showBack={true} title="My Wishlist" />
            <div className="p-4 space-y-4">
                {wishlistItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            <img src={item.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{item.storeName}</p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="font-bold text-lg">₹{item.price}</span>
                                    {item.originalPrice && <span className="text-xs text-gray-400 line-through ml-2">₹{item.originalPrice}</span>}
                                </div>
                                <button 
                                    onClick={() => moveToCart(item.id)}
                                    className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-sm"
                                >
                                    Move to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <BottomNav />
        </div>
    );
};

const SellerOnboardingScreen = () => {
    const navigate = useNavigate();
    const { upgradeToSeller, addProduct, user } = useStore();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    
    // Step 2: Business Info
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [openingTime, setOpeningTime] = useState('');
    const [closingTime, setClosingTime] = useState('');

    // Step 3: Docs
    const [docFile, setDocFile] = useState<string | null>(null);

    // Step 4: Product
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [productStock, setProductStock] = useState('');
    const [productImage, setProductImage] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400');

    const handleRegister = () => {
        if (!role) return;
        const profile = {
            businessName,
            businessType,
            email,
            storeAddress,
            storePhone,
            openingTime,
            closingTime,
            productTypes: [productCategory],
            isVerified: true
        };
        upgradeToSeller(role, profile);
        setStep(4);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDocFile(file.name);
        }
    };

    const handleAddProduct = () => {
        if (!user) return;
        const newProd: Product = {
            id: 'p-' + Date.now(),
            storeId: user.id,
            name: productName,
            price: Number(productPrice),
            image: productImage,
            rating: 0,
            deliveryTime: '2-3 Days',
            storeName: businessName,
            distance: 'Calculated',
            category: productCategory,
            vertical: role === 'retailer' ? VerticalType.DEALS : role === 'rural_seller' ? VerticalType.RURAL : VerticalType.MAKERS,
            stock: Number(productStock),
            description: 'Newly listed product.',
            discount: 'NEW',
        };
        addProduct(newProd);
        navigate('/account');
    };

    return (
        <div className="pb-24 min-h-screen bg-gray-50">
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <button onClick={() => navigate(-1)}><ArrowLeftIcon className="w-6 h-6" /></button>
                <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                    ))}
                </div>
                <div className="w-6"></div>
            </div>

            <div className="p-6">
                {step === 1 && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Choose your role</h1>
                        <p className="text-gray-500 mb-8">How do you want to sell on ClearX?</p>
                        
                        <div className="space-y-4">
                            {[
                                { id: 'retailer', title: 'Retail Store', desc: 'I have a physical shop and want to sell clearance deals.', icon: <StoreIcon className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50 border-blue-100' },
                                { id: 'rural_seller', title: 'Rural Producer', desc: 'Direct from farm/village to customer.', icon: <LeafIcon className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' },
                                { id: 'maker', title: 'Artisan / Maker', desc: 'I create handmade products at home.', icon: <SparklesIcon className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-50 border-orange-100' }
                            ].map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => { setRole(opt.id); setStep(2); }}
                                    className={`w-full text-left p-6 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-md active:scale-95 ${opt.bg}`}
                                >
                                    <div className="p-3 bg-white rounded-xl shadow-sm">{opt.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{opt.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in slide-in-from-right duration-300 space-y-4">
                        <h1 className="text-2xl font-black text-gray-900">Business Details</h1>
                        <p className="text-gray-500">Tell us about your shop.</p>

                        <input className="w-full p-4 bg-white rounded-xl border" placeholder="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                        
                        <select className="w-full p-4 bg-white rounded-xl border outline-none" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                            <option value="">Select Type</option>
                            <option value="Grocery">Grocery Store</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Restaurant">Restaurant</option>
                            <option value="Farm">Farm</option>
                            <option value="Workshop">Artisan Workshop</option>
                        </select>

                        <div className="grid grid-cols-2 gap-3">
                            <input className="w-full p-4 bg-white rounded-xl border" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <input className="w-full p-4 bg-white rounded-xl border" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        <input className="w-full p-4 bg-white rounded-xl border" placeholder="Store Address" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} />
                        <input className="w-full p-4 bg-white rounded-xl border" placeholder="Store Phone" value={storePhone} onChange={e => setStorePhone(e.target.value)} />

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 font-bold">Opens At</label>
                                <input type="time" className="w-full p-3 bg-white rounded-xl border mt-1" value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 font-bold">Closes At</label>
                                <input type="time" className="w-full p-3 bg-white rounded-xl border mt-1" value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                            </div>
                        </div>

                        <button 
                            onClick={() => { if(businessName && businessType) setStep(3); }}
                            className="w-full bg-emerald-900 text-white font-bold py-4 rounded-2xl shadow-lg mt-4"
                        >
                            Next Step
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in slide-in-from-right duration-300 py-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldIcon className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 text-center">Verify Business</h2>
                        <p className="text-gray-500 mt-2 mb-8 text-center text-sm">Please upload your Business Registration Certificate, GST Registration (if applicable), or Trade License.</p>
                        
                        <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            ref={docInputRef} 
                            className="hidden" 
                            onChange={handleDocUpload} 
                        />
                        
                        <div 
                            onClick={() => docInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-white cursor-pointer transition-colors"
                        >
                            <FileTextIcon className="w-10 h-10 mb-2" />
                            <span className="font-bold text-sm">{docFile ? docFile : 'Tap to upload Document'}</span>
                        </div>

                        <button 
                            onClick={handleRegister}
                            disabled={!docFile}
                            className={`w-full font-bold px-8 py-4 rounded-2xl shadow-lg ${docFile ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            Submit & Verify
                        </button>
                        <p className="text-[10px] text-center mt-4 text-gray-400">*Prototype Mode: Any file will be accepted</p>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Add First Product</h1>
                        <p className="text-gray-500 mb-8">List your first item to get started.</p>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleImageUpload} 
                            />
                            <div 
                                className="border-2 border-dashed border-gray-200 rounded-2xl h-40 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50 overflow-hidden relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <img src={productImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                <UploadCloudIcon className="w-8 h-8 relative z-10 text-gray-600" />
                                <span className="text-xs font-bold relative z-10 text-gray-600">Tap to take photo / upload</span>
                            </div>
                            
                            <input 
                                type="text" 
                                placeholder="Product Name"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none font-bold"
                            />

                            <select 
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none font-bold text-gray-600"
                                value={productCategory}
                                onChange={(e) => setProductCategory(e.target.value)}
                            >
                                <option value="">Select Category</option>
                                <option value="Fresh Products">Fresh Products</option>
                                <option value="Bakery">Bakery</option>
                                <option value="Dairy">Dairy</option>
                                <option value="Packaged Foods">Packaged Foods</option>
                                <option value="Handmade">Handmade</option>
                            </select>
                            
                            <div className="flex gap-4">
                                <input type="number" placeholder="Price (₹)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="w-1/2 bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none font-bold" />
                                <input type="number" placeholder="Stock" value={productStock} onChange={e => setProductStock(e.target.value)} className="w-1/2 bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none font-bold" />
                            </div>
                        </div>

                        <button 
                            onClick={handleAddProduct}
                            className="w-full mt-8 bg-emerald-900 text-white font-bold py-4 rounded-2xl shadow-lg"
                        >
                            Launch Shop & List Item
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckoutScreen = () => {
    const navigate = useNavigate();
    const { checkoutItems, placeOrder, cartTotal } = useStore();
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [payment, setPayment] = useState('UPI');

    const total = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleConfirm = () => {
        if (!address || !phone) {
            alert("Please fill in delivery details.");
            return;
        }
        placeOrder({ address, phone, payment });
        // Don't navigate here, wait for modal interaction
    };

    if (checkoutItems.length === 0) return <Navigate to="/" />;

    return (
        <div className="pb-24 min-h-screen bg-gray-50">
            <Header showBack={true} />
            <div className="p-4">
                <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><TruckIcon className="w-5 h-5"/> Delivery Details</h3>
                    <input 
                        className="w-full bg-gray-50 p-3 rounded-xl mb-3 outline-none" 
                        placeholder="Full Delivery Address" 
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                    />
                    <input 
                        className="w-full bg-gray-50 p-3 rounded-xl outline-none" 
                        placeholder="Phone Number" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                    />
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><CreditCardIcon className="w-5 h-5"/> Payment Method</h3>
                    <div className="space-y-2">
                        {['UPI', 'Credit/Debit Card', 'Cash on Delivery'].map(method => (
                            <button 
                                key={method}
                                onClick={() => setPayment(method)}
                                className={`w-full text-left p-3 rounded-xl border font-medium ${payment === method ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-gray-200'}`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                    <h3 className="font-bold mb-3">Order Summary</h3>
                    {checkoutItems.map(item => (
                        <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                            <span className="text-sm text-gray-600">{item.name} x {item.quantity}</span>
                            <span className="font-bold">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div className="flex justify-between mt-4 pt-2 border-t border-gray-100">
                        <span className="font-black text-lg">Total Pay</span>
                        <span className="font-black text-lg text-emerald-700">₹{total}</span>
                    </div>
                </div>

                <button 
                    onClick={handleConfirm}
                    className="w-full bg-emerald-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                    Confirm & Pay
                </button>
            </div>
        </div>
    );
};

const CartScreen = () => {
    const { cart, removeFromCart, initiateCheckout, clearCart, updateQuantity } = useStore();
    const navigate = useNavigate();

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (cart.length === 0) {
        return (
            <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <ShoppingBagIcon className="w-16 h-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Your Cart is Empty</h2>
                <button onClick={() => navigate('/')} className="mt-6 py-3 px-8 font-bold text-white bg-emerald-600 rounded-xl shadow-lg">Start Shopping</button>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="pb-32 min-h-screen bg-gray-50 relative" style={{backgroundImage: 'url(https://images.pexels.com/photos/5632623/pexels-photo-5632623.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'}}>
            <div className="absolute inset-0 bg-white/90"></div>
            <div className="relative z-10">
            <Header showBack={true} />
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-gray-900">My Cart</h1>
                    <button onClick={clearCart} className="text-red-500 text-xs font-bold">Clear All</button>
                </div>

                <div className="space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                <img src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                                <p className="text-xs text-gray-500 mb-2">{item.storeName}</p>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 line-through">₹{item.price}</span>
                                        <span className="font-bold text-lg">₹{item.price * item.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-200 rounded text-gray-600 font-bold">−</button>
                                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-200 rounded text-gray-600 font-bold">+</button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
                <div className="flex justify-between mb-4">
                    <span className="font-bold text-gray-500">Total Amount</span>
                    <span className="font-black text-xl">₹{total}</span>
                </div>
                <button 
                    onClick={() => {
                        initiateCheckout(cart);
                        navigate('/checkout');
                    }}
                    className="w-full bg-emerald-900 text-white font-bold py-4 rounded-2xl shadow-lg"
                >
                    Proceed to Buy ({cart.length} items)
                </button>
            </div>

            <div className="fixed bottom-0 left-0 right-0">
                <BottomNav />
            </div>
            </div>
        </div>
    );
};

const QRScannerScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { redeemOrder } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamStarted(true);
      } catch (err) {
        console.warn("Camera access denied or dismissed:", err);
        setPermissionError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScan = () => {
    if (orderId) {
        redeemOrder(orderId);
        alert('QR Code Scanned Successfully! Order Redeemed.');
        navigate('/orders');
    } else {
        alert('QR Code Scanned!');
        navigate(-1);
    }
  };

  return (
    <div className="h-screen bg-black relative flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                <CloseIcon className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg tracking-wide">Scan Code</h1>
            <div className="w-10"></div>
        </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900">
            {permissionError ? (
                <div className="text-white text-center p-8 max-w-xs">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CameraIcon className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Camera Access Required</h3>
                    <p className="text-gray-400 text-sm mb-6">We couldn't access your camera. Please enable permissions or use the simulator.</p>
                </div>
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
            )}
            
            {/* Scanning Guide UI */}
            <div className="relative z-10 w-72 h-72 border-2 border-white/30 rounded-3xl flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-3xl animate-pulse opacity-60"></div>
                {/* Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl"></div>
                
                <p className="text-white/80 text-sm font-bold absolute -bottom-12 text-center w-full">
                    Align Store QR Code
                </p>
            </div>
            
            {/* Mock Click Area */}
            <button 
                onClick={handleScan}
                className="absolute inset-0 w-full h-full cursor-default z-0"
                aria-label="Tap to simulate scan"
            ></button>
        </div>

        <div className="p-8 bg-black z-20 flex flex-col items-center">
             <button 
                onClick={handleScan}
                className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
                <QrCodeIcon className="w-5 h-5" />
                Simulate Successful Scan
             </button>
             {permissionError && (
                 <p className="text-gray-500 text-xs mt-4">Running in simulation mode.</p>
             )}
        </div>
    </div>
  );
};

const CategoriesScreen = () => {
    const navigate = useNavigate();

    return (
        <div className="pb-24 min-h-screen bg-gray-50">
            <Header showBack={false} />
            
            <div className="px-4 py-6">
                <h2 className="font-black text-3xl text-gray-900 mb-8">Explore Categories</h2>
                <div className="grid grid-cols-2 gap-6">
                    {CATEGORIES.map((cat) => (
                        <div 
                            key={cat.id} 
                            onClick={() => navigate('/')} 
                            className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
                        >
                            <img src={cat.image} className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-700" alt={cat.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-5 hover:from-black/95">
                                <h3 className="text-white font-bold text-base">{cat.name}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <BottomNav />
        </div>
    );
};

const HomePage = () => {
    const navigate = useNavigate();
    const { t } = useStore();

    const modules = [
        { 
            id: VerticalType.DEALS, 
            title: "Deals Nearby", 
            desc: "Clearance sales & expiry deals near you.",
            icon: "⚡", 
            color: "bg-blue-50 text-blue-900 border-blue-100",
            img: "https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=400"
        },
        { 
            id: VerticalType.RURAL, 
            title: "Rural Gold", 
            desc: "Farm-fresh produce & tribal goods.", 
            icon: "🌾", 
            color: "bg-emerald-50 text-emerald-900 border-emerald-100",
            img: "https://static2.bigstockphoto.com/6/0/2/large1500/206436961.jpg"
        },
        { 
            id: VerticalType.MAKERS, 
            title: "Makers Mart", 
            desc: "Direct from artisans & manufacturers.", 
            icon: "🎨", 
            color: "bg-orange-50 text-orange-900 border-orange-100",
            img: "data:image/jpeg;base64,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"
        }
    ];

    return (
        <div className="min-h-screen bg-white pb-24">
            <div className="bg-white/90 backdrop-blur-md sticky top-0 z-40 pt-4 pb-4 px-4 shadow-sm flex justify-between items-center">
                <h1 className="font-extrabold text-xl text-gray-900">ClearX</h1>
                <button 
                    onClick={() => navigate('/login?step=phone')}
                    className="px-6 py-2.5 bg-emerald-900 text-white font-bold rounded-full text-sm shadow-lg active:scale-95 transition-transform"
                >
                    Sign In
                </button>
            </div>
            <div className="p-6">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome to ClearX</h2>
                    <p className="text-gray-500 text-sm">A unified platform connecting you to local deals, rural producers, and creative makers.</p>
                </div>

                <div className="space-y-6">
                    {modules.map(m => (
                        <div 
                            key={m.id}
                            onClick={() => navigate('/login?step=phone')}
                            className={`relative overflow-hidden rounded-3xl border shadow-lg cursor-pointer active:scale-95 transition-transform group ${m.color}`}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1/3">
                                <img src={m.img} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt={m.title} />
                                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/90"></div>
                            </div>
                            <div className="relative p-6 w-3/4">
                                <div className="text-3xl mb-3">{m.icon}</div>
                                <h3 className="text-2xl font-black mb-1">{m.title}</h3>
                                <p className="text-sm font-medium opacity-80">{m.desc}</p>
                                <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                                    Sign In to Shop <ChevronRightIcon className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LoginScreen = () => {
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const initialStep = (searchParams.get('step') as 'onboarding' | 'phone' | 'otp') || 'onboarding';
    const [step, setStep] = useState<'onboarding' | 'phone' | 'otp'>(initialStep);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [slideIndex, setSlideIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, t, showToast } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (step !== 'onboarding') return;
        const interval = setInterval(() => {
            setSlideIndex(prev => (prev + 1) % 3);
        }, 3500);
        return () => clearInterval(interval);
    }, [step]);

    const handleSendOtp = async () => {
        setError('');
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }
        
        setLoading(true);
        const result = await sendOTP(phone);
        setLoading(false);
        
        if (result.success) {
            setStep('otp');
            showToast('OTP sent to +91' + phone, 'success');
        } else {
            setError(result.message);
            showToast(result.message, 'error');
        }
    };

    const handleVerify = async () => {
        setError('');
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        const result = await verifyOTP(otp);
        setLoading(false);
        
        if (result.success) {
            login('+91' + phone, name || 'Shopper');
            showToast('Login successful!', 'success');
            navigate('/');
        } else {
            setError(result.message);
            showToast(result.message, 'error');
        }
    };

    const slides = [
        {
            title: "Clearance Sale",
            desc: "Hyperlocal clearance finds at unbeatable prices.",
            img: "data:image/jpeg;base64,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",
        },
        {
            title: "Rural Gold",
            desc: "Farm-fresh organic produce directly to your home.",
            img: "https://static2.bigstockphoto.com/6/0/2/large1500/206436961.jpg",
        },
        {
            title: "Makers Mart",
            desc: "Support artisans and buy unique handcrafted goods.",
            img: "data:image/jpeg;base64,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",
        }
    ];

    if (step === 'onboarding') {
        return (
            <div className="h-screen bg-white flex flex-col relative overflow-hidden">
                {/* Background Slider */}
                <div className="absolute inset-0 z-0">
                    {slides.map((slide, idx) => (
                        <div 
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === slideIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img src={slide.img} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/40 to-transparent opacity-90"></div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 z-10 flex flex-col justify-end p-8 pb-12">
                     <div className="mb-8">
                        <div className="flex gap-2 mb-6">
                            {slides.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}></div>
                            ))}
                        </div>
                        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">{slides[slideIndex].title}</h1>
                        <p className="text-emerald-100 text-lg leading-relaxed">{slides[slideIndex].desc}</p>
                     </div>

                    <button 
                        onClick={() => navigate('/home')}
                        className="w-full bg-white text-emerald-900 font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden">
            {/* Background Image - Full Screen */}
            <div className="absolute inset-0 w-full h-full">
                <img src="https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50"></div>
            </div>

            <div className="relative flex flex-col px-6 pt-12 pb-6 flex-1 z-10">
                <button onClick={() => setStep('onboarding')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-8">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-900" />
                </button>

                <h1 className="text-3xl font-black text-white mb-2">{t('login_title')}</h1>
                <p className="text-white/90 font-medium mb-10">{t('login_subtitle')}</p>

                {step === 'phone' ? (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div>
                        <label className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-2">Mobile Number</label>
                        <div className="flex bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                            <div className="bg-gray-100 px-4 flex items-center border-r border-gray-200">
                                <span className="font-bold text-gray-600">+91</span>
                            </div>
                            <input
                                type="tel"
                                maxLength={10}
                                placeholder="90000 00000"
                                className="w-full bg-transparent py-4 px-4 text-lg font-bold outline-none text-gray-900"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                disabled={loading}
                            />
                        </div>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-2">Name (Optional)</label>
                        <input
                            type="text"
                            placeholder="Your Name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-xl text-sm font-bold">{error}</div>}
                    <button
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform mt-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sending OTP...
                            </>
                        ) : (
                            t('login_btn')
                        )}
                    </button>
                    <div id="recaptcha-container" className="mt-4"></div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="text-center">
                         <p className="text-white/80 mb-1">{t('otp_sent')}</p>
                         <p className="text-xl font-bold text-white">+91 {phone}</p>
                    </div>
                    
                    <div className="relative h-20 flex items-center justify-center">
                        <div className="flex gap-3 relative z-0 pointer-events-none">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`w-12 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold bg-white/95 shadow-lg transition-all ${otp.length === i ? 'border-emerald-400 ring-4 ring-emerald-300 -translate-y-1' : 'border-white/40 text-gray-800'}`}>
                                    {otp[i] || ''}
                                </div>
                            ))}
                        </div>
                        <input
                            type="tel"
                            maxLength={6}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 font-bold tracking-[1em]"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    
                    {error && <div className="bg-red-500/20 text-red-100 p-3 rounded-xl text-sm font-bold text-center">{error}</div>}
                    
                    <button
                        onClick={handleVerify}
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verifying...
                            </>
                        ) : (
                            t('verify_btn')
                        )}
                    </button>
                    <button 
                        onClick={() => {
                            setStep('phone');
                            setOtp('');
                            setError('');
                        }}
                        disabled={loading}
                        className="w-full text-sm text-white/70 font-bold hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Wrong Number?
                    </button>
                </div>
            )}
            </div>
        </div>
    );
};

const ProductDetailScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, wishlist, toggleWishlist, initiateCheckout, isAuthenticated, showToast } = useStore();
    const { products } = useStore();
  
  const product = products.find(p => p.id === id);
  if (!product) return <div>Product not found</div>;

  const isLiked = wishlist.includes(product.id);

  return (
    <div className="pb-24 bg-white min-h-screen">
       {/* Full Bleed Image Header */}
       <div className="relative h-96">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          
             <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/30 to-transparent">
                 <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/40 transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-white" />
             </button>
             <div className="flex gap-3">
                      <button onClick={() => {
                          if (!isAuthenticated) {
                             showToast('Please sign in to access your cart', 'info');
                             navigate('/login');
                             return;
                          }
                          navigate('/cart');
                      }} className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/40 transition-colors">
                    <ShoppingBagIcon className="w-6 h-6 text-white" />
                 </button>
             </div>
          </div>
       </div>

       <div className="px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
             <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-black text-gray-900 leading-tight w-3/4">{product.name}</h1>
                <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="p-3 bg-gray-50 rounded-full hover:bg-red-50 transition-colors"
                >
                    <HeartIcon className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-gray-300'}`} fill={isLiked} />
                </button>
             </div>
             
             <p className="text-gray-500 font-medium text-sm mb-4">{product.storeName} • {product.distance}</p>

             <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through decoration-2">₹{product.originalPrice}</span>
                )}
                {product.discount && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {product.discount}
                    </span>
                )}
             </div>

             <div className="flex gap-4 border-t border-gray-100 pt-6">
                 <div className="flex-1">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Rating</p>
                     <div className="flex items-center gap-1 font-bold text-gray-900">
                         {product.rating} <React.Fragment><StarIcon className="w-4 h-4 text-yellow-400 fill-current" fill /></React.Fragment>
                         <span className="text-gray-400 text-xs font-normal ml-1">(1.2k)</span>
                     </div>
                 </div>
                 <div className="flex-1 border-l border-gray-100 pl-4">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Delivery</p>
                     <p className="font-bold text-gray-900 text-sm">{product.deliveryTime}</p>
                 </div>
             </div>
          </div>

          <div className="mt-8 space-y-8">
             {/* Description */}
             <div>
                 <h3 className="font-bold text-lg text-gray-900 mb-3">Product Details</h3>
                 <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
                 
                 {/* Specs Grid */}
                 <div className="mt-4 grid grid-cols-2 gap-3">
                     {product.expiryDate && (
                         <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                             <p className="text-xs text-red-500 mb-1">Expiry</p>
                             <p className="font-bold text-gray-900 text-sm">{product.expiryDate}</p>
                         </div>
                     )}
                     {product.weight && (
                         <div className="bg-gray-50 p-3 rounded-xl">
                             <p className="text-xs text-gray-500 mb-1">Weight</p>
                             <p className="font-bold text-gray-900 text-sm">{product.weight}</p>
                         </div>
                     )}
                     {product.origin && (
                         <div className="bg-gray-50 p-3 rounded-xl">
                             <p className="text-xs text-gray-500 mb-1">Origin</p>
                             <p className="font-bold text-gray-900 text-sm">{product.origin}</p>
                         </div>
                     )}
                     <div className="bg-gray-50 p-3 rounded-xl">
                             <p className="text-xs text-gray-500 mb-1">Category</p>
                             <p className="font-bold text-gray-900 text-sm">{product.category}</p>
                     </div>
                 </div>
             </div>

             {/* Reviews Section Mockup */}
             <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900">Reviews</h3>
                    <span className="text-emerald-600 text-sm font-bold">See All</span>
                 </div>
                 <div className="space-y-3">
                     {[1, 2].map(i => (
                         <div key={i} className="border-b border-gray-100 pb-3">
                             <div className="flex items-center gap-2 mb-2">
                                 <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                 <span className="text-xs font-bold text-gray-700">Verified Buyer</span>
                                 <div className="flex ml-auto text-yellow-400">
                                     {[1,2,3,4,5].map(s => (
                                         <React.Fragment key={s}>
                                             <StarIcon className="w-3 h-3 fill-current" fill />
                                         </React.Fragment>
                                     ))}
                                 </div>
                             </div>
                             <p className="text-sm text-gray-600">Really amazing quality! Delivered faster than expected.</p>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Similar Products Rail */}
             <div>
                 <h3 className="font-bold text-lg text-gray-900 mb-4">You Might Also Like</h3>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
                     {products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4).map(p => (
                         <div key={p.id} className="min-w-[140px] w-[140px]" onClick={() => navigate(`/product/${p.id}`)}>
                             <div className="aspect-[3/4] rounded-xl bg-gray-100 mb-2 overflow-hidden">
                                 <img src={p.image} className="w-full h-full object-cover" />
                             </div>
                             <p className="font-medium text-xs truncate">{p.name}</p>
                             <p className="font-bold text-sm">₹{p.price}</p>
                         </div>
                     ))}
                 </div>
             </div>
          </div>
       </div>

       {/* Sticky Bottom Action */}
       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-30 max-w-md mx-auto">
          <div className="flex gap-3">
                 <button 
                     onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please sign in to add items to cart', 'info');
                          navigate('/login');
                          return;
                        }
                        addToCart(product);
                     }}
                     className="flex-1 bg-white text-emerald-900 border border-emerald-900 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
                 >
                     Add to Cart
                 </button>
             <button 
                onClick={() => {
                    initiateCheckout([{...product, quantity: 1}]);
                    navigate('/checkout');
                }}
                className="flex-1 bg-emerald-900 text-white font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform"
             >
                Buy Now
             </button>
          </div>
       </div>
    </div>
  );
};

const SettingsScreen = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, logout, t } = useStore();

    return (
        <div className="pb-24 min-h-screen bg-gray-50">
            <Header showBack={true} />
            
            <div className="p-4">
                <h1 className="text-2xl font-black text-gray-900 mb-6">{t('settings')}</h1>
                
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center justify-between p-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full"><BellIcon className="w-5 h-5 text-blue-600"/></div>
                            <span className="font-bold text-gray-700">Notifications</span>
                        </div>
                        <div 
                            onClick={() => updateSettings('notifications', !settings.notifications)}
                            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${settings.notifications ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.notifications ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </div>
                     <div className="flex items-center justify-between p-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full"><ShieldIcon className="w-5 h-5 text-purple-600"/></div>
                            <span className="font-bold text-gray-700">Data Saver</span>
                        </div>
                        <div 
                            onClick={() => updateSettings('dataSaver', !settings.dataSaver)}
                            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${settings.dataSaver ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.dataSaver ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        logout();
                        navigate('/login');
                    }}
                    className="w-full bg-white text-red-500 font-bold py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

const AppContent = () => {
  const { isAuthenticated, user, products, orders, cancelOrder } = useStore();
  const navigate = useNavigate();
  const [orderFilter, setOrderFilter] = useState<'ALL' | VerticalType>('ALL');

  const myProducts = user?.role !== 'consumer' ? products.filter(p => user?.myProducts?.includes(p.id) || p.storeId === user?.id) : [];

  // Logic for Dynamic Role Label
  const isSeller = user?.role !== 'consumer';
  const hasOrders = orders.length > 0;
  let displayRole = 'Buyer';
  if (isSeller && hasOrders) displayRole = 'Buyer & Seller';
  else if (isSeller) displayRole = 'Seller';
  
  // Logic for filtered orders
  const filteredOrders = orderFilter === 'ALL' 
    ? orders 
    : orders.map(order => ({
        ...order,
        items: order.items.filter(item => item.vertical === orderFilter)
      })).filter(order => order.items.length > 0);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative font-sans">
      <ToastNotification />
      <OrderSuccessModal />
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginScreen />} />
        
        {/* Main Routes */}
        <Route path="/" element={isAuthenticated ? <LandingPage /> : <Navigate to="/login" />} />
        <Route path="/vertical/:type" element={isAuthenticated ? <VerticalFeed /> : <Navigate to="/login" />} />
        
        <Route path="/product/:id" element={isAuthenticated ? <ProductDetailScreen /> : <Navigate to="/login" />} />
        <Route path="/scan" element={isAuthenticated ? <QRScannerScreen /> : <Navigate to="/login" />} />
        <Route path="/categories" element={isAuthenticated ? <CategoriesScreen /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsScreen /> : <Navigate to="/login" />} />
        <Route path="/seller-onboarding" element={isAuthenticated ? <SellerOnboardingScreen /> : <Navigate to="/login" />} />
        <Route path="/cart" element={isAuthenticated ? <CartScreen /> : <Navigate to="/login" />} />
        <Route path="/wishlist" element={isAuthenticated ? <WishlistScreen /> : <Navigate to="/login" />} />
        <Route path="/checkout" element={isAuthenticated ? <CheckoutScreen /> : <Navigate to="/login" />} />
        
        <Route path="/account" element={isAuthenticated ? (
             <div className="min-h-screen bg-white pb-24">
                <Header showBack={false} />
                <div className="p-6">
                    <h1 className="text-2xl font-black mb-6">My Profile</h1>
                    <div className="bg-emerald-50 rounded-3xl p-6 flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-white rounded-full p-1 shadow-sm">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} className="w-full h-full rounded-full" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-emerald-900">{user?.name}</h3>
                            <p className="text-emerald-700 text-sm font-medium">{user?.phone}</p>
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md">
                                {displayRole}
                            </span>
                        </div>
                    </div>

                    {user?.role === 'consumer' ? (
                        <button 
                            onClick={() => navigate('/seller-onboarding')}
                            className="w-full p-6 mb-6 rounded-3xl bg-gradient-to-r from-emerald-900 to-teal-800 text-white relative overflow-hidden shadow-lg group"
                        >
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                                <StoreIcon className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-full backdrop-blur-md">
                                    <StoreIcon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg">Become a Seller</h3>
                                    <p className="text-emerald-100 text-xs">Start selling on ClearX today</p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 ml-auto text-white/70" />
                            </div>
                        </button>
                    ) : (
                        <div className="mb-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <StoreIcon className="w-5 h-5 text-emerald-600" /> My Shop: {user?.sellerProfile?.businessName}
                            </h2>
                            <button 
                                onClick={() => navigate('/seller-onboarding')}
                                className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm mb-4 border border-emerald-100"
                            >
                                Add More Products
                            </button>
                            
                            <h3 className="font-bold text-sm text-gray-500 mb-2">My Products</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {myProducts.map(p => (
                                    <div key={p.id} className="flex gap-3 bg-gray-50 p-2 rounded-xl">
                                        <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <p className="font-bold text-xs">{p.name}</p>
                                            <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                                        </div>
                                        <span className="font-bold text-sm">₹{p.price}</span>
                                    </div>
                                ))}
                                {myProducts.length === 0 && <p className="text-xs text-gray-400 italic">No products listed yet.</p>}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-3">
                        <button onClick={() => navigate('/orders')} className="w-full p-4 bg-gray-50 rounded-2xl flex items-center gap-4 font-bold text-gray-700">
                             <ListIcon className="w-5 h-5" /> My Orders <ChevronRightIcon className="ml-auto w-4 h-4 text-gray-400" />
                        </button>
                         <button onClick={() => navigate('/settings')} className="w-full p-4 bg-gray-50 rounded-2xl flex items-center gap-4 font-bold text-gray-700">
                             <SettingsIcon className="w-5 h-5" /> Settings <ChevronRightIcon className="ml-auto w-4 h-4 text-gray-400" />
                        </button>
                        <button className="w-full p-4 bg-gray-50 rounded-2xl flex items-center gap-4 font-bold text-gray-700">
                             <HelpCircleIcon className="w-5 h-5" /> Help & Support <ChevronRightIcon className="ml-auto w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>
                <BottomNav />
             </div>
        ) : <Navigate to="/login" />} />
        
        <Route path="/orders" element={isAuthenticated ? (
            <div className="min-h-screen bg-gray-50 pb-24">
                 <Header />
                 <div className="p-4">
                     <h1 className="text-2xl font-black text-gray-900 mb-4">My Orders</h1>
                     
                     {/* Orders Filter Tabs */}
                     <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                         {[
                             { label: 'All', val: 'ALL' },
                             { label: 'Deals', val: VerticalType.DEALS },
                             { label: 'Rural', val: VerticalType.RURAL },
                             { label: 'Makers', val: VerticalType.MAKERS }
                         ].map(tab => (
                             <button
                                key={tab.label}
                                onClick={() => setOrderFilter(tab.val as any)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                                    orderFilter === tab.val 
                                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' 
                                    : 'bg-white text-gray-500 border-gray-200'
                                }`}
                             >
                                 {tab.label}
                             </button>
                         ))}
                     </div>

                     {filteredOrders.length === 0 ? (
                        <div className="flex flex-col gap-4 items-center justify-center py-20 text-gray-400">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                                <ListIcon className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="font-medium">No active orders in this section.</p>
                        </div>
                     ) : (
                         <div className="space-y-4">
                             {filteredOrders.map(order => (
                                 <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                     <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                                         <span className="text-xs font-bold text-gray-500">#{order.id}</span>
                                         <span className={`text-xs font-bold px-2 py-1 rounded-lg ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                             {order.status.toUpperCase()}
                                         </span>
                                     </div>
                                     <div className="space-y-2 mb-3">
                                         {order.items.map(item => (
                                             <div key={item.id} className="flex justify-between text-sm">
                                                 <span className="text-gray-700">{item.name} x {item.quantity}</span>
                                                 <span className="font-bold">₹{item.price * item.quantity}</span>
                                             </div>
                                         ))}
                                     </div>
                                     <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                         <span className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
                                         <div className="flex items-center gap-2">
                                             <span className="font-black text-lg">₹{order.items.reduce((acc, i) => acc + i.price * i.quantity, 0)}</span>
                                             {order.status !== 'delivered' && (
                                                 <button 
                                                     onClick={() => {
                                                         if (window.confirm('Are you sure you want to cancel this order?')) {
                                                             cancelOrder(order.id);
                                                         }
                                                     }}
                                                     className="ml-2 px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition-colors"
                                                 >
                                                     Cancel
                                                 </button>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
                 <BottomNav />
            </div>
        ) : <Navigate to="/login" />} />

        <Route path="/ai" element={isAuthenticated ? (
            <div className="h-screen bg-white flex flex-col">
                <div className="p-4 border-b flex items-center gap-3 bg-white shadow-sm z-10">
                    <button onClick={() => navigate(-1)}><ArrowLeftIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2"><SparklesIcon className="text-emerald-500 w-4 h-4" /> ClearX Assistant</h2>
                        <p className="text-xs text-gray-500">Ask about sustainable products...</p>
                    </div>
                </div>
                <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center text-gray-400 text-sm">
                    AI Chat Interface would go here.
                </div>
            </div>
        ) : <Navigate to="/login" />} />

      </Routes>
      
      {/* Conditionally render BottomNav */}
      {isAuthenticated && !window.location.hash.includes('login') && !window.location.hash.includes('scan') && !window.location.hash.includes('ai') && !window.location.hash.includes('product') && !window.location.hash.includes('seller-onboarding') && !window.location.hash.includes('checkout') && <BottomNav />}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <AppContent />
      </Router>
    </StoreProvider>
  );
}