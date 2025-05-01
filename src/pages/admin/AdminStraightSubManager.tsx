import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select'; // Re-using standard select
import { Trash2, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

// Interface for items (just need id/name for dropdown)
interface ItemForSelect {
  id: number;
  name: string;
}

// Interface for the new pricing tier table
interface PricingTier {
  id: number;
  item_id: number;
  duration_months: number;
  price: number;
}

export const AdminStraightSubManager: React.FC = () => {
  const { fetchItems, items: storeItems } = useStore((state) => ({ 
      fetchItems: state.fetchItems, 
      items: state.items 
  })); // Get items from store

  const [allItems, setAllItems] = useState<ItemForSelect[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding a new tier
  const [newDuration, setNewDuration] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Fetch all items for the dropdown on mount
  useEffect(() => {
    const loadAllItems = async () => {
      setIsLoadingItems(true);
      setError(null);
      try {
        // Fetch items without category filter from store if possible,
        // otherwise query directly
        if (storeItems.length === 0) {
          await fetchItems(); // Trigger fetch if store is empty
        } 
        // Use items from the store after fetch is potentially called
        // Need to access the updated state after async fetch
        const currentItems = useStore.getState().items;
        setAllItems(currentItems.map(item => ({ id: item.id, name: item.name })));

      } catch (err: any) {
        setError('Failed to load items list.');
        console.error("Error loading items:", err);
      } finally {
        setIsLoadingItems(false);
      }
    };
    loadAllItems();
  }, [fetchItems]); // Rerun if fetchItems changes (though it likely won't)

  // Fetch pricing tiers when an item is selected
  useEffect(() => {
    if (selectedItemId) {
      loadPricingTiers(selectedItemId);
    } else {
      setPricingTiers([]); // Clear tiers if no item selected
    }
  }, [selectedItemId]);

  const loadPricingTiers = async (itemId: number) => {
    setIsLoadingTiers(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('item_pricing_tiers')
        .select('*')
        .eq('item_id', itemId)
        .order('duration_months', { ascending: true });

      if (fetchError) throw fetchError;
      setPricingTiers(data || []);
    } catch (err: any) {
      setError(`Failed to load pricing tiers for item ${itemId}.`);
      console.error("Error loading pricing tiers:", err);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  const handleAddTier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItemId || !newDuration || !newPrice) {
      setError('Please select an item and enter duration and price.');
      return;
    }

    const duration = parseInt(newDuration);
    const price = parseFloat(newPrice);

    if (isNaN(duration) || duration <= 0) {
      setError('Duration must be a positive whole number.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setError('Price must be a valid positive number.');
      return;
    }

    setError(null);
    setIsLoadingTiers(true); // Use tier loading state for this action

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('item_pricing_tiers')
        .insert({ 
            item_id: selectedItemId, 
            duration_months: duration, 
            price: price 
        })
        .select()
        .single(); // Select the newly inserted row

      if (insertError) throw insertError;

      if (insertedData) {
        // Add optimistically or reload
        setPricingTiers(prev => [...prev, insertedData].sort((a,b) => a.duration_months - b.duration_months));
        setNewDuration('');
        setNewPrice('');
      } else {
          throw new Error("Insert succeeded but no data returned.")
      }

    } catch (err: any) {
      setError(`Failed to add pricing tier: ${err.message}`);
      console.error("Error adding tier:", err);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  const handleDeleteTier = async (tierId: number) => {
    if (!window.confirm('Are you sure you want to delete this pricing tier?')) {
      return;
    }

    setError(null);
    setIsLoadingTiers(true);

    try {
      const { error: deleteError } = await supabase
        .from('item_pricing_tiers')
        .delete()
        .eq('id', tierId);

      if (deleteError) throw deleteError;

      // Remove optimistically
      setPricingTiers(prev => prev.filter(tier => tier.id !== tierId));

    } catch (err: any) {
      setError(`Failed to delete pricing tier: ${err.message}`);
      console.error("Error deleting tier:", err);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Item Pricing Tiers ("StraightSub")</h2>
      
      {/* Item Selector */}
      <div className="mb-6">
        <label htmlFor="itemSelector" className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
        <select 
          id="itemSelector" 
          value={selectedItemId} 
          onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')} 
          disabled={isLoadingItems}
          className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-pink-500 focus:outline-none focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
        >
          <option value="">-- Select Premium Account --</option>
          {allItems.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        {isLoadingItems && <p className="text-sm text-gray-500 mt-1">Loading items...</p>}
      </div>

      {selectedItemId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Tier Form */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white p-6 rounded-lg shadow border border-pink-200"
          >
            <h3 className="text-lg font-semibold mb-4 text-pink-700">Add New Pricing Tier</h3>
            <form onSubmit={handleAddTier} className="space-y-4">
              <div>
                  <label htmlFor="newDuration" className="block text-sm font-medium text-gray-700 mb-1">Duration (Months) *</label>
                  <Input 
                    id="newDuration"
                    type="number" 
                    min="1" 
                    step="1" 
                    value={newDuration} 
                    onChange={e => setNewDuration(e.target.value)} 
                    required 
                    placeholder="e.g., 3"
                  />
              </div>
              <div>
                  <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <Input 
                    id="newPrice"
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value)} 
                    required 
                    placeholder="e.g., 450.00"
                  />
              </div>
              {error && <p className="text-sm text-red-600">Error: {error}</p>} 
              <div className="flex justify-end">
                  <Button type="submit" disabled={isLoadingTiers} isLoading={isLoadingTiers}>
                      <PlusCircle className="w-4 h-4 mr-2"/> Add Tier
                  </Button>
              </div>
            </form>
          </motion.div>

          {/* Existing Tiers List */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Existing Tiers</h3>
            {isLoadingTiers ? (
              <p className="text-gray-500">Loading tiers...</p>
            ) : pricingTiers.length === 0 ? (
              <p className="text-gray-500">No pricing tiers defined for this item yet.</p>
            ) : (
              <ul className="space-y-3">
                {pricingTiers.map(tier => (
                  <motion.li 
                    key={tier.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center bg-white p-3 rounded shadow-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-800">{tier.duration_months} Month{tier.duration_months > 1 ? 's' : ''}</span>
                      <span className="text-gray-500"> - </span>
                      <span className="text-pink-600 font-semibold">${tier.price.toFixed(2)}</span>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100 h-8 w-8"
                      onClick={() => handleDeleteTier(tier.id)}
                      disabled={isLoadingTiers}
                      title="Delete Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
}; 