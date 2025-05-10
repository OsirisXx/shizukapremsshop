import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Determine brand name based on path
  const brandName = 
    location.pathname === '/' 
      ? "Shizuka Prems & Raijin Programming Commissions" 
      : location.pathname === '/programming' 
        ? "Raijin Commissions" 
        : "Shizuka Prems";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-gray-100 bg-white/80">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <motion.div
              whileHover={{ rotate: 5 }}
              className="flex-shrink-0 mr-2"
            >
              <ShoppingBag className="w-8 h-8 text-peach-500" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900">{brandName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-peach-500 font-medium">
              Home
            </Link>
            <Link to="/premium-accounts" className="text-gray-700 hover:text-peach-500 font-medium">
              Premium Accounts
            </Link>
            <Link to="/programming" className="text-gray-700 hover:text-peach-500 font-medium">
              Programming
            </Link>
            {!user ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
              </div>
            ) : (
              <div className="relative group">
                <button className="flex items-center space-x-1">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-accent-600" />
                  </div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-peach-50 hover:text-peach-500 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-peach-50 hover:text-peach-500 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-peach-50 hover:text-peach-500 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <nav className="px-4 py-3 space-y-2 bg-white border-t border-gray-100">
              <Link
                to="/"
                className="block py-2 text-gray-700 hover:text-peach-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/premium-accounts"
                className="block py-2 text-gray-700 hover:text-peach-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Premium Accounts
              </Link>
              <Link
                to="/programming"
                className="block py-2 text-gray-700 hover:text-peach-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Programming
              </Link>
              {!user ? (
                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate('/register');
                      setIsMenuOpen(false);
                    }}
                  >
                    Register
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center py-2 text-gray-700 hover:text-peach-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center py-2 text-gray-700 hover:text-peach-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5 mr-2" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full py-2 text-gray-700 hover:text-peach-500"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};