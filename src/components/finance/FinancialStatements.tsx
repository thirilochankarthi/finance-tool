
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, TrendingDown, DollarSign, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useFinancialData } from "@/hooks/useFinancialData";

const FinancialStatements = () => {
  const { financialData, loading, addFinancialData, deleteFinancialData } = useFinancialData();
  
  const [newData, setNewData] = useState({
    period: '',
    revenue: '',
    expenses: '',
    net_income: '',
    assets: '',
    liabilities: '',
    equity: ''
  });

  const handleAddFinancialData = async () => {
    if (newData.period && newData.revenue && newData.expenses && newData.net_income && newData.assets && newData.liabilities && newData.equity) {
      await addFinancialData({
        period: newData.period,
        revenue: parseFloat(newData.revenue),
        expenses: parseFloat(newData.expenses),
        net_income: parseFloat(newData.net_income),
        assets: parseFloat(newData.assets),
        liabilities: parseFloat(newData.liabilities),
        equity: parseFloat(newData.equity)
      });
      setNewData({
        period: '',
        revenue: '',
        expenses: '',
        net_income: '',
        assets: '',
        liabilities: '',
        equity: ''
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading financial data...</div>
      </div>
    );
  }

  const currentQuarter = financialData[0] || {
    period: 'N/A',
    revenue: 0,
    expenses: 0,
    net_income: 0,
    assets: 0,
    liabilities: 0,
    equity: 0
  };
  
  const previousQuarter = financialData[1];

  const revenueGrowth = previousQuarter ? 
    ((currentQuarter.revenue - previousQuarter.revenue) / previousQuarter.revenue * 100) : 0;

  const profitMargin = currentQuarter.revenue > 0 ? 
    (currentQuarter.net_income / currentQuarter.revenue * 100) : 0;

  const debtToEquity = currentQuarter.equity > 0 ? 
    (currentQuarter.liabilities / currentQuarter.equity) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${currentQuarter.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${currentQuarter.net_income.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${currentQuarter.assets.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Debt-to-Equity</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debtToEquity.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lower is better
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Expenses Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Income Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="net_income" stroke="#8884d8" strokeWidth={3} name="Net Income" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Financial Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                value={newData.period}
                onChange={(e) => setNewData({...newData, period: e.target.value})}
                placeholder="Q1 2024"
              />
            </div>
            <div>
              <Label htmlFor="revenue">Revenue</Label>
              <Input
                id="revenue"
                type="number"
                value={newData.revenue}
                onChange={(e) => setNewData({...newData, revenue: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="expenses">Expenses</Label>
              <Input
                id="expenses"
                type="number"
                value={newData.expenses}
                onChange={(e) => setNewData({...newData, expenses: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="net_income">Net Income</Label>
              <Input
                id="net_income"
                type="number"
                value={newData.net_income}
                onChange={(e) => setNewData({...newData, net_income: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <Label htmlFor="assets">Assets</Label>
              <Input
                id="assets"
                type="number"
                value={newData.assets}
                onChange={(e) => setNewData({...newData, assets: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="liabilities">Liabilities</Label>
              <Input
                id="liabilities"
                type="number"
                value={newData.liabilities}
                onChange={(e) => setNewData({...newData, liabilities: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="equity">Equity</Label>
              <Input
                id="equity"
                type="number"
                value={newData.equity}
                onChange={(e) => setNewData({...newData, equity: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddFinancialData} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="income" className="w-full">
        <TabsList>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
              <CardDescription>Quarterly revenue and expense breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Period</th>
                      <th className="border border-gray-300 p-2 text-right">Revenue</th>
                      <th className="border border-gray-300 p-2 text-right">Expenses</th>
                      <th className="border border-gray-300 p-2 text-right">Net Income</th>
                      <th className="border border-gray-300 p-2 text-right">Profit Margin</th>
                      <th className="border border-gray-300 p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.map((data) => (
                      <tr key={data.id}>
                        <td className="border border-gray-300 p-2">{data.period}</td>
                        <td className="border border-gray-300 p-2 text-right">${data.revenue.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">${data.expenses.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">${data.net_income.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {((data.net_income / data.revenue) * 100).toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteFinancialData(data.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {financialData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border border-gray-300 p-8 text-center text-muted-foreground">
                          No financial data yet. Add your first entry above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>Assets, liabilities, and equity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Period</th>
                      <th className="border border-gray-300 p-2 text-right">Total Assets</th>
                      <th className="border border-gray-300 p-2 text-right">Total Liabilities</th>
                      <th className="border border-gray-300 p-2 text-right">Total Equity</th>
                      <th className="border border-gray-300 p-2 text-right">Debt-to-Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialData.map((data) => (
                      <tr key={data.id}>
                        <td className="border border-gray-300 p-2">{data.period}</td>
                        <td className="border border-gray-300 p-2 text-right">${data.assets.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">${data.liabilities.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">${data.equity.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2 text-right">
                          {(data.liabilities / data.equity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Operating, investing, and financing activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Operating Activities</h3>
                  <div className="flex justify-between">
                    <span>Net Income</span>
                    <span>${currentQuarter.net_income.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depreciation</span>
                    <span>$5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Changes in Working Capital</span>
                    <span>-$2,000</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Net Operating Cash Flow</span>
                    <span>${(currentQuarter.net_income + 3000).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Investing Activities</h3>
                  <div className="flex justify-between">
                    <span>Equipment Purchases</span>
                    <span>-$10,000</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Net Investing Cash Flow</span>
                    <span>-$10,000</span>
                  </div>
                </div>

                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Financing Activities</h3>
                  <div className="flex justify-between">
                    <span>Loan Repayments</span>
                    <span>-$5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner Distributions</span>
                    <span>-$15,000</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Net Financing Cash Flow</span>
                    <span>-$20,000</span>
                  </div>
                </div>

                <div className="p-4 border rounded bg-blue-50">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Change in Cash</span>
                    <span>${(currentQuarter.net_income + 3000 - 10000 - 20000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialStatements;
