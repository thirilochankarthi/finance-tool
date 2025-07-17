
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  type: 'stock' | 'bond' | 'crypto' | 'etf';
}

const isValidInvestmentType = (type: string): type is 'stock' | 'bond' | 'crypto' | 'etf' => {
  return ['stock', 'bond', 'crypto', 'etf'].includes(type);
};

const convertToInvestment = (row: any): Investment => {
  if (!isValidInvestmentType(row.type)) {
    console.warn(`Invalid investment type: ${row.type}, defaulting to 'stock'`);
    row.type = 'stock';
  }
  
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    quantity: Number(row.quantity),
    purchase_price: Number(row.purchase_price),
    current_price: Number(row.current_price),
    type: row.type as 'stock' | 'bond' | 'crypto' | 'etf'
  };
};

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvestments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedItems = (data || []).map(convertToInvestment);
      setInvestments(convertedItems);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([{ ...investment, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const convertedItem = convertToInvestment(data);
      setInvestments(prev => [convertedItem, ...prev]);
      toast.success('Investment added successfully');
    } catch (error) {
      console.error('Error adding investment:', error);
      toast.error('Failed to add investment');
    }
  };

  const updateInvestmentPrice = async (id: string, current_price: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('investments')
        .update({ current_price })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setInvestments(prev => prev.map(investment => 
        investment.id === id ? { ...investment, current_price } : investment
      ));
      toast.success('Investment price updated successfully');
    } catch (error) {
      console.error('Error updating investment price:', error);
      toast.error('Failed to update investment price');
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setInvestments(prev => prev.filter(investment => investment.id !== id));
      toast.success('Investment deleted successfully');
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast.error('Failed to delete investment');
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [user]);

  return {
    investments,
    loading,
    addInvestment,
    updateInvestmentPrice,
    deleteInvestment,
    refetch: fetchInvestments,
  };
};
