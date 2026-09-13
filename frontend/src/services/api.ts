/// <reference types="vite/client" />
import { Product, DailySummary, FoodEntry, Meal, DailyGoal, WeightEntry, User } from '../types';
import { offlineCache } from './offlineCache';

const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('fitgordo_token');
}

export function setToken(token: string) {
  localStorage.setItem('fitgordo_token', token);
}

export function clearToken() {
  localStorage.removeItem('fitgordo_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Erro ao comunicar com o servidor.' }));
    throw new Error(errorData.detail || 'Erro na requisição.');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  register: async (email: string, password: string) => {
    const res = await request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
    return res;
  },

  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Credenciais inválidas.' }));
      throw new Error(err.detail || 'Erro ao efetuar login.');
    }

    const data = await res.json();
    setToken(data.access_token);
    return data;
  },

  getMe: () => request<User>('/auth/me'),

  // Products & Barcode
  getProducts: async (search?: string, favorite?: boolean) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (favorite !== undefined) params.append('favorite', String(favorite));
      const query = params.toString() ? `?${params.toString()}` : '';
      const products = await request<Product[]>(`/products${query}`);
      products.forEach(p => offlineCache.saveProduct(p));
      return products;
    } catch (e) {
      if (!navigator.onLine) {
        return offlineCache.getProducts();
      }
      throw e;
    }
  },

  getProductById: (id: number) => request<Product>(`/products/${id}`),

  getProductByBarcode: async (barcode: string): Promise<Product> => {
    // 1. Try local cache first
    const cached = offlineCache.getProductByBarcode(barcode);
    if (cached) return cached;

    // 2. Query backend API (which checks DB then Open Food Facts)
    const product = await request<Product>(`/products/barcode/${barcode}`);
    offlineCache.saveProduct(product);
    return product;
  },

  createProduct: async (productData: Partial<Product>) => {
    const p = await request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    offlineCache.saveProduct(p);
    return p;
  },

  updateProduct: (id: number, productData: Partial<Product>) => 
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  toggleFavorite: (id: number) => 
    request<Product>(`/products/${id}/favorite`, {
      method: 'POST',
    }),

  deleteProduct: (id: number) => 
    request<void>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Diary
  getDiaryByDate: async (dateStr: string): Promise<DailySummary> => {
    try {
      const summary = await request<DailySummary>(`/diary/date/${dateStr}`);
      offlineCache.saveDiary(dateStr, summary);
      return summary;
    } catch (e) {
      const cached = offlineCache.getDiary(dateStr);
      if (cached) return cached;
      throw e;
    }
  },

  getTodaySummary: () => request<DailySummary>('/diary/today'),

  addFoodEntry: (meal_type: string, product_id: number, quantity: number, unit: string = 'g', consumed_at?: string) =>
    request<FoodEntry>('/diary', {
      method: 'POST',
      body: JSON.stringify({ meal_type, product_id, quantity, unit, consumed_at }),
    }),

  deleteFoodEntry: (id: number) =>
    request<void>(`/diary/${id}`, {
      method: 'DELETE',
    }),

  // Meals
  getMeals: () => request<Meal[]>('/meals'),
  getMealById: (id: number) => request<Meal>(`/meals/${id}`),
  createMeal: (name: string, items: { product_id: number; quantity: number; unit: string }[]) =>
    request<Meal>('/meals', {
      method: 'POST',
      body: JSON.stringify({ name, items }),
    }),
  addMealToDiary: (meal_id: number, meal_type: string = 'Almoço', consumed_at?: string) =>
    request<FoodEntry[]>(`/meals/${meal_id}/add-to-diary?meal_type=${encodeURIComponent(meal_type)}`, {
      method: 'POST',
    }),
  deleteMeal: (id: number) =>
    request<void>(`/meals/${id}`, {
      method: 'DELETE',
    }),

  // Goals & Weight
  getGoals: () => request<DailyGoal>('/goals'),
  updateGoals: (goals: { calories: number; protein: number; carbs: number; fat: number }) =>
    request<DailyGoal>('/goals', {
      method: 'PUT',
      body: JSON.stringify(goals),
    }),
  getWeightEntries: (days: number = 30) => request<WeightEntry[]>(`/weight?days=${days}`),
  addWeightEntry: (weight: number, recorded_at?: string) =>
    request<WeightEntry>('/weight', {
      method: 'POST',
      body: JSON.stringify({ weight, recorded_at }),
    }),
  deleteWeightEntry: (id: number) =>
    request<void>(`/weight/${id}`, {
      method: 'DELETE',
    }),
};
