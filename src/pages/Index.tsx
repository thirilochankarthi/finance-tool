import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetTracker from "@/components/finance/BudgetTracker";
import InvoiceBilling from "@/components/finance/InvoiceBilling";
import CashFlowForecasting from "@/components/finance/CashFlowForecasting";
import InvestmentPortfolio from "@/components/finance/InvestmentPortfolio";
import LoanCalculator from "@/components/finance/LoanCalculator";
import FinancialStatements from "@/components/finance/FinancialStatements";
import AgenticControl from "@/components/finance/AgenticControl";
import Navbar from "@/components/layout/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
          <p className="text-gray-600">Manage your personal finances with comprehensive tools and insights</p>
        </div>

        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="statements">Statements</TabsTrigger>
            <TabsTrigger value="agentic">AgenticControl</TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="mt-6">
            <BudgetTracker />
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <InvoiceBilling />
          </TabsContent>

          <TabsContent value="cashflow" className="mt-6">
            <CashFlowForecasting />
          </TabsContent>

          <TabsContent value="investments" className="mt-6">
            <InvestmentPortfolio />
          </TabsContent>

          <TabsContent value="loans" className="mt-6">
            <LoanCalculator />
          </TabsContent>

          <TabsContent value="statements" className="mt-6">
            <FinancialStatements />
          </TabsContent>

          <TabsContent value="agentic" className="mt-6">
            <AgenticControl />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
