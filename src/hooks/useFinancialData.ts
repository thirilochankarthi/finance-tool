
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialData {
  id: string;
  period: string;
  revenue: number;
  expenses: number;
  net_income: number;
  assets: number;
  liabilities: number;
  equity: number;
}

const convertToFinancialData = (row: any): FinancialData => {
  return {
    id: row.id,
    period: row.period,
    revenue: Number(row.revenue),
    expenses: Number(row.expenses),
    net_income: Number(row.net_income),
    assets: Number(row.assets),
    liabilities: Number(row.liabilities),
    equity: Number(row.equity)
  };
};

export const useFinancialData = () => {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', user.id)
        .order('period', { ascending: false });

      if (error) throw error;

      const convertedItems = (data || []).map(convertToFinancialData);
      setFinancialData(convertedItems);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const addFinancialData = async (data: Omit<FinancialData, 'id'>) => {
    if (!user) return;

    try {
      const { data: insertedData, error } = await supabase
        .from('financial_data')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const convertedItem = convertToFinancialData(insertedData);
      setFinancialData(prev => [convertedItem, ...prev]);
      toast.success('Financial data added successfully');
    } catch (error) {
      console.error('Error adding financial data:', error);
      toast.error('Failed to add financial data');
    }
  };

  const deleteFinancialData = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('financial_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setFinancialData(prev => prev.filter(item => item.id !== id));
      toast.success('Financial data deleted successfully');
    } catch (error) {
      console.error('Error deleting financial data:', error);
      toast.error('Failed to delete financial data');
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [user]);

  return {
    financialData,
    loading,
    addFinancialData,
    deleteFinancialData,
    refetch: fetchFinancialData,
  };
};
