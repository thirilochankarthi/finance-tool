
-- Create tables for all finance dashboard components

-- Budget items table
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category TEXT NOT NULL,
  budgeted DECIMAL(12,2) NOT NULL,
  actual DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cash flow items table
CREATE TABLE public.cash_flow_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  description TEXT,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(12,6) NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL,
  current_price DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stock', 'bond', 'crypto', 'etf')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial data table for statements
CREATE TABLE public.financial_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  period TEXT NOT NULL,
  revenue DECIMAL(12,2) NOT NULL,
  expenses DECIMAL(12,2) NOT NULL,
  net_income DECIMAL(12,2) NOT NULL,
  assets DECIMAL(12,2) NOT NULL,
  liabilities DECIMAL(12,2) NOT NULL,
  equity DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budget_items
CREATE POLICY "Users can view their own budget items" ON public.budget_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budget items" ON public.budget_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget items" ON public.budget_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget items" ON public.budget_items FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cash_flow_items
CREATE POLICY "Users can view their own cash flow items" ON public.cash_flow_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cash flow items" ON public.cash_flow_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cash flow items" ON public.cash_flow_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cash flow items" ON public.cash_flow_items FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for investments
CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for financial_data
CREATE POLICY "Users can view their own financial data" ON public.financial_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own financial data" ON public.financial_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financial data" ON public.financial_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own financial data" ON public.financial_data FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_budget_items_user_id ON public.budget_items(user_id);
CREATE INDEX idx_cash_flow_items_user_id ON public.cash_flow_items(user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_financial_data_user_id ON public.financial_data(user_id);

-- Create unique constraint for invoice numbers per user
CREATE UNIQUE INDEX idx_invoices_user_invoice_number ON public.invoices(user_id, invoice_number);

-- Create unique constraint for financial data period per user
CREATE UNIQUE INDEX idx_financial_data_user_period ON public.financial_data(user_id, period);
