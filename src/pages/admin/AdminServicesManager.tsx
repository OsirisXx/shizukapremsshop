import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Save, X, Upload } from 'lucide-react';
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
  image_url?: string | null; // Added image_url
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
  const [formImageFile, setFormImageFile] = useState<File | null>(null); // Added file state
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null); // Added preview state
  const [isUploading, setIsUploading] = useState(false); // Added upload state

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFormImageFile(null);
      setFormImagePreview(editingService?.image_url || null); // Revert to original if file removed
    }
  };

  const startAddService = () => {
    if (!selectedMainCategoryId) return; // Use renamed state
    setEditingService(null);
    setNewService({
      name: '',
      description: '',
      category_id: selectedMainCategoryId, // Use category_id and renamed state
      category: '', // Restored field for service type
      image_url: null // Initialize image_url
    });
    setFormName('');
    setFormDescription('');
    setFormServiceType(''); // Use renamed state
    setFormImageFile(null); // Reset file
    setFormImagePreview(null); // Reset preview
  };

  const startEditService = (service: Service) => {
    setNewService(null);
    setEditingService(service);
    setFormName(service.name);
    setFormDescription(service.description);
    setFormServiceType(service.category || ''); // Restored logic
    setFormImageFile(null); // Reset file input on edit start
    setFormImagePreview(service.image_url || null); // Set preview to current image
  };

  const cancelEdit = () => {
    setEditingService(null);
    setNewService(null);
    setFormImageFile(null); // Reset file on cancel
    setFormImagePreview(null); // Reset preview on cancel
  };

  // --- Helper function to delete image from storage ---
  const deleteStoredImage = async (imageUrl: string | null | undefined) => {
    if (!imageUrl) return; // No URL, nothing to delete

    try {
      const url = new URL(imageUrl);
      const bucketName = 'programminglistbuckets'; 
      // Extract path carefully - adjust if your URL structure is different
      const pathPrefix = `/storage/v1/object/public/${bucketName}/`;
      let filePath = '';

      if (url.pathname.startsWith(pathPrefix)) {
        filePath = decodeURIComponent(url.pathname.substring(pathPrefix.length));
      } else {
        console.warn("Could not determine file path from URL structure:", imageUrl);
        // Attempt to extract path if it doesn't match expected prefix
        // This part might need adjustment based on actual stored URL paths
        const pathSegments = url.pathname.split('/');
        const potentialPath = pathSegments.slice(pathSegments.indexOf(bucketName) + 1).join('/');
        if (potentialPath) {
           filePath = decodeURIComponent(potentialPath);
           console.log("Attempting deletion with extracted path:", filePath);
        } else {
           console.error("Failed to extract file path for deletion.");
           return; // Cannot proceed without a path
        }
      }

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);
          
        if (storageError) { 
            console.error("Storage deletion error:", storageError);
            // Optionally notify user, but proceed with DB operation
            setError(`Storage deletion failed: ${storageError.message}. Proceeding with DB operation.`);
        } else {
          console.log("Successfully deleted old image:", filePath);
        }
      }
    } catch (error) {
      console.error("Error processing image URL for deletion:", error);
      setError("Error occurred while trying to delete the old image.");
    }
  };

  // --- Updated saveService function ---
  const saveService = async () => {
    if (!formName || !formDescription || !formServiceType || !selectedMainCategoryId) { 
      setError('Name, description, service type, and a selected main category are required');
      return;
    }
    
    setIsLoading(true);
    setIsUploading(false);
    setError(null);
    let imageUrlToSave: string | null | undefined = editingService?.image_url;

    try {
      // 1. Handle image upload if a new file is selected
      if (formImageFile) {
        setIsUploading(true);
        
        // 1a. Delete old image if editing and an old image exists
        if (editingService && editingService.image_url) {
          await deleteStoredImage(editingService.image_url);
        }
        
        // 1b. Upload new image
        const fileExt = formImageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Store directly in bucket root for simplicity, or add folder structure

        const { error: uploadError } = await supabase.storage
          .from('programminglistbuckets')
          .upload(filePath, formImageFile);

        if (uploadError) throw uploadError;

        // 1c. Get public URL
        const { data: urlData } = supabase.storage
          .from('programminglistbuckets')
          .getPublicUrl(filePath);
        
        imageUrlToSave = urlData.publicUrl;
        setIsUploading(false);
      } else if (editingService && formImagePreview === null) {
         // Handle case where image was explicitly cleared in the form (but no new file uploaded)
         await deleteStoredImage(editingService.image_url);
         imageUrlToSave = null;
      }

      // 2. Prepare data for database update/insert
      const serviceData: Partial<Service> & { name: string; description: string; category_id: number; category: string } = {
        name: formName,
        description: formDescription,
        category_id: selectedMainCategoryId,
        category: formServiceType,
        image_url: imageUrlToSave, // Use the potentially updated URL
      };
      
      // 3. Perform database operation
      let operationSuccess = false;
      if (editingService) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
          
        if (updateError) throw updateError;
        operationSuccess = true;
      } else if (newService) {
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData);
          
        if (insertError) throw insertError;
        operationSuccess = true;
      }
      
      // 4. Post-operation cleanup and reload
      if (operationSuccess) {
        if (selectedMainCategoryId) {
          await loadServices(selectedMainCategoryId);
        }
        setEditingService(null);
        setNewService(null);
        setFormName('');
        setFormDescription('');
        setFormServiceType(''); 
        setFormImageFile(null); 
        setFormImagePreview(null);
      }

    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  // --- Updated deleteService function ---
  const deleteService = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    let imageUrlToDelete: string | null = null;

    try {
       // 1. Find the image URL *before* deleting the record
      const serviceToDelete = services.find(s => s.id === id);
      imageUrlToDelete = serviceToDelete?.image_url || null;

      // 2. Delete database record
      const { error: dbError } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
        
      if (dbError) throw dbError;

      // 3. Delete image from storage *after* successful DB deletion
      if (imageUrlToDelete) {
         await deleteStoredImage(imageUrlToDelete);
      }
      
      // 4. Reload data
      if (selectedMainCategoryId) {
        await loadServices(selectedMainCategoryId);
      }
      
    } catch (err: any) {
      setError(`Deletion failed: ${err.message}`);
      console.error("Deletion error:", err);
       // Consider if partial deletion occurred (DB deleted but storage failed)
       // You might want to log this or notify the user more specifically
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
        <motion.div 
          className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6 mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h3>
          <div className="space-y-4">
            <Input 
              label="Service Name" 
              value={formName} 
              onChange={(e) => setFormName(e.target.value)} 
              placeholder="Enter service name"
            />
            {/* Textarea for Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={formDescription} 
                onChange={(e) => setFormDescription(e.target.value)} 
                placeholder="Enter service description" 
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
              />
            </div>
             {/* Service Type Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type (Sub-category)</label>
              <select
                value={formServiceType}
                onChange={(e) => setFormServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
              >
                <option value="">Select Type</option>
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Image (Optional)</label>
              <div className="mt-1 flex items-center space-x-4">
                {(formImagePreview || editingService?.image_url) && (
                  <img 
                    src={formImagePreview || editingService?.image_url || undefined}
                    alt="Preview" 
                    className="h-16 w-16 object-cover rounded-md border border-gray-300"
                  />
                )}
                <label className="relative cursor-pointer bg-white rounded-md border border-gray-300 py-2 px-3 shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-peach-500">
                  <Upload className="w-4 h-4 inline-block mr-1" />
                  <span>{formImageFile ? 'Change Image' : 'Upload Image'}</span>
                  <input 
                    id="file-upload"
                    name="file-upload"
                    type="file" 
                    className="sr-only" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                </label>
                {formImagePreview && (
                   <Button variant='ghost' size='sm' onClick={() => { setFormImageFile(null); setFormImagePreview(editingService?.image_url || null); }}>
                     <X className="w-4 h-4 mr-1" /> Clear Selection
                   </Button>
                )}
              </div>
            </div>

            {isUploading && (
              <div className="text-center text-peach-600 font-semibold mt-4">Uploading image...</div>
            )}

          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={cancelEdit} icon={<X className="w-5 h-5" />}>Cancel</Button>
            <Button onClick={saveService} icon={<Save className="w-5 h-5" />}>Save Service</Button>
          </div>
        </motion.div>
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