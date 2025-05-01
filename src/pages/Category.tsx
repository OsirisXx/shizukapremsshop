import React, { useEffect, useState, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { CommentList } from '../components/comments/CommentList';
import { X } from 'lucide-react';

interface PricingTier {
  id: number;
  item_id: number;
  duration_months: number;
  price: number;
}

interface ItemWithTiers {
    id: number;
    name: string;
    price: number;
    description: string | null;
    duration_months: number | null;
    category_id: number;
    images: { url: string }[] | null;
    is_available: boolean;
}

interface CategoryProps {
  defaultSlug?: string;
}

// Background style - softer gradient
const backgroundStyle = {
  background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', // Very light pink gradient
};

export const Category: React.FC<CategoryProps> = ({ defaultSlug }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const { 
    categories, 
    fetchCategories, 
    getCategory,
    items: storeItems,
    fetchItems,
    fetchPricingTiers,
    isLoading: storeIsLoading,
    error: storeError
  } = useStore();
  const [category, setCategory] = useState<any | null>(null);
  const [items, setItems] = useState<ItemWithTiers[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithTiers | null>(null);
  const [modalTiers, setModalTiers] = useState<PricingTier[]>([]);
  const [isLoadingModalTiers, setIsLoadingModalTiers] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, []);

  useEffect(() => {
    const effectiveSlug = paramSlug || defaultSlug;

    if (effectiveSlug && categories.length > 0) {
      const foundCategory = getCategory(effectiveSlug);
      setCategory(foundCategory);
      
      if (foundCategory) {
        fetchItems(foundCategory.id);
      }
    }
  }, [paramSlug, defaultSlug, categories, getCategory, fetchItems]);

  useEffect(() => {
      if (category) {
          const categoryItems = storeItems.filter(item => item.category_id === category.id);
          setItems(categoryItems);
          console.log(`Updated local items for category ${category.id}:`, categoryItems.length);
      }
  }, [storeItems, category]);

  // --- Modal Functions --- 
  const handleOpenModal = async (item: ItemWithTiers) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    setModalError(null);
    setIsLoadingModalTiers(true);
    setModalTiers([]);
    try {
      const tiers = await fetchPricingTiers(item.id);
      setModalTiers(tiers);
    } catch (err: any) {
      setModalError(err.message || 'Failed to load pricing details.');
    } finally {
      setIsLoadingModalTiers(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setModalTiers([]);
    setModalError(null);
  };
  // --- End Modal Functions ---

  return (
    // Apply new background and padding
    <div className="min-h-screen py-12 md:py-16" style={backgroundStyle}>
      <div className="container mx-auto px-4">
        {storeIsLoading && !category ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : storeError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{storeError}</span>
          </div>
        ) : !category ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            Category not found.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Enhanced Title Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-extrabold text-pink-600 mb-3 tracking-tight">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-pink-800 max-w-2xl mx-auto opacity-80">{category.description}</p>
              )}
              {/* Add Facebook link for premium-accounts */}
              {category.slug === 'premium-accounts' && (
                  <p className="text-center text-lg text-pink-800 mt-4">
                      For Orders & inquiries please message <a href="https://www.facebook.com/profile.php?id=100094073032931" target="_blank" rel="noopener noreferrer" className="font-semibold text-pink-600 hover:underline">Shizuka Prems</a> on Facebook!
                  </p>
              )}
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row lg:space-x-10">

              {/* Left Column: Item Grid - adjusted width */}
              <div className="lg:w-3/5 mb-10 lg:mb-0">
                {items.length === 0 && !storeIsLoading ? (
                  <div className="text-center py-12 text-pink-700 bg-white/50 p-8 rounded-xl shadow-sm">
                    No items found yet! <span className="font-semibold">Keep an eye out!</span> ✨
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} onViewDetails={() => handleOpenModal(item)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Comment Section - adjusted width */}
              <div className="lg:w-2/5">
                {/* Add a styled container for comments */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-pink-100 h-full">
                  <CommentList categoryId={category.id} />
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </div>

      {/* --- Pricing Tier Modal --- */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-pink-700">{selectedItem.name} Pricing</h3>
                <Button variant="ghost" size="sm" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                 {selectedItem.description && ( <p className='text-sm text-gray-600 mb-4'>{selectedItem.description}</p>)}
                 
                 <h4 className="text-md font-medium text-gray-800 border-t pt-4">Available Plans:</h4>
                 {isLoadingModalTiers ? (
                    <p className="text-center text-gray-500 py-4">Loading pricing...</p>
                 ) : modalError ? (
                    <p className="text-center text-red-600 py-4">Error: {modalError}</p>
                 ) : modalTiers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No specific pricing tiers found for this item.</p>
                 ) : (
                   <ul className="space-y-2">
                      {modalTiers.map(tier => (
                        <li key={tier.id} className="flex justify-between items-center bg-pink-50 p-3 rounded-md border border-pink-100">
                          <span className="font-medium text-pink-900">
                            {tier.duration_months} Month{tier.duration_months !== 1 ? 's' : ''}
                          </span>
                          <span className="font-bold text-lg text-pink-600">
                            ₱{tier.price.toFixed(2)}
                          </span>
                        </li>
                      ))}
                   </ul>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- End Modal --- */}
    </div>
  );
};

// --- Updated ItemCard to accept onViewDetails prop --- 
interface ItemCardProps {
  item: ItemWithTiers;
  onViewDetails: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onViewDetails }) => {
  const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : null;
  // Default placeholder if no image
  const displayImageUrl = imageUrl || 'https://via.placeholder.com/150/fbcfe8/9d174d?text=No+Image'; // Pink placeholder

  console.log('ItemCard received item:', item, 'Extracted imageUrl:', imageUrl);
  
  return (
    <motion.div
      className="rounded-2xl overflow-hidden shadow-lg bg-white transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-pink-100"
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {/* Image Container */}
      <div className="h-48 w-full overflow-hidden">
          <img 
            src={displayImageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
      </div>
      
      {/* Content Area */}
      <div className="p-5 space-y-3">
          {/* Title */}
          <h3 className="text-xl font-bold text-pink-800 truncate" title={item.name}>{item.name}</h3>
          
          {/* Price and Duration/Availability Row */}
          <div className="flex justify-between items-center text-sm">
              {/* Price */}
              <div className="text-2xl font-extrabold text-pink-500">
                  ₱{item.price.toFixed(2)}
              </div>
              {/* Availability & Duration Container */}
              <div className="text-right">
                  {/* Availability Status */}
                  <span className={`block text-xs font-semibold mb-0.5 ${item.is_available ? 'text-green-600' : 'text-red-600'}`}>
                      {item.is_available ? 'Available' : 'Not Available'}
                  </span>
                  {/* Duration */}
                  {item.duration_months && (
                      <div className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium inline-block">
                          {item.duration_months} {item.duration_months === 1 ? 'Month' : 'Months'}
                      </div>
                  )}
              </div>
          </div>

          {/* Description (Limited lines) */}
          {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          )}

          {/* Action Button - Updated onClick */}
          <div className="pt-2">
              <Button 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                onClick={onViewDetails}
              >
                View Details
              </Button>
          </div>
      </div>
    </motion.div>
  );
};