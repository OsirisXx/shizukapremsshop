import React, { useState, useEffect } from 'react';
import { Navigate, Link, Routes, Route, Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Tabs } from '../../components/ui/Tabs';
import { AdminCategoriesManager } from './AdminCategoriesManager';
import { AdminItemsManager } from './AdminItemsManager';
import { AdminServicesManager } from './AdminServicesManager';
import { AdminImagesManager } from './AdminImagesManager';
import { AdminProofsManager } from './AdminProofsManager';
import { LayoutDashboard, Boxes, Image, Settings, MessageSquare, Users, Tag, Server } from 'lucide-react';

const adminNavItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Categories', path: '/admin/categories', icon: Boxes },
  { name: 'Items', path: '/admin/items', icon: Tag },
  { name: 'Services', path: '/admin/services', icon: Server },
  { name: 'Proofs', path: '/admin/proofs', icon: Image },
  { name: 'Pricing Tiers', path: '/admin/pricing-tiers', icon: Boxes },
];

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-peach-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {adminNavItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-peach-100 text-peach-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`
                  }
                  end={item.path === '/admin'} 
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-auto">
         {/* Using Outlet for nested routes defined in App.tsx or a parent router */}
         {/* Alternatively, define Routes directly here if this is the main admin layout */}
         <Outlet /> 
         {/* OR Define Routes here if not nested 
          <Routes>
              <Route index element={<AdminWelcome />} /> 
              <Route path="categories" element={<AdminCategoriesManager />} />
              <Route path="items" element={<AdminItemsManager />} />
              <Route path="services" element={<AdminServicesManager />} />
              <Route path="proofs" element={<AdminProofsManager />} />
            </Routes>
         */}
      </main>
    </div>
  );
};

export const AdminWelcome: React.FC = () => (
  <div className="text-center p-8 bg-white rounded-lg shadow">
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to the Admin Dashboard!</h3>
    <p className="text-gray-600">Select a section from the sidebar to get started.</p>
  </div>
);