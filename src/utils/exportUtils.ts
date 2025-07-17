
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { BudgetItem } from '@/hooks/useBudgetItems';
import { CashFlowItem } from '@/hooks/useCashFlowItems';
import { Invoice } from '@/hooks/useInvoices';
import { Investment } from '@/hooks/useInvestments';
import { FinancialData } from '@/hooks/useFinancialData';

export const exportToPDF = (data: any[], title: string, headers: string[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  let yPosition = 40;
  const lineHeight = 10;
  
  // Add headers
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  headers.forEach((header, index) => {
    doc.text(header, 20 + (index * 40), yPosition);
  });
  
  yPosition += lineHeight;
  doc.setFont('helvetica', 'normal');
  
  // Add data rows
  data.forEach((item) => {
    if (yPosition > 270) { // Start new page if needed
      doc.addPage();
      yPosition = 20;
    }
    
    Object.values(item).forEach((value: any, index) => {
      const displayValue = typeof value === 'number' ? value.toFixed(2) : String(value);
      doc.text(displayValue, 20 + (index * 40), yPosition);
    });
    
    yPosition += lineHeight;
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportBudgetToPDF = (budgetItems: BudgetItem[]) => {
  const headers = ['Category', 'Type', 'Budgeted', 'Actual', 'Variance'];
  const data = budgetItems.map(item => ({
    category: item.category,
    type: item.type,
    budgeted: item.budgeted,
    actual: item.actual,
    variance: item.actual - item.budgeted
  }));
  
  exportToPDF(data, 'Budget Report', headers);
};

export const exportBudgetToExcel = (budgetItems: BudgetItem[]) => {
  const data = budgetItems.map(item => ({
    Category: item.category,
    Type: item.type,
    Budgeted: item.budgeted,
    Actual: item.actual,
    Variance: item.actual - item.budgeted
  }));
  
  exportToExcel(data, 'budget_report');
};

export const exportCashFlowToPDF = (cashFlowItems: CashFlowItem[]) => {
  const headers = ['Date', 'Description', 'Type', 'Amount', 'Recurring'];
  const data = cashFlowItems.map(item => ({
    date: item.date,
    description: item.description,
    type: item.type,
    amount: item.amount,
    recurring: item.recurring ? 'Yes' : 'No'
  }));
  
  exportToPDF(data, 'Cash Flow Report', headers);
};

export const exportCashFlowToExcel = (cashFlowItems: CashFlowItem[]) => {
  const data = cashFlowItems.map(item => ({
    Date: item.date,
    Description: item.description,
    Type: item.type,
    Amount: item.amount,
    Recurring: item.recurring ? 'Yes' : 'No'
  }));
  
  exportToExcel(data, 'cash_flow_report');
};

export const exportInvoicesToPDF = (invoices: Invoice[]) => {
  const headers = ['Invoice #', 'Client', 'Amount', 'Due Date', 'Status'];
  const data = invoices.map(invoice => ({
    invoice_number: invoice.invoice_number,
    client_name: invoice.client_name,
    amount: invoice.amount,
    due_date: invoice.due_date,
    status: invoice.status
  }));
  
  exportToPDF(data, 'Invoices Report', headers);
};

export const exportInvoicesToExcel = (invoices: Invoice[]) => {
  const data = invoices.map(invoice => ({
    'Invoice Number': invoice.invoice_number,
    'Client Name': invoice.client_name,
    Amount: invoice.amount,
    'Due Date': invoice.due_date,
    Status: invoice.status,
    Description: invoice.description || ''
  }));
  
  exportToExcel(data, 'invoices_report');
};

export const exportInvestmentsToPDF = (investments: Investment[]) => {
  const headers = ['Symbol', 'Name', 'Quantity', 'Purchase Price', 'Current Price', 'P&L'];
  const data = investments.map(investment => ({
    symbol: investment.symbol,
    name: investment.name,
    quantity: investment.quantity,
    purchase_price: investment.purchase_price,
    current_price: investment.current_price,
    pnl: (investment.current_price - investment.purchase_price) * investment.quantity
  }));
  
  exportToPDF(data, 'Investment Portfolio Report', headers);
};

export const exportInvestmentsToExcel = (investments: Investment[]) => {
  const data = investments.map(investment => ({
    Symbol: investment.symbol,
    Name: investment.name,
    Type: investment.type,
    Quantity: investment.quantity,
    'Purchase Price': investment.purchase_price,
    'Current Price': investment.current_price,
    'Total Value': investment.current_price * investment.quantity,
    'P&L': (investment.current_price - investment.purchase_price) * investment.quantity
  }));
  
  exportToExcel(data, 'investment_portfolio');
};

export const exportFinancialDataToPDF = (financialData: FinancialData[]) => {
  const headers = ['Period', 'Revenue', 'Expenses', 'Net Income', 'Assets', 'Liabilities', 'Equity'];
  const data = financialData.map(item => ({
    period: item.period,
    revenue: item.revenue,
    expenses: item.expenses,
    net_income: item.net_income,
    assets: item.assets,
    liabilities: item.liabilities,
    equity: item.equity
  }));
  
  exportToPDF(data, 'Financial Statements', headers);
};

export const exportFinancialDataToExcel = (financialData: FinancialData[]) => {
  const data = financialData.map(item => ({
    Period: item.period,
    Revenue: item.revenue,
    Expenses: item.expenses,
    'Net Income': item.net_income,
    Assets: item.assets,
    Liabilities: item.liabilities,
    Equity: item.equity
  }));
  
  exportToExcel(data, 'financial_statements');
};
