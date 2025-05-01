import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Category } from './pages/Category';
import { ProgrammingServices } from './pages/ProgrammingServices';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminWelcome } from './pages/admin/AdminDashboard';
import { AdminCategoriesManager } from './pages/admin/AdminCategoriesManager';
import { AdminItemsManager } from './pages/admin/AdminItemsManager';
import { AdminServicesManager } from './pages/admin/AdminServicesManager';
import { AdminProofsManager } from './pages/admin/AdminProofsManager';
import { AdminStraightSubManager } from './pages/admin/AdminStraightSubManager';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/premium-accounts" element={<Category defaultSlug="premium-accounts" />} />
              <Route path="/programming" element={<ProgrammingServices />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<AdminWelcome />} />
                <Route path="categories" element={<AdminCategoriesManager />} />
                <Route path="items" element={<AdminItemsManager />} />
                <Route path="services" element={<AdminServicesManager />} />
                <Route path="proofs" element={<AdminProofsManager />} />
                <Route path="pricing-tiers" element={<AdminStraightSubManager />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;