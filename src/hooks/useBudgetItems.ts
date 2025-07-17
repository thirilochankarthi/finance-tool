
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BudgetItem {
  id: string;
  category: string;
  budgeted: number;
  actual: number;
  type: 'income' | 'expense';
}

// Type guard to ensure the type is valid
const isValidBudgetItemType = (type: string): type is 'income' | 'expense' => {
  return type === 'income' || type === 'expense';
};

// Helper function to convert database row to BudgetItem
const convertToBudgetItem = (row: any): BudgetItem => {
  if (!isValidBudgetItemType(row.type)) {
    console.warn(`Invalid budget item type: ${row.type}, defaulting to 'expense'`);
    row.type = 'expense';
  }
  
  return {
    id: row.id,
    category: row.category,
    budgeted: Number(row.budgeted),
    actual: Number(row.actual),
    type: row.type as 'income' | 'expense'
  };
};

export const useBudgetItems = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBudgetItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedItems = (data || []).map(convertToBudgetItem);
      setBudgetItems(convertedItems);
    } catch (error) {
      console.error('Error fetching budget items:', error);
      toast.error('Failed to load budget items');
    } finally {
      setLoading(false);
    }
  };

  const addBudgetItem = async (item: Omit<BudgetItem, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budget_items')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const convertedItem = convertToBudgetItem(data);
      setBudgetItems(prev => [convertedItem, ...prev]);
      toast.success('Budget item added successfully');
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('Failed to add budget item');
    }
  };

  const deleteBudgetItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBudgetItems(prev => prev.filter(item => item.id !== id));
      toast.success('Budget item deleted successfully');
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to delete budget item');
    }
  };

  useEffect(() => {
    fetchBudgetItems();
  }, [user]);

  return {
    budgetItems,
    loading,
    addBudgetItem,
    deleteBudgetItem,
    refetch: fetchBudgetItems,
  };
};
