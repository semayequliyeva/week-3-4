'use client';

import React, { useReducer, useMemo, useState, useEffect } from 'react';
import { MOCK_INVENTORY, ProductItem } from '../data/inventoryData';
import { useDebounce } from '../hooks/useDebounce';

// Filtr steytinin interfeysi
export interface FilterState {
  categories: string[];
  maxPrice: number;
  inStockOnly: boolean;
  minRating: number;
  sortBy: 'price-asc' | 'price-desc' | 'rating-desc' | 'name-asc';
}

// Reducer fəaliyyət tipləri (Actions)
type FilterAction =
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'SET_MAX_PRICE'; payload: number }
  | { type: 'SET_IN_STOCK'; payload: boolean }
  | { type: 'SET_MIN_RATING'; payload: number }
  | { type: 'SET_SORT_BY'; payload: FilterState['sortBy'] }
  | { type: 'RESET_FILTERS' }
  | { type: 'LOAD_STATE'; payload: FilterState };

const INITIAL_FILTERS: FilterState = {
  categories: [],
  maxPrice: 700,
  inStockOnly: false,
  minRating: 0,
  sortBy: 'name-asc',
};

// Vahid steyt idareetmesi ucun reducer funksiyasi
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'TOGGLE_CATEGORY': {
      const exists = state.categories.includes(action.payload);
      const nextCategories = exists
        ? state.categories.filter((c) => c !== action.payload)
        : [...state.categories, action.payload];
      return { ...state, categories: nextCategories };
    }
    case 'SET_MAX_PRICE':
      return { ...state, maxPrice: action.payload };
    case 'SET_IN_STOCK':
      return { ...state, inStockOnly: action.payload };
    case 'SET_MIN_RATING':
      return { ...state, minRating: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'RESET_FILTERS':
      return INITIAL_FILTERS;
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

export default function MultiFilterDashboard() {
  // Axtaris metni ucun anliq steyt (UI cavabdehliyi ucun)
  const [searchInput, setSearchInput] = useState<string>('');
  // Debounce olunmus axtaris sohbeti (Performans ucun)
  const debouncedSearch = useDebounce(searchInput, 250);

  // Unified reducer steyti
  const [filters, dispatch] = useReducer(filterReducer, INITIAL_FILTERS);

  // Bütün unikal kateqoriyalarin siyahisi
  const availableCategories = useMemo(() => {
    return Array.from(new Set(MOCK_INVENTORY.map((item) => item.category)));
  }, []);

  // LocalStorage-den evvelki filtrleri yuklemek
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboard_filters_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch {
      // LocalStorage xetalarini sessizce kec
    }
  }, []);

  // Filtr steyti deyisdikde LocalStorage-a yazmaq
  useEffect(() => {
    try {
      localStorage.setItem('dashboard_filters_v1', JSON.stringify(filters));
    } catch {
      // LocalStorage xetalarini sessizce kec
    }
  }, [filters]);

  // 1. Datalarin anliq filtirlenmesi (AND hər sahə üçün, OR kateqoriyalar daxilində)
  const filteredProducts = useMemo(() => {
    return MOCK_INVENTORY.filter((item) => {
      // Axtaris sozune gore filtrleme (Name & Brand)
      if (
        debouncedSearch &&
        !item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
        !item.brand.toLowerCase().includes(debouncedSearch.toLowerCase())
      ) {
        return false;
      }

      // Kateqoriya uzre filtrleme (OR mentiqi)
      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
        return false;
      }

      // Maksimum qiymet uzre filtrleme
      if (item.price > filters.maxPrice) {
        return false;
      }

      // Stokda olma veziyyetine gore filtrleme
      if (filters.inStockOnly && !item.inStock) {
        return false;
      }

      // Minimum reyting uzre filtrleme
      if (item.rating < filters.minRating) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'rating-desc') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
  }, [debouncedSearch, filters]);

  // 2. Yalniz filtirlenmis datadan CANLI aqreqasiya gostericileri
  const metrics = useMemo(() => {
    const totalCount = filteredProducts.length;
    if (totalCount === 0) {
      return {
        totalCount: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        inStockCount: 0,
      };
    }

    const prices = filteredProducts.map((p) => p.price);
    const sumPrice = prices.reduce((acc, curr) => acc + curr, 0);
    const inStockCount = filteredProducts.filter((p) => p.inStock).length;

    return {
      totalCount,
      avgPrice: sumPrice / totalCount,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      inStockCount,
    };
  }, [filteredProducts]);

  // Aktiv filtrlerin varligini yoxlamaq
  const hasActiveFilters = useMemo(() => {
    return (
      searchInput.trim() !== '' ||
      filters.categories.length > 0 ||
      filters.maxPrice < 700 ||
      filters.inStockOnly ||
      filters.minRating > 0
    );
  }, [searchInput, filters]);

  // Butun filtrleri sifirlamaq
  const handleResetAll = () => {
    setSearchInput('');
    dispatch({ type: 'RESET_FILTERS' });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* Basliq */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Inventory Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time multi-criteria product filtering with live aggregation panel.
          </p>
        </div>

        {/* Ekran oxuyucular ucun anliq bildiris bölmesi */}
        <div aria-live="polite" className="sr-only">
          Showing {metrics.totalCount} matching products out of {MOCK_INVENTORY.length} total.
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetAll}
            className="self-start md:self-auto px-4 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 transition"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* CANLI PANELS (Live Summary Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Matching Items</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {metrics.totalCount} <span className="text-xs font-normal text-gray-400">/ {MOCK_INVENTORY.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Average Price</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${metrics.avgPrice.toFixed(2)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Price Range</span>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1">
            ${metrics.minPrice} - ${metrics.maxPrice}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">In Stock</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.inStockCount} <span className="text-xs font-normal text-gray-400">items</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Stock Rate</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {metrics.totalCount > 0 ? ((metrics.inStockCount / metrics.totalCount) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Esas Panel: Filtrler ve Cedvel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SOL TƏRƏF: FILTR PANELI */}
        <div className="lg:col-span-1 space-y-6 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 h-fit">
          <h2 className="text-lg font-bold border-b pb-3 dark:border-gray-800">Filter Products</h2>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Search Name / Brand</label>
            <input
              type="text"
              placeholder="e.g. Sony, Nike..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-sm p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories Checkboxes (OR logic) */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Categories</label>
            <div className="space-y-2">
              {availableCategories.map((cat) => (
                <label key={cat} className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat)}
                    onChange={() => dispatch({ type: 'TOGGLE_CATEGORY', payload: cat })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase text-gray-500">Max Price</label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">${filters.maxPrice}</span>
            </div>
            <input
              type="range"
              min="30"
              max="700"
              step="10"
              value={filters.maxPrice}
              onChange={(e) => dispatch({ type: 'SET_MAX_PRICE', payload: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Minimum Rating</label>
            <select
              value={filters.minRating}
              onChange={(e) => dispatch({ type: 'SET_MIN_RATING', payload: Number(e.target.value) })}
              className="w-full text-sm p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">All Ratings</option>
              <option value="4.0">4.0 ★ and above</option>
              <option value="4.5">4.5 ★ and above</option>
              <option value="4.8">4.8 ★ and above</option>
            </select>
          </div>

          {/* In Stock Only Checkbox */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => dispatch({ type: 'SET_IN_STOCK', payload: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
              />
              <span className="font-medium">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* SAĞ TƏRƏF: AKTİV FİLTR ÇİPLƏRİ VƏ MƏHSUL SİYAHISI */}
        <div className="lg:col-span-3 space-y-4">
          {/* Çeşidləmə və Aktiv Çiplər Zolağı */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
            {/* Active Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Active:</span>

              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-200"
                >
                  Text: "{searchInput}" ✕
                </button>
              )}

              {filters.categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => dispatch({ type: 'TOGGLE_CATEGORY', payload: cat })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-200"
                >
                  {cat} ✕
                </button>
              ))}

              {filters.maxPrice < 700 && (
                <button
                  onClick={() => dispatch({ type: 'SET_MAX_PRICE', payload: 700 })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-200"
                >
                  &le; ${filters.maxPrice} ✕
                </button>
              )}

              {filters.inStockOnly && (
                <button
                  onClick={() => dispatch({ type: 'SET_IN_STOCK', payload: false })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200"
                >
                  In Stock Only ✕
                </button>
              )}

              {filters.minRating > 0 && (
                <button
                  onClick={() => dispatch({ type: 'SET_MIN_RATING', payload: 0 })}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium hover:bg-purple-200"
                >
                  &ge; {filters.minRating} ★ ✕
                </button>
              )}

              {!hasActiveFilters && <span className="text-xs text-gray-400 italic">None</span>}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Sort By:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => dispatch({ type: 'SET_SORT_BY', payload: e.target.value as FilterState['sortBy'] })}
                className="text-xs p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="rating-desc">Rating (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Məhsul Cədvəli */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No products match your filters</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your price range, search query, or categories.</p>
                <button
                  onClick={handleResetAll}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <tr>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Brand</th>
                      <th className="p-3.5 text-right">Rating</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="p-3.5 font-semibold text-gray-900 dark:text-gray-100">{product.name}</td>
                        <td className="p-3.5 text-gray-500 dark:text-gray-400">{product.category}</td>
                        <td className="p-3.5 text-gray-500 dark:text-gray-400">{product.brand}</td>
                        <td className="p-3.5 text-right font-medium text-amber-500">★ {product.rating.toFixed(1)}</td>
                        <td className="p-3.5 text-center">
                          {product.inStock ? (
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold text-rose-700 bg-rose-100 rounded-full dark:bg-rose-950 dark:text-rose-300">
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-bold text-gray-900 dark:text-gray-100">${product.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}