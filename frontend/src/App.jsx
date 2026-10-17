import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

// Utils
import { request } from "./utils/request";
import { API_ENDPOINTS } from "./utils/endpoints";

// Components
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import { parsePreorderPolicy } from "./utils/preorderPolicy";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import RefundPolicy from "./pages/RefundPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import OrderStatus from "./pages/OrderStatus";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

// Helper component to scroll to top on route changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Reusable Floating WhatsApp Button component
function FloatingWhatsApp({ whatsappNumber }) {
  // Hide on admin and login paths
  const location = useLocation();
  const isAdminOrLogin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/login");
  
  if (isAdminOrLogin || !whatsappNumber) return null;

  const waUrl = `https://wa.me/${whatsappNumber}?text=Halo%20Eliteikon,%20saya%20tertarik%20dengan%20koleksi%20pakaian%20Anda.`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group hover:bg-[#20ba5a]"
      title="Hubungi kami via WhatsApp"
    >
      {/* Pulse effect */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-35 animate-ping group-hover:hidden" />
      {/* Icon */}
      <svg
        className="h-7 w-7 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.456 3.48 1.332 5.004L2 22l5.124-1.332c1.464.792 3.12 1.212 4.888 1.212 5.532 0 10.012-4.48 10.012-10.012C22.024 6.48 17.544 2 12.012 2zm5.736 14.292c-.24.672-1.2 1.236-1.656 1.296-.456.06-1.044.096-1.68-.108-.408-.132-.936-.312-1.572-.588-2.676-1.152-4.404-3.864-4.536-4.044-.132-.18-.996-1.32-.996-2.52 0-1.2.624-1.788.852-2.04.228-.252.504-.312.672-.312.168 0 .336.012.48.024.156.012.36-.048.564.444.204.492.708 1.728.768 1.848.06.12.096.264.012.432-.084.168-.18.276-.3.408-.12.132-.252.276-.36.384-.12.12-.24.252-.108.48.132.228.588.972 1.26 1.572.864.768 1.596 1.008 1.824 1.116.228.108.36.096.492-.048.132-.144.564-.66.72-.888.156-.228.312-.192.528-.108.216.084 1.368.648 1.608.768.24.12.408.18.468.276.06.108.06.612-.18 1.284z" />
      </svg>
    </a>
  );
}

export default function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Settings state (containing whatsapp_number)
  const [settings, setSettings] = useState({ whatsapp_number: "6287865407492" });

  // Load cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("elkon_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("elkon_cart", JSON.stringify(newCart));
  };

  // Verify auth token and profile
  useEffect(() => {
    async function verifyAuth() {
      const token = localStorage.getItem("elkon_token");
      if (token) {
        try {
          const res = await request.get(API_ENDPOINTS.AUTH.PROFILE);
          if (res.success) {
            setUser(res.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("elkon_token");
          }
        } catch (error) {
          localStorage.removeItem("elkon_token");
        }
      }
      setLoadingAuth(false);
    }
    verifyAuth();
  }, []);

  // Fetch settings parameters dynamically (whatsapp number, info bisnis, dll)
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await request.get(API_ENDPOINTS.SETTINGS.PUBLIC);
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
    loadSettings();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("elkon_token");
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Berhasil keluar sistem.");
  };

  const handleAddToCart = (product, variant, quantity) => {
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.variant.id === variant.id
    );

    let updatedCart = [...cart];
    if (existingIndex > -1) {
      const newQty = updatedCart[existingIndex].quantity + quantity;
      if (newQty > variant.stock) {
        toast.error(`Stok tidak mencukupi. Hanya tersedia ${variant.stock} item.`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
    } else {
      updatedCart.push({ product, variant, quantity });
    }

    saveCart(updatedCart);
    toast.success(`Berhasil menambahkan ${quantity}x ${product.name} (${variant.size}/${variant.color}) ke keranjang.`);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, variantId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId, variantId);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.product.id === productId && item.variant.id === variantId) {
        if (newQty > item.variant.stock) {
          toast.error(`Kuantitas melebihi stok yang tersedia (${item.variant.stock} item).`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    });

    saveCart(updatedCart);
  };

  const handleRemoveItem = (productId, variantId) => {
    const updatedCart = cart.filter(
      (item) => !(item.product.id === productId && item.variant.id === variantId)
    );
    saveCart(updatedCart);
    toast.success("Item dihapus dari keranjang.");
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBF9]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-850" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-[#FBFBF9]">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1C1B1A",
              color: "#FBFBF9",
              borderRadius: "0px",
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "12px 24px",
            },
          }}
        />

        <Navbar
          cartCount={totalCartCount}
          onCartOpen={() => setIsCartOpen(true)}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
        />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} whatsappNumber={settings.whatsapp_number} preorderPolicy={parsePreorderPolicy(settings)} />} />
            <Route path="/order/:referenceId" element={<OrderStatus />} />
            <Route path="/contact" element={<Contact settings={settings} />} />
            <Route path="/faq" element={<FAQ settings={settings} />} />
            <Route path="/refund-policy" element={<RefundPolicy settings={settings} />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy settings={settings} />} />
            <Route path="/terms" element={<Terms settings={settings} />} />
            
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/admin" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
              }
            />

            <Route
              path="/admin"
              element={
                isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer settings={settings} />

        {/* Global Floating WhatsApp button */}
        <FloatingWhatsApp whatsappNumber={settings.whatsapp_number} />
      </div>
    </BrowserRouter>
  );
}
