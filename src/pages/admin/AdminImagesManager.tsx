import React, { useState, useEffect } from 'react';
import { Upload, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';

interface Category {
  id: number;
  name: string;
}

interface Image {
  id: number;
  url: string;
  item_id: number | null;
  category_id: number | null;
  type: string;
}

export const AdminImagesManager: React.FC = () => {
  const { 
    fetchImages, 
    getImagesByCategory
  } = useStore();
  const [images, setImages] = useState<Image[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('proofs');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId && selectedType) {
      loadImages(selectedType, selectedCategoryId);
    } else {
      setImages([]);
    }
  }, [selectedCategoryId, selectedType]);

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

  const loadImages = async (type: string, categoryId: number) => {
    setIsLoading(true);
    setError(null);
    setImages([]);
    
    try {
      await fetchImages(type, undefined, categoryId);
      setImages(getImagesByCategory(categoryId, type));
    } catch (err: any) {
      setError(err.message);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedCategoryId) {
      setError('Please select a category before uploading.');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const files = Array.from(e.target.files);
      let completedUploads = 0;
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${selectedType}/${selectedCategoryId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        
        const { error: insertError } = await supabase.from('images').insert({
          url: data.publicUrl,
          category_id: selectedCategoryId,
          type: selectedType,
          item_id: null
        });
        
        if (insertError) throw insertError;
        
        completedUploads++;
        setUploadProgress(Math.round((completedUploads / files.length) * 100));
      }
      
      await loadImages(selectedType, selectedCategoryId);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const deleteImage = async (image: Image) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const url = new URL(image.url);
      const bucketName = 'images';
      const pathPrefix = `/storage/v1/object/public/${bucketName}/`;
      let filePath = '';
      
      if (url.pathname.startsWith(pathPrefix)) {
          filePath = url.pathname.substring(pathPrefix.length);
      } else {
          console.warn("Could not determine file path from URL structure:", image.url);
      }

      if (filePath) {
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);
            
          if (storageError) { 
              console.error("Storage deletion error:", storageError);
              setError(`Storage deletion failed: ${storageError.message}. Attempting to delete database record.`);
          }
      }
      
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);
        
      if (dbError) throw dbError;
      
      if (selectedCategoryId && selectedType) {
        await loadImages(selectedType, selectedCategoryId);
      }
    } catch (err: any) {
      setError(`Deletion failed: ${err.message}`);
      console.error("Deletion error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Images</h2>
        
        <div className="flex flex-wrap gap-2">
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
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-peach-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!selectedCategoryId}
          >
            <option value="proofs">Proofs</option>
            <option value="projects">Projects</option>
          </select>
          
          <label className={`relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-peach-600 hover:bg-peach-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-peach-500 cursor-pointer ${(!selectedCategoryId || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleFileChange} 
              disabled={!selectedCategoryId || uploading}
              accept="image/*"
            />
          </label>
        </div>
      </div>
      
      {uploading && (
        <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-peach-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {!selectedCategoryId && (
        <div className="bg-accent-50 border border-accent-200 text-accent-700 px-4 py-3 rounded mb-6">
          Please select a category to manage images.
        </div>
      )}
      
      {selectedCategoryId && (
        isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-peach-500"></div>
          </div>
        ) : (
          images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No images found for the selected category and type.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <motion.div 
                  key={image.id}
                  className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={image.url}
                    alt={`Image ${image.id}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteImage(image)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )
      )}
    </div>
  );
};