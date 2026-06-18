import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Wallets from "./pages/Wallets";
import Debts from "./pages/Debts";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import Assistant from "./pages/Assistant";
import FinancialPersona from "./pages/FinancialPersona";
import EmergencySOS from "./pages/EmergencySOS";
import { LanguageProvider } from "./context/LanguageContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { AuthProvider } from "./context/AuthContext";
import CategoriesManagement from "./pages/CategoriesManagement";

import GoalsManagement from "./pages/GoalsManagement";
import Subscriptions from "./pages/Subscriptions";
import InflationTracker from "./pages/InflationTracker";
import AdminDashboard from "./pages/AdminDashboard";
import PremiumModal from "./components/PremiumModal";
import BannedOverlay from "./components/BannedOverlay";

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CategoriesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="add" element={<AddTransaction />} />
                <Route path="wallets" element={<Wallets />} />
                <Route path="debts" element={<Debts />} />
                <Route path="profile" element={<Profile />} />
                <Route path="stats" element={<Statistics />} />
                <Route path="assistant" element={<Assistant />} />
                <Route path="persona" element={<FinancialPersona />} />
                <Route path="emergency-sos" element={<EmergencySOS />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="goals" element={<GoalsManagement />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="inflation" element={<InflationTracker />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            <PremiumModal />
            <BannedOverlay />
          </BrowserRouter>
        </CategoriesProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
