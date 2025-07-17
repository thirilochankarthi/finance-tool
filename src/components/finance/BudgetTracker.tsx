import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp, TrendingDown, Download, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { exportBudgetToPDF, exportBudgetToExcel } from "@/utils/exportUtils";

const BudgetTracker = () => {
  const { budgetItems, loading, addBudgetItem, deleteBudgetItem } = useBudgetItems();
  
  const [newItem, setNewItem] = useState({
    category: '',
    budgeted: '',
    actual: '',
    type: 'expense' as 'income' | 'expense'
  });

  const [chartType, setChartType] = useState<'income' | 'expense'>('expense');

  const handleAddBudgetItem = async () => {
    if (newItem.category && newItem.budgeted && newItem.actual) {
      await addBudgetItem({
        category: newItem.category,
        budgeted: parseFloat(newItem.budgeted),
        actual: parseFloat(newItem.actual),
        type: newItem.type
      });
      setNewItem({ category: '', budgeted: '', actual: '', type: 'expense' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading budget data...</div>
      </div>
    );
  }

  const totalBudgetedIncome = budgetItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.budgeted, 0);
  const totalActualIncome = budgetItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.actual, 0);
  const totalBudgetedExpenses = budgetItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.budgeted, 0);
  const totalActualExpenses = budgetItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.actual, 0);

  const chartData = budgetItems.map(item => ({
    name: item.category,
    budgeted: item.budgeted,
    actual: item.actual,
    variance: item.actual - item.budgeted
  }));

  const pieData = budgetItems.filter(item => item.type === chartType).map(item => ({
    name: item.category,
    value: item.actual
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Export Budget Data</CardTitle>
          <CardDescription>Download your budget data in PDF or Excel format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => exportBudgetToPDF(budgetItems)}
              disabled={budgetItems.length === 0}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              onClick={() => exportBudgetToExcel(budgetItems)}
              disabled={budgetItems.length === 0}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budgeted Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalBudgetedIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalActualIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budgeted Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalBudgetedExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalActualExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Distribution Chart</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'income' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('income')}
                >
                  Income
                </Button>
                <Button
                  variant={chartType === 'expense' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('expense')}
                >
                  Expense
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No {chartType} data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Budget Item Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Budget Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                placeholder="Enter category"
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
              <Label htmlFor="budgeted">Budgeted</Label>
              <Input
                id="budgeted"
                type="number"
                value={newItem.budgeted}
                onChange={(e) => setNewItem({...newItem, budgeted: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="actual">Actual</Label>
              <Input
                id="actual"
                type="number"
                value={newItem.actual}
                onChange={(e) => setNewItem({...newItem, actual: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddBudgetItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {budgetItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.type === 'income' ? 'Income' : 'Expense'}
                  </div>
                </div>
                <div className="text-right mr-4">
                  <div>Budgeted: ${item.budgeted.toFixed(2)}</div>
                  <div>Actual: ${item.actual.toFixed(2)}</div>
                  <div className={`text-sm ${item.actual > item.budgeted ? 'text-red-600' : 'text-green-600'}`}>
                    Variance: {item.actual > item.budgeted ? '+' : ''}{(item.actual - item.budgeted).toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteBudgetItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {budgetItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No budget items yet. Add your first budget item above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTracker;
