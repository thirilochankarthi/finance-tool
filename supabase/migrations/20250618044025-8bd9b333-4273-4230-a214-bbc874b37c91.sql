
-- Check if RLS is enabled and add policies only for tables that don't have them yet

-- For cash_flow_items table (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cash_flow_items' 
    AND policyname = 'Users can view their own cash flow items'
  ) THEN
    ALTER TABLE public.cash_flow_items ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own cash flow items" 
      ON public.cash_flow_items 
      FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own cash flow items" 
      ON public.cash_flow_items 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own cash flow items" 
      ON public.cash_flow_items 
      FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own cash flow items" 
      ON public.cash_flow_items 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- For invoices table (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' 
    AND policyname = 'Users can view their own invoices'
  ) THEN
    ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own invoices" 
      ON public.invoices 
      FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own invoices" 
      ON public.invoices 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own invoices" 
      ON public.invoices 
      FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own invoices" 
      ON public.invoices 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- For investments table (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'investments' 
    AND policyname = 'Users can view their own investments'
  ) THEN
    ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own investments" 
      ON public.investments 
      FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own investments" 
      ON public.investments 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own investments" 
      ON public.investments 
      FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own investments" 
      ON public.investments 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- For financial_data table (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'financial_data' 
    AND policyname = 'Users can view their own financial data'
  ) THEN
    ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own financial data" 
      ON public.financial_data 
      FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own financial data" 
      ON public.financial_data 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own financial data" 
      ON public.financial_data 
      FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own financial data" 
      ON public.financial_data 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;
