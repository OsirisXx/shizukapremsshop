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

interface Item {
  id: number;
  name: string;
  price: number;
  description: string | null;
  duration_months: number | null;
  category_id: number;
  is_available: boolean;
}

// Define Bucket Name
const IMAGE_BUCKET = 'item-images';

export const AdminItemsManager: React.FC = () => {
  const { fetchItems } = useStore();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item> | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDurationMonths, setFormDurationMonths] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadItems(selectedCategoryId);
    } else {
      setItems([]);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItems = async (categoryId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('items')
        .select('*')
        .eq('category_id', categoryId);
      
      const { data, error } = await query.order('name');
        
      if (error) throw error;
      
      setItems((data as Item[] | null) || []);
    } catch (err: any) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const startAddItem = () => {
    setEditingItem(null);
    setNewItem({
      name: '',
      price: 0,
      description: '',
      duration_months: null,
      category_id: selectedCategoryId || undefined,
    });
    setFormName('');
    setFormPrice('0');
    setFormDescription('');
    setFormDurationMonths('');
    setFormCategoryId(selectedCategoryId || '');
    setSelectedFile(null);
  };

  const startEditItem = (item: Item) => {
    setNewItem(null);
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormDescription(item.description || '');
    setFormDurationMonths(item.duration_months?.toString() || '');
    setFormCategoryId(item.category_id);
    setSelectedFile(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItem(null);
    setSelectedFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const uploadAndLinkImage = async (itemId: number, file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${itemId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Image Upload Error: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not get public URL for uploaded image.');
      }
      
      const publicUrl = urlData.publicUrl;
      console.log('Uploaded Image URL:', publicUrl);

      const { error: insertError } = await supabase
        .from('images')
        .insert({ 
          item_id: itemId, 
          url: publicUrl, 
          type: 'proofs'
        });

      if (insertError) {
        throw new Error(`DB Insert Error: ${insertError.message}`);
      }

      console.log('Image linked successfully to item', itemId);
      setSelectedFile(null);

    } catch (err: any) {        
      console.error("Error during image upload/linking:", err);
      setError(`Failed to upload/link image: ${err.message}. Please try again or save item without image.`);
    } finally {
      setIsUploading(false);
    }
  };

  const saveItem = async () => {
    if (!formName || !formPrice || !formCategoryId) {
      setError('Name, Price, and Category are required');
      return;
    }

    const itemData: Partial<Item> & { category_id: number } = {
      name: formName,
      price: parseFloat(formPrice),
      description: formDescription || null,
      duration_months: formDurationMonths ? parseInt(formDurationMonths, 10) : null,
      category_id: formCategoryId,
    };

    // Ensure description is not empty string, convert to null if it is
    if (itemData.description === '') {
      itemData.description = null;
    }

    // Ensure duration is null if empty or invalid
    if (!formDurationMonths || isNaN(parseInt(formDurationMonths, 10))) {
        itemData.duration_months = null;
    }

    try {
      setIsLoading(true);
      setError(null);
      let savedItem: Item | null = null;

      if (editingItem) {
        // Remove is_available from update data as it's handled separately
        const { is_available, ...updateData } = itemData as any;
        
        const { data, error } = await supabase
          .from('items')
          .update(updateData)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) throw error;
        savedItem = data;
        console.log('Item updated:', savedItem);

      } else if (newItem) {
        // Set default availability for new items
        const insertData = { ...itemData, is_available: true };
        const { data, error } = await supabase
          .from('items')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        savedItem = data;
        console.log('Item added:', savedItem);
      }

      if (savedItem && selectedFile) {
        await uploadAndLinkImage(savedItem.id, selectedFile);
      }

      // Reload items for the current category
      if (selectedCategoryId) {
        loadItems(selectedCategoryId);
      }
      fetchItems(); // Refetch all items in the store

      // Reset form
      cancelEdit();

    } catch (err: any) {
      console.error('Error saving item:', err);
      setError(`Failed to save item: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsUploading(false); 
    }
  };

  const deleteItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item and associated images?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      // Potential Enhancement: Delete associated images from storage first

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Reload items for the current category
      if (selectedCategoryId) {
        loadItems(selectedCategoryId);
      }
      fetchItems(); // Refetch all items in the store

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
  };

  // --- FORM JSX (Helper Function) --- 
  const renderForm = () => (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow mb-6 border border-peach-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl font-semibold mb-4 text-peach-700">
        {editingItem ? 'Edit Item' : 'Add New Item'}
      </h3>
      <form onSubmit={(e) => { e.preventDefault(); saveItem(); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input id="itemName" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <Input id="itemPrice" type="number" step="0.01" min="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                id="itemDescription" 
                value={formDescription} 
                onChange={(e) => setFormDescription(e.target.value)} 
                rows={3} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-peach-500 focus:ring-peach-500 sm:text-sm"
              /> 
            </div>
            <div>
              <label htmlFor="itemDuration" className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
              <Input id="itemDuration" type="number" min="1" step="1" value={formDurationMonths} onChange={(e) => setFormDurationMonths(e.target.value)} />
            </div>
            <div>
              <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select 
                id="itemCategory" 
                value={formCategoryId} 
                onChange={(e) => setFormCategoryId(Number(e.target.value))} 
                required 
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-peach-500 focus:outline-none focus:ring-peach-500 sm:text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
                <label htmlFor="itemImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Image (Optional)
                </label>
                <Input 
                    id="itemImage"
                    type="file"
                    accept="image/png, image/jpeg, image/gif" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-peach-50 file:text-peach-700 hover:file:bg-peach-100" 
                />
                {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name}</p>
                )}
            </div>
        </div>

        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={cancelEdit} disabled={isLoading || isUploading}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isUploading} isLoading={isLoading || isUploading}>
            <Save className="w-4 h-4 mr-1" /> Save Item
          </Button>
        </div>
      </form>
    </motion.div>
  );

  // --- Add Toggle Availability Handler ---
  const handleToggleAvailability = async (itemId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    console.log(`Toggling availability for item ${itemId} to ${newStatus}`);

    // Optimistically update local state for faster UI feedback
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, is_available: newStatus } : item
      )
    );

    try {
      const { error } = await supabase
        .from('items')
        .update({ is_available: newStatus })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating availability:', error);
        // Revert optimistic update on error
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? { ...item, is_available: currentStatus } : item
          )
        );
        setError(`Failed to update availability: ${error.message}`);
      } else {
        console.log(`Successfully updated availability for item ${itemId}`);
        // Optionally re-fetch all items or just the store's items
        // fetchItems(); // Fetch updated items for the store if needed elsewhere
      }
    } catch (err: any) {
      console.error('Error in handleToggleAvailability:', err);
      // Revert optimistic update on unexpected error
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? { ...item, is_available: currentStatus } : item
          )
        );
      setError(`An unexpected error occurred: ${err.message}`);
    }
  };
  // --- End Toggle Handler ---

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Items</h2>
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
            value={selectedCategoryId || ''}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategoryId(value ? parseInt(value) : null);
            }}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button 
            onClick={startAddItem}
            icon={<PlusCircle className="w-5 h-5" />}
            disabled={!selectedCategoryId}
          >
            Add Item
          </Button>
        </div>
      </div>
      
      {error && !editingItem && !newItem && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {!selectedCategoryId && (
        <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded mb-6">
          Please select a category to manage items.
        </div>
      )}
      
      {(editingItem || newItem) && renderForm()} 
      
      {selectedCategoryId && (
        isLoading && !editingItem && !newItem ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-peach-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No items found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`hover:bg-gray-50 ${!item.is_available ? 'opacity-60 bg-gray-100' : ''}`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="checkbox"
                          checked={item.is_available}
                          onChange={() => handleToggleAvailability(item.id, item.is_available)}
                          className="h-5 w-5 text-peach-600 border-gray-300 rounded focus:ring-peach-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.duration_months || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEditItem(item)} icon={<Edit className="w-4 h-4" />}>Edit</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} icon={<Trash2 className="w-4 h-4" />} className="text-error-500 hover:text-error-700 hover:bg-error-50">Delete</Button>
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