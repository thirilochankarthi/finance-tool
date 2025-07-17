
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, DollarSign, Calendar, Plus, Trash2 } from "lucide-react";
import { useCashFlowItems } from "@/hooks/useCashFlowItems";

const CashFlowForecasting = () => {
  const { cashFlowItems, loading, addCashFlowItem, deleteCashFlowItem } = useCashFlowItems();
  
  const [newItem, setNewItem] = useState({
    description: '',
    amount: '',
    date: '',
    type: 'income' as 'income' | 'expense',
    recurring: false
  });

  const [forecastMonths, setForecastMonths] = useState(6);

  const handleAddCashFlowItem = async () => {
    if (newItem.description && newItem.amount && newItem.date) {
      await addCashFlowItem({
        description: newItem.description,
        amount: parseFloat(newItem.amount),
        date: newItem.date,
        type: newItem.type,
        recurring: newItem.recurring
      });
      setNewItem({ description: '', amount: '', date: '', type: 'income', recurring: false });
    }
  };

  const generateForecast = () => {
    const forecast = [];
    const currentDate = new Date();
    let runningBalance = 10000; // Starting balance

    for (let i = 0; i < forecastMonths; i++) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      let monthlyIncome = 0;
      let monthlyExpenses = 0;

      cashFlowItems.forEach(item => {
        if (item.recurring || new Date(item.date).getMonth() === month.getMonth()) {
          if (item.type === 'income') {
            monthlyIncome += Math.abs(item.amount);
          } else {
            monthlyExpenses += Math.abs(item.amount);
          }
        }
      });

      const netCashFlow = monthlyIncome - monthlyExpenses;
      runningBalance += netCashFlow;

      forecast.push({
        month: monthName,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        netCashFlow,
        balance: runningBalance
      });
    }

    return forecast;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading cash flow data...</div>
      </div>
    );
  }

  const forecastData = generateForecast();
  const currentBalance = forecastData[0]?.balance || 10000;
  const projectedBalance = forecastData[forecastData.length - 1]?.balance || 0;
  const totalIncome = forecastData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = forecastData.reduce((sum, item) => sum + item.expenses, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${projectedBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Forecast</CardTitle>
            <CardDescription>Monthly cash flow projection for the next {forecastMonths} months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={2} name="Balance" />
                <Line type="monotone" dataKey="netCashFlow" stroke="#82ca9d" strokeWidth={2} name="Net Cash Flow" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly breakdown of income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Income" />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ffc658" fill="#ffc658" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <Label htmlFor="months">Forecast Period (months)</Label>
              <Select value={forecastMonths.toString()} onValueChange={(value) => setForecastMonths(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Cash Flow Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Enter description"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newItem.type} onValueChange={(value: 'income' | 'expense') => setNewItem({...newItem, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={newItem.amount}
                onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newItem.date}
                onChange={(e) => setNewItem({...newItem, date: e.target.value})}
              />
            </div>
            <div>
              <Label>Recurring</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="recurring"
                  checked={newItem.recurring}
                  onCheckedChange={(checked) => setNewItem({...newItem, recurring: checked as boolean})}
                />
                <label htmlFor="recurring" className="text-sm">Monthly recurring</label>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCashFlowItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cashFlowItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.type === 'income' ? 'Income' : 'Expense'} • {new Date(item.date).toLocaleDateString()}
                    {item.recurring && ' • Recurring'}
                  </div>
                </div>
                <div className="text-right mr-4">
                  <div className={`text-lg font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCashFlowItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {cashFlowItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No cash flow items yet. Add your first item above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowForecasting;
