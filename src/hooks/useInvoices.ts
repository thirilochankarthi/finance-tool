
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  description?: string;
  created_date: string;
}

const isValidInvoiceStatus = (status: string): status is 'draft' | 'sent' | 'paid' | 'overdue' => {
  return ['draft', 'sent', 'paid', 'overdue'].includes(status);
};

const convertToInvoice = (row: any): Invoice => {
  if (!isValidInvoiceStatus(row.status)) {
    console.warn(`Invalid invoice status: ${row.status}, defaulting to 'draft'`);
    row.status = 'draft';
  }
  
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    client_name: row.client_name,
    amount: Number(row.amount),
    due_date: row.due_date,
    status: row.status as 'draft' | 'sent' | 'paid' | 'overdue',
    description: row.description,
    created_date: row.created_date
  };
};

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_date', { ascending: false });

      if (error) throw error;

      const convertedItems = (data || []).map(convertToInvoice);
      setInvoices(convertedItems);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'created_date'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...invoice, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      const convertedItem = convertToInvoice(data);
      setInvoices(prev => [convertedItem, ...prev]);
      toast.success('Invoice added successfully');
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast.error('Failed to add invoice');
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setInvoices(prev => prev.map(invoice => 
        invoice.id === id ? { ...invoice, status } : invoice
      ));
      toast.success('Invoice status updated successfully');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    refetch: fetchInvoices,
  };
};
