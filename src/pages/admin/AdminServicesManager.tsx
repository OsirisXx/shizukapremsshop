import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Category {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category: string | null; // Restored field
}

// Define service category options (Service Type)
const SERVICE_TYPES = [
  'Frontend & UI/UX',
  'Backend & Data',
  'AI Integration & Automation',
  'Extra Services',
  'Other' // Fallback category
];

export const AdminServicesManager: React.FC = () => {
  const { 
    fetchServices: fetchServicesFromStore, 
    getServicesByCategory, // Using the updated store function
    fetchCategories: fetchMainCategories // Assuming categories are fetched elsewhere or rename for clarity
  } = useStore();
  const [services, setServices] = useState<Service[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]); // Renamed state
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | null>(null); // Renamed state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service> | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formServiceType, setFormServiceType] = useState<string>(''); // Renamed state for clarity

  useEffect(() => {
    loadMainCategories();
  }, []);

  useEffect(() => {
    if (selectedMainCategoryId) {
      loadServices(selectedMainCategoryId);
    } else {
      setServices([]);
    }
  }, [selectedMainCategoryId]);

  const loadMainCategories = async () => { // Renamed function
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch categories using the store function if available, or directly
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      setMainCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async (mainCategoryId: number) => { // Renamed parameter
    setIsLoading(true);
    setError(null);
    setServices([]);
    
    try {
      // Use the store function to fetch services by category
      await fetchServicesFromStore(mainCategoryId); 
      // Update local state from store (or directly use store state if preferred)
      setServices(getServicesByCategory(mainCategoryId))
      
      // Original direct fetch (keep as fallback or remove if store is reliable)
      // const { data, error } = await supabase
      //   .from('services')
      //   .select('*')
      //   .eq('category_id', mainCategoryId) // Use category_id
      //   .order('name');
      // if (error) throw error;
      // setServices((data as Service[]) || []);

    } catch (err: any) {
      setError(err.message);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startAddService = () => {
    if (!selectedMainCategoryId) return; // Use renamed state
    setEditingService(null);
    setNewService({
      name: '',
      description: '',
      category_id: selectedMainCategoryId, // Use category_id and renamed state
      category: '' // Restored field for service type
    });
    setFormName('');
    setFormDescription('');
    setFormServiceType(''); // Use renamed state
  };

  const startEditService = (service: Service) => {
    setNewService(null);
    setEditingService(service);
    setFormName(service.name);
    setFormDescription(service.description);
    setFormServiceType(service.category || ''); // Restored logic
  };

  const cancelEdit = () => {
    setEditingService(null);
    setNewService(null);
  };

  const saveService = async () => {
    // Use selectedMainCategoryId and formServiceType
    if (!formName || !formDescription || !formServiceType || !selectedMainCategoryId) { 
      setError('Name, description, service type, and a selected main category are required');
      return;
    }
    
    const serviceData = {
      name: formName,
      description: formDescription,
      category_id: selectedMainCategoryId, // Use category_id and renamed state
      category: formServiceType // Restored field
    };
    
    try {
      setIsLoading(true);
      setError(null);
      
      let operationSuccess = false;
      if (editingService) {
        // Update uses the full serviceData object which now includes category_id
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
          
        if (error) throw error;
        operationSuccess = true;
      } else if (newService) {
        // Insert uses the full serviceData object directly
        // const finalData = { ...serviceData, subcategory_id: selectedCategoryId }; // Removed old logic
        const { error } = await supabase
          .from('services')
          .insert(serviceData); // Use serviceData directly
          
        if (error) throw error;
        operationSuccess = true;
      }
      
      if (operationSuccess) {
        if (selectedMainCategoryId) {
          loadServices(selectedMainCategoryId); // Use renamed state
        }
        // fetchServicesFromStore(); // fetchServicesFromStore now takes categoryId, called inside loadServices
        
        setEditingService(null);
        setNewService(null);
        setFormName('');
        setFormDescription('');
        setFormServiceType(''); // Use renamed state
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      if (selectedMainCategoryId) {
        loadServices(selectedMainCategoryId); // Use renamed state
      }
      // fetchServicesFromStore(); // fetchServicesFromStore now takes categoryId, called inside loadServices
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Services</h2>
        
        <div className="flex space-x-2">
          {/* Main Category Selector */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
            value={selectedMainCategoryId || ''} // Use renamed state
            onChange={(e) => {
              const value = e.target.value;
              setSelectedMainCategoryId(value ? parseInt(value) : null); // Use renamed state
            }}
          >
            <option value="">Select Main Category</option> {/* Updated text */}
            {mainCategories.map((category) => ( // Use renamed state
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <Button 
            onClick={startAddService}
            icon={<PlusCircle className="w-5 h-5" />}
            disabled={!selectedMainCategoryId} // Use renamed state
          >
            Add Service
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Moved comment inside the block */}
      {!selectedMainCategoryId && (
        // Update condition to use renamed state
        <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded mb-6">
          Please select a main category to manage services.
        </div>
      )}
      
      {(editingService || newService) && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h3>
          
          <div className="space-y-4">
            <Input
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Service name"
              fullWidth
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Service description"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type {/* Updated label */}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
                value={formServiceType} // Use renamed state
                onChange={(e) => setFormServiceType(e.target.value)} // Use renamed state
              >
                <option value="">Select type</option> {/* Updated text */}
                {SERVICE_TYPES.map((type) => ( // Use renamed constant
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={cancelEdit}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                onClick={saveService}
                isLoading={isLoading}
                icon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {selectedMainCategoryId && ( // Use renamed state
        isLoading && !editingService && !newService ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-peach-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type {/* Updated header */}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No services found for the selected category.
                    </td>
                  </tr>
                ) : (
                  services.map((service) => (
                    <motion.tr 
                      key={service.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.category || '-'} {/* Restored field */}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap">
                        {service.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditService(service)}
                            icon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteService(service.id)}
                            icon={<Trash2 className="w-4 h-4" />}
                            className="text-error-500 hover:text-error-700 hover:bg-error-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};