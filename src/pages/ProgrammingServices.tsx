import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Gallery } from '../components/Gallery';
import { ServicesList } from '../components/ServicesList';
import { Code, Briefcase, BookCheck } from 'lucide-react';
import { ContactModal } from '../components/ContactModal';

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
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);

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
      <div className="container mx-auto px-4 py-12 text-center text-red-600 bg-white">
        Error: 'programming-services' category not found.
      </div>
    );
  }

  const handleCardClick = (tabName: string) => {
    console.log('Card clicked:, tabName');
    setActiveTab(tabName);
  };

  const openContactModal = () => {
    setIsContactModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-12 bg-slate-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            {programmingCategory 
              ? (programmingCategory.name === 'Programming Services' 
                  ? "Raijin's Programming Services" 
                  : programmingCategory.name)
              : 'Loading Services...'}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {programmingCategory ? programmingCategory.description : 'Loading description...'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white 
                        ${activeTab === 'services' ? 'ring-2 ring-blue-600 shadow-xl border-blue-300' : 'border border-slate-200 hover:border-blue-300'}`}
            onClick={() => handleCardClick('services')}
            bordered
            interactive={true}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
              <h3 className="text-lg font-semibold text-blue-800">Services Offered</h3>
              <Code className={`h-6 w-6 ${activeTab === 'services' ? 'text-blue-600' : 'text-slate-400'}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-500">
                View the programming services I provide.
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white 
                        ${activeTab === 'proofs' ? 'ring-2 ring-blue-600 shadow-xl border-blue-300' : 'border border-slate-200 hover:border-blue-300'}`}
            onClick={() => handleCardClick('proofs')}
            bordered
            interactive={true}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
              <h3 className="text-lg font-semibold text-blue-800">Proofs of Work</h3>
              <BookCheck className={`h-6 w-6 ${activeTab === 'proofs' ? 'text-blue-600' : 'text-slate-400'}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-500">
                See examples and evidence of completed tasks.
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white 
                        ${activeTab === 'projects' ? 'ring-2 ring-blue-600 shadow-xl border-blue-300' : 'border border-slate-200 hover:border-blue-300'}`}
            onClick={() => handleCardClick('projects')}
            bordered
            interactive={true}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
              <h3 className="text-lg font-semibold text-blue-800">Projects</h3>
              <Briefcase className={`h-6 w-6 ${activeTab === 'projects' ? 'text-blue-600' : 'text-slate-400'}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-500">
                Explore larger projects I have worked on.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg border border-blue-700 p-6 min-h-[300px]">
          {isContentLoading ? (
            <div className="flex justify-center items-center h-full min-h-[250px]">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
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
                  <ServicesList 
                    services={currentServices} 
                    isLoading={isContentLoading} 
                    onServiceItemClick={openContactModal}
                  />
                )}

                {(activeTab === 'proofs' || activeTab === 'projects') && (
                  <Gallery 
                    images={currentImages} 
                    title={activeTab === 'proofs' ? "Proofs of Work" : "Projects"} 
                    emptyMessage={`No ${activeTab} available for this category yet.`}
                    isLoading={isContentLoading} 
                    onImageItemClick={openContactModal}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
};