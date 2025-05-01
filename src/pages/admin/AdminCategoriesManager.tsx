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
  description: string | null;
  slug: string;
}

export const AdminCategoriesManager: React.FC = () => {
  const { fetchCategories } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category> | null>(null);

  // Form fields for the editing category
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSlug, setFormSlug] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startAddCategory = () => {
    setEditingCategory(null);
    setNewCategory({
      name: '',
      description: '',
      slug: ''
    });
    setFormName('');
    setFormDescription('');
    setFormSlug('');
  };

  const startEditCategory = (category: Category) => {
    setNewCategory(null);
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormSlug(category.slug);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCategory(null);
  };

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormName(name);
    if (!editingCategory || formSlug === editingCategory.slug) {
      setFormSlug(createSlug(name));
    }
  };

  const saveCategory = async () => {
    if (!formName || !formSlug) {
      setError('Name and slug are required');
      return;
    }
    
    const categoryData = {
      name: formName,
      description: formDescription || null,
      slug: formSlug
    };
    
    try {
      setIsLoading(true);
      
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
          
        if (error) throw error;
      } else if (newCategory) {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
          
        if (error) throw error;
      }
      
      // Refresh the list
      loadCategories();
      fetchCategories();
      
      // Reset form
      setEditingCategory(null);
      setNewCategory(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all items in this category.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      loadCategories();
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Categories</h2>
        <Button 
          onClick={startAddCategory}
          icon={<PlusCircle className="w-5 h-5" />}
        >
          Add Category
        </Button>
      </div>
      
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {(editingCategory || newCategory) && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          
          <div className="space-y-4">
            <Input
              label="Name"
              value={formName}
              onChange={handleNameChange}
              placeholder="Category name"
              fullWidth
            />
            
            <Input
              label="Slug"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder="category-slug"
              helperText="Used in URLs, must be unique and contain only letters, numbers, and hyphens"
              fullWidth
            />
            
            <Input
              label="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description"
              fullWidth
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={cancelEdit}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                onClick={saveCategory}
                isLoading={isLoading}
                icon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && !editingCategory && !newCategory ? (
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
                  Slug
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
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No categories found. Add your first category to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <motion.tr 
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditCategory(category)}
                          icon={<Edit className="w-4 h-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategory(category.id)}
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
      )}
    </div>
  );
};