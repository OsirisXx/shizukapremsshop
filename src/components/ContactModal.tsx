import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FACEBOOK_PROFILE_URL = "https://www.facebook.com/profile.php?id=61565209891499";

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4"
          onClick={onClose} // Close when clicking backdrop
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Header */}
            <div className="bg-blue-900 p-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Welcome to Raijin's Commission Shop!
                </h3>
                <button
                  onClick={onClose}
                  className="text-blue-200 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-700 mb-6 text-base leading-relaxed">
                Please contact <a href={FACEBOOK_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold underline hover:no-underline transition-all">Raijin Offi</a> on Facebook for details regarding this service.
              </p>
            </div>

            {/* Footer Link */}
            <div className="px-6 pb-6 pt-4 text-center bg-slate-50 border-t border-slate-200">
              <a
                href={FACEBOOK_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium text-base rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Click Here to be Redirected
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 