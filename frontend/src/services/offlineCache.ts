import { Product, DailySummary } from '../types';

const PRODUCTS_CACHE_KEY = 'fitgordo_cached_products';
const DIARY_CACHE_PREFIX = 'fitgordo_cached_diary_';

export const offlineCache = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(PRODUCTS_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProduct(product: Product) {
    try {
      const existing = this.getProducts();
      const filtered = existing.filter(p => p.id !== product.id && p.barcode !== product.barcode);
      filtered.unshift(product);
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(filtered.slice(0, 200)));
    } catch (e) {
      console.warn('Failed to cache product offline:', e);
    }
  },

  getProductByBarcode(barcode: string): Product | null {
    const clean = barcode.trim();
    const products = this.getProducts();
    return products.find(p => {
      if (!p.barcode) return false;
      const b = p.barcode.trim();
      return (
        b === clean ||
        b.replace(/^0+/, '') === clean.replace(/^0+/, '') ||
        (clean.length < 13 && clean.padStart(13, '0') === b) ||
        (b.length < 13 && b.padStart(13, '0') === clean)
      );
    }) || null;
  },

  getDiary(dateStr: string): DailySummary | null {
    try {
      const data = localStorage.getItem(DIARY_CACHE_PREFIX + dateStr);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveDiary(dateStr: string, summary: DailySummary) {
    try {
      localStorage.setItem(DIARY_CACHE_PREFIX + dateStr, JSON.stringify(summary));
    } catch (e) {
      console.warn('Failed to cache diary offline:', e);
    }
  }
};
