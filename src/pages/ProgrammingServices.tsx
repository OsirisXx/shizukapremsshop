import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Gallery } from '../components/Gallery';
import { ServicesList } from '../components/ServicesList';

export const ProgrammingServices: React.FC = () => {
  const { 
    categories, 
    fetchCategories,
    images,
    fetchImages,
    services,
    fetchServices,
    isLoading, 
    getCategory,
    getServicesByCategory,
    getImagesByCategory
  } = useStore();
  
  const [programmingCategory, setProgrammingCategory] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('services');

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchCategories, categories.length]);

  useEffect(() => {
    const category = getCategory('programming-services');
    if (category) {
      setProgrammingCategory(category);
    } else if (categories.length > 0) {
      console.warn("'programming-services' category not found.");
    }
  }, [categories, getCategory]);

  useEffect(() => {
    if (programmingCategory?.id) {
      const categoryId = programmingCategory.id;
      if (activeTab === 'proofs' || activeTab === 'projects') {
        fetchImages(activeTab, undefined, categoryId);
      } else if (activeTab === 'services') {
        fetchServices(categoryId);
      }
    }
  }, [programmingCategory, activeTab, fetchImages, fetchServices]);

  const currentServices = programmingCategory ? getServicesByCategory(programmingCategory.id) : [];
  const currentImages = programmingCategory ? getImagesByCategory(programmingCategory.id, activeTab) : [];

  const isContentLoading = isLoading || !programmingCategory;

  if (!programmingCategory && categories.length > 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-red-600">
        Error: 'programming-services' category not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {programmingCategory ? programmingCategory.name : 'Loading Services...'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {programmingCategory ? programmingCategory.description : 'Loading description...'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-10">
          <Tabs
            tabs={[
              { id: 'services', label: 'Services Offered' },
              { id: 'proofs', label: 'Proofs of Work' },
              { id: 'projects', label: 'Projects' }
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="mt-8">
            {isContentLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-peach-500"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'services' && (
                    <ServicesList services={currentServices} isLoading={isContentLoading} />
                  )}

                  {(activeTab === 'proofs' || activeTab === 'projects') && (
                    <Gallery 
                      images={currentImages} 
                      title={activeTab === 'proofs' ? "Proofs of Work" : "Projects"} 
                      emptyMessage={`No ${activeTab} available for this category yet.`}
                      isLoading={isContentLoading} 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};