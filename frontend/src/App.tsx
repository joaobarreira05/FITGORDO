import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';

import { Dashboard } from './pages/Dashboard';
import { DiaryPage } from './pages/DiaryPage';
import { ScannerPage } from './pages/ScannerPage';
import { ProductsListPage } from './pages/ProductsListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CreateCustomProductPage } from './pages/CreateCustomProductPage';
import { MealsPage } from './pages/MealsPage';
import { HistoryPage } from './pages/HistoryPage';
import { WeightPage } from './pages/WeightPage';
import { GoalsPage } from './pages/GoalsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddMealType, setQuickAddMealType] = useState('Almoço');

  const handleOpenQuickAdd = (mealType?: string) => {
    if (mealType) setQuickAddMealType(mealType);
    setQuickAddOpen(true);
  };

  return (
    <BrowserRouter>
      <div className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Header onOpenQuickAdd={() => handleOpenQuickAdd()} />

        <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4">
          <Routes>
            <Route path="/" element={<Dashboard onOpenQuickAdd={() => handleOpenQuickAdd()} />} />
            <Route path="/diary" element={<DiaryPage onOpenQuickAdd={(m) => handleOpenQuickAdd(m)} />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/products/new" element={<CreateCustomProductPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/weight" element={<WeightPage />} />
            <Route path="/settings/goals" element={<GoalsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        <BottomNav onOpenQuickAdd={() => handleOpenQuickAdd()} />

        <QuickAddModal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          mealType={quickAddMealType}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
