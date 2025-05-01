import React from 'react';
import { Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4">
      <div className="container mx-auto px-4 text-center text-sm text-gray-600">
        <a 
          href="https://www.facebook.com/profile.php?id=61565209891499" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:text-pink-600 transition-colors duration-200 font-medium"
        >
          <Facebook className="w-4 h-4 mr-2" />
          Raijin Programming Commissions
        </a>
        
        <span className="mx-2">&</span>
        
        <a 
          href="https://www.facebook.com/profile.php?id=100094073032931" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:text-pink-600 transition-colors duration-200 font-medium"
        >
          Shizuka Prems
        </a>
      </div>
    </footer>
  );
};