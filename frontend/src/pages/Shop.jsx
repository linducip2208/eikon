import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { getImageUrl } from "../utils/api";
import { Search, ChevronLeft, ChevronRight, Inbox, ChevronDown, ArrowRight } from "lucide-react";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic categories state loaded from backend
  const [categories, setCategories] = useState([]);

  // Search input state
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  // Query parameters from URL
  const categoryIdParam = searchParams.get("category_id") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const pageParam = parseInt(searchParams.get("page")) || 1;
  const limitParam = parseInt(searchParams.get("limit")) || 10;

  // Pagination metadata from API response
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Debouncing search updates to URL search params
  const debounceTimeoutRef = useRef(null);

  const updateSearchParam = useCallback((val) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        if (val) {
          prev.set("search", val);
        } else {
          prev.delete("search");
        }
        prev.set("page", "1");
        return prev;
      });
    }, 400);
  }, [setSearchParams]);

  // Handle text typing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    updateSearchParam(value);
  };

  // 1. Fetch categories dynamically
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST);
        if (res.success) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error("Gagal mengambil kategori:", error);
      }
    }
    loadCategories();
  }, []);

  // 2. Fetch products dynamically
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const queryParams = {
          page: pageParam,
          limit: limitParam,
          search: searchParams.get("search") || "",
          category_id: categoryIdParam,
          sort: sortParam,
          status: "active",
        };

        const res = await request.get(API_ENDPOINTS.PRODUCTS.LIST, queryParams);
        if (res.success) {
          setProducts(res.data);
          setPaginationMeta(res.pagination);
        }
      } catch (error) {
        console.error("Error loading products in shop:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [pageParam, limitParam, categoryIdParam, sortParam, searchParams]);

  const handleCategorySelect = (id) => {
    setSearchParams((prev) => {
      if (!id) {
        prev.delete("category_id");
      } else {
        prev.set("category_id", id.toString());
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSearchParams((prev) => {
      prev.set("sort", val);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleLimitChange = (e) => {
    const val = e.target.value;
    setSearchParams((prev) => {
      prev.set("limit", val);
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > paginationMeta.totalPages) return;
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:space-y-12">
      {/* Page Title */}
      <div className="space-y-2 border-b border-stone-100 pb-6">
        <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-stone-400">Katalog Pakaian</span>
        <h1 className="font-serif text-3xl md:text-5xl font-light text-stone-900 uppercase tracking-widest">Koleksi Belanja</h1>
      </div>

      {/* Controls: Search, Filter, Sort, Limit */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between bg-stone-50/50 p-6 border border-stone-100 rounded">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            className="w-full bg-white border border-stone-200 pl-10 pr-4 py-2.5 lg:py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400 rounded-none shadow-xs"
            placeholder="Cari pakaian..."
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>

        {/* Categories filters (Responsive horizontal scroll on mobile, wrap on desktop) */}
        <div className="flex items-center overflow-x-auto scrollbar-none gap-2 pb-2 lg:pb-0 lg:flex-wrap lg:overflow-x-visible w-full lg:w-auto">
          {/* Custom inline styling to hide scrollbars on modern browsers for cleaner premium look */}
          <style>{`
            .scrollbar-none::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-none {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <button
            onClick={() => handleCategorySelect("")}
            className={`px-4 py-2 lg:py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-250 rounded-none ${!categoryIdParam
              ? "bg-stone-900 text-white shadow-sm"
              : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400"
              }`}
          >
            Semua
          </button>
          {categories.map((cat) => {
            const isActive = categoryIdParam === cat.id.toString();
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 lg:py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-250 rounded-none ${isActive
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400"
                  }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Sort & Limit (Grid columns on mobile for perfect alignment, flex on desktop) */}
        <div className="grid grid-cols-2 gap-4 w-full lg:flex lg:w-auto lg:items-center lg:gap-6">
          <div className="flex flex-col gap-1.5 w-full lg:flex-row lg:items-center lg:gap-2 lg:w-auto">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold whitespace-nowrap">Urutkan:</span>
            <div className="relative w-full lg:w-48">
              <select
                value={sortParam}
                onChange={handleSortChange}
                className="w-full appearance-none bg-white border border-stone-200 text-xs text-stone-800 pl-3 pr-8 py-2.5 lg:py-1.5 focus:border-stone-900 focus:outline-none rounded-none shadow-xs transition-all"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="price_asc">Harga: Rendah - Tinggi</option>
                <option value="price_desc">Harga: Tinggi - Rendah</option>
                <option value="name_asc">Nama: A - Z</option>
                <option value="name_desc">Nama: Z - A</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full lg:flex-row lg:items-center lg:gap-2 lg:w-auto">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold whitespace-nowrap">Tampil:</span>
            <div className="relative w-full lg:w-32">
              <select
                value={limitParam}
                onChange={handleLimitChange}
                className="w-full appearance-none bg-white border border-stone-200 text-xs text-stone-800 pl-3 pr-8 py-2.5 lg:py-1.5 focus:border-stone-900 focus:outline-none rounded-none shadow-xs transition-all"
              >
                <option value="10">10 Pakaian</option>
                <option value="25">25 Pakaian</option>
                <option value="50">50 Pakaian</option>
                <option value="100">100 Pakaian</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Display - Modified to show 2 columns on mobile: grid-cols-2 */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="space-y-4 animate-pulse">
              <div className="bg-stone-100 aspect-[3/4] w-full" />
              <div className="h-4 bg-stone-100 w-2/3" />
              <div className="h-3 bg-stone-100 w-1/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 border border-dashed border-stone-200 bg-stone-50/50">
          <Inbox className="h-10 w-10 text-stone-300" />
          <h3 className="font-serif text-lg text-stone-600 font-light">Tidak ada pakaian ditemukan</h3>
          <p className="text-xs text-stone-400">Silakan sesuaikan filter atau input pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
          {products.map((product) => {
            const imageUrl = getImageUrl(product.image);

            return (
              <div key={product.id} className="group space-y-3 sm:space-y-4 fade-in flex flex-col justify-between">
                <div className="space-y-3">
                  <Link to={`/product/${product.id}`} className="block overflow-hidden bg-stone-50 border border-stone-100">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {(product.is_preorder === 1 || product.is_preorder === true) && (
                        <div className="absolute top-3 left-3 z-10 bg-stone-900 text-white text-[8px] sm:text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1.5 shadow-sm">
                          Pre-Order: {product.preorder_days || 14} Hari
                        </div>
                      )}
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-stone-450">
                        {product.category || "Tanpa Kategori"}
                      </span>
                      <span className="text-[9px] md:text-[10px] font-medium tracking-wider uppercase text-stone-400">
                        {product.variants ? `${product.variants.length} Varian` : ""}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-1">
                      <h3 className="font-serif text-sm md:text-lg font-light text-stone-900 hover:text-stone-600 transition-colors line-clamp-1">
                        <Link to={`/product/${product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="text-[11px] md:text-xs font-semibold text-stone-900 whitespace-nowrap">{formatPrice(product.base_price)}</p>
                    </div>

                    {/* Truncate description max 4 lines */}
                    {product.description && (
                      <p className="text-xs text-stone-500 font-light line-clamp-4 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lihat Selengkapnya link */}
                <div className="pt-1">
                  <Link
                    to={`/product/${product.id}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-medium uppercase tracking-wider text-stone-900 hover:text-stone-600 hover:underline transition-colors"
                  >
                    <span>Lihat Selengkapnya</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && paginationMeta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-100 pt-6">
          <p className="text-xs text-stone-500">
            Menampilkan <span className="font-semibold text-stone-850">{products.length}</span> dari{" "}
            <span className="font-semibold text-stone-850">{paginationMeta.total}</span> pakaian
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(paginationMeta.page - 1)}
              disabled={paginationMeta.page === 1}
              className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:hover:text-stone-600 transition-colors bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: paginationMeta.totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => handlePageChange(pNum)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${paginationMeta.page === pNum
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 bg-white"
                  }`}
              >
                {pNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(paginationMeta.page + 1)}
              disabled={paginationMeta.page === paginationMeta.totalPages}
              className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:hover:text-stone-600 transition-colors bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
