import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Navbar({ cartCount, onCartOpen, isAuthenticated, onLogout }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-stone-100 bg-[#FBFBF9]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Left - Logo & Brand */}
          <div className="flex justify-start">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <img src="/logo.png" alt="elkon logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          {/* Center - Shop & Contact Us menu (Desktop only) */}
          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold tracking-[0.2em] text-stone-600 uppercase">
            <Link to="/shop" className="hover:text-stone-900 transition-colors duration-200">Belanja</Link>
            <Link to="/contact" className="hover:text-stone-900 transition-colors duration-200">Hubungi Kami</Link>
          </div>

          {/* Right - Profile, Cart, and Hamburger */}
          <div className="flex items-center space-x-4 md:space-x-6 text-stone-700">
            {/* Desktop Admin controls */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-sm font-medium hover:text-stone-900 transition-colors duration-200"
                  title="Dasbor Admin"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="hidden sm:inline text-[10px] tracking-wider uppercase">Dasbor</span>
                </Link>
                <button
                  onClick={() => {
                    onLogout();
                    navigate("/");
                  }}
                  className="hover:text-red-650 transition-colors duration-200"
                  title="Keluar"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Cart Button (Always visible) */}
            <button
              onClick={onCartOpen}
              className="relative flex items-center p-2 hover:text-stone-900 transition-colors duration-200"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-medium text-white ring-2 ring-[#FBFBF9]">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger toggle button */}
            <button
              onClick={toggleMobileMenu}
              className="flex md:hidden items-center p-2 hover:text-stone-900 transition-colors duration-200"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu drop-down overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-stone-100 bg-[#FBFBF9] py-4 px-6 space-y-2 shadow-sm animate-fade-in">
          <div className="flex flex-col space-y-1 text-xs font-semibold tracking-[0.2em] text-stone-600 uppercase">
            <Link
              to="/shop"
              className="hover:text-stone-900 py-3 border-b border-stone-50 transition-colors duration-200"
              onClick={closeMobileMenu}
            >
              Belanja
            </Link>
            <Link
              to="/contact"
              className="hover:text-stone-900 py-3 border-b border-stone-50 transition-colors duration-200"
              onClick={closeMobileMenu}
            >
              Hubungi Kami
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/admin"
                  className="flex items-center space-x-2 hover:text-stone-900 py-3 border-b border-stone-50 transition-colors duration-200"
                  onClick={closeMobileMenu}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dasbor Admin</span>
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onLogout();
                    navigate("/");
                  }}
                  className="flex items-center space-x-2 text-red-650 hover:text-red-750 py-3 transition-colors duration-200 text-left font-semibold uppercase tracking-[0.2em]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
