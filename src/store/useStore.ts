import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Category {
  id: number;
  name: string;
  description: string | null;
  slug: string;
}

interface Item {
  id: number;
  name: string;
  price: number;
  description: string | null;
  duration_months: number | null;
  category_id: number;
  images: { url: string }[] | null;
  is_available: boolean;
}

interface Image {
  id: number;
  url: string;
  item_id: number | null;
  category_id: number | null;
  type: string;
}

interface Proof {
  id: number;
  created_at: string;
  image_url: string;
  proof_date: string | null;
}

interface PricingTier {
  id: number;
  item_id: number;
  duration_months: number;
  price: number;
}

interface Service {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category: string | null;
  image_url?: string | null;
}

interface StoreState {
  categories: Category[];
  items: Item[];
  images: Image[];
  proofs: Proof[];
  services: Service[];
  isLoading: boolean;
  error: string | null;
  
  // Category actions
  fetchCategories: () => Promise<void>;
  getCategory: (slug: string) => Category | undefined;
  
  // Item actions
  fetchItems: (categoryId?: number) => Promise<void>;
  getItemsByCategory: (categoryId: number) => Item[];
  
  // Image actions
  fetchImages: (type?: string, itemId?: number, categoryId?: number) => Promise<void>;
  getImagesByItem: (itemId: number) => Image[];
  getImagesByCategory: (categoryId: number, type?: string) => Image[];
  
  // Proof actions
  fetchProofs: () => Promise<void>;
  
  // Pricing Tier actions
  fetchPricingTiers: (itemId: number) => Promise<PricingTier[]>;
  
  // Service actions
  fetchServices: (categoryId?: number) => Promise<void>;
  getServicesByCategory: (categoryId: number) => Service[];
}

export const useStore = create<StoreState>((set, get) => ({
  categories: [],
  items: [],
  images: [],
  proofs: [],
  services: [],
  isLoading: false,
  error: null,
  
  // Category actions
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      set({ categories: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  getCategory: (slug: string) => {
    return get().categories.find(category => category.slug === slug);
  },
  
  // Item actions
  fetchItems: async (categoryId?: number) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          images ( url )
        `);
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      set({ items: (data as Item[]) || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error("Error fetching items:", error);
    }
  },
  
  getItemsByCategory: (categoryId: number) => {
    return get().items.filter(item => item.category_id === categoryId);
  },
  
  // Image actions
  fetchImages: async (type?: string, itemId?: number, categoryId?: number) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('images')
        .select('*');
      
      if (type) {
        query = query.eq('type', type);
      }
      
      if (itemId) {
        query = query.eq('item_id', itemId);
      }
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      set({ images: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  getImagesByItem: (itemId: number) => {
    return get().images.filter(image => image.item_id === itemId);
  },
  
  getImagesByCategory: (categoryId: number, type?: string) => {
    let images = get().images.filter(image => image.category_id === categoryId);
    if (type) {
      images = images.filter(image => image.type === type);
    }
    return images;
  },
  
  // Proof actions
  fetchProofs: async () => {
    console.log('useStore: Fetching proofs...');
    try {
      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log(`useStore: Fetched ${data?.length || 0} proofs.`);
      set({ proofs: data || [] });
    } catch (error: any) {
      console.error('useStore: Error fetching proofs:', error);
      set({ error: `Failed to fetch proofs: ${error.message}` });
    } finally {
    }
  },
  
  // Pricing Tier actions
  fetchPricingTiers: async (itemId: number) => {
    console.log(`useStore: Fetching pricing tiers for item ${itemId}...`);
    try {
      const { data, error } = await supabase
        .from('item_pricing_tiers')
        .select('*')
        .eq('item_id', itemId)
        .order('duration_months', { ascending: true });

      if (error) throw error;
      console.log(`useStore: Fetched ${data?.length || 0} tiers for item ${itemId}.`);
      return data || [];
    } catch (error: any) {
      console.error(`useStore: Error fetching pricing tiers for item ${itemId}:`, error);
      throw new Error(`Failed to fetch pricing tiers: ${error.message}`);
    }
  },
  
  // Service actions
  fetchServices: async (categoryId?: number) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      set({ services: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  getServicesByCategory: (categoryId: number) => {
    return get().services.filter(service => service.category_id === categoryId);
  },
}));