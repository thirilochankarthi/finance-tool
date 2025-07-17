
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CashFlowItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  recurring: boolean;
}

const isValidCashFlowType = (type: string): type is 'income' | 'expense' => {
  return type === 'income' || type === 'expense';
};

const convertToCashFlowItem = (row: any): CashFlowItem => {
  if (!isValidCashFlowType(row.type)) {
    console.warn(`Invalid cash flow type: ${row.type}, defaulting to 'expense'`);
    row.type = 'expense';
  }
  
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    date: row.date,
    type: row.type as 'income' | 'expense',
    recurring: Boolean(row.recurring)
  };
};

export const useCashFlowItems = () => {
  const [cashFlowItems, setCashFlowItems] = useState<CashFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCashFlowItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cash_flow_items')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const convertedItems = (data || []).map(convertToCashFlowItem);
      setCashFlowItems(convertedItems);
    } catch (error) {
      console.error('Error fetching cash flow items:', error);
      toast.error('Failed to load cash flow items');
    } finally {
      setLoading(false);
    }
  };

  const addCashFlowItem = async (item: Omit<CashFlowItem, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cash_flow_items')
        .insert([{ ...item, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const convertedItem = convertToCashFlowItem(data);
      setCashFlowItems(prev => [convertedItem, ...prev]);
      toast.success('Cash flow item added successfully');
    } catch (error) {
      console.error('Error adding cash flow item:', error);
      toast.error('Failed to add cash flow item');
    }
  };

  const deleteCashFlowItem = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cash_flow_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCashFlowItems(prev => prev.filter(item => item.id !== id));
      toast.success('Cash flow item deleted successfully');
    } catch (error) {
      console.error('Error deleting cash flow item:', error);
      toast.error('Failed to delete cash flow item');
    }
  };

  useEffect(() => {
    fetchCashFlowItems();
  }, [user]);

  return {
    cashFlowItems,
    loading,
    addCashFlowItem,
    deleteCashFlowItem,
    refetch: fetchCashFlowItems,
  };
};
