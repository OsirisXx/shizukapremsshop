import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

interface Service {
  id: number;
  name: string;
  description: string;
  image_url?: string | null;
}

interface ServicesListProps {
  services: Service[];
  isLoading: boolean;
  onServiceItemClick?: () => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({ services, isLoading, onServiceItemClick }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-peach-500"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No services available for this category yet.
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-blue-900 mb-6">Services Offered</h3>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {services.map((service) => (
          <motion.div key={service.id} variants={item}>
            <Card 
              className="h-full flex flex-col overflow-hidden rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
              onClick={onServiceItemClick}
              interactive={true}
            >
              {service.image_url && (
                <div className="w-full h-56 overflow-hidden relative">
                  <img 
                    src={service.image_url} 
                    alt={service.name} 
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
              )}
              <CardHeader className={`pt-4 px-4 ${service.image_url ? '' : 'pt-4'}`}>
                <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{service.name}</h4>
              </CardHeader>
              <CardContent className="flex-grow px-4 pb-4 pt-2">
                <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};