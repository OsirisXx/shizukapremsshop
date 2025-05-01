import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  description: string;
}

interface ServicesListProps {
  services: Service[];
  isLoading: boolean;
}

export const ServicesList: React.FC<ServicesListProps> = ({ services, isLoading }) => {
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
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">Services Offered</h3>
      
      <motion.div 
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {services.map((service) => (
          <motion.div
            key={service.id}
            variants={item}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-success-500 flex-shrink-0 mt-1" />
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900 mb-1">{service.name}</h4>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};