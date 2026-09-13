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
    const products = this.getProducts();
    return products.find(p => p.barcode === barcode) || null;
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
