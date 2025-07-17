
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, Plus, Trash2 } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";

const InvestmentPortfolio = () => {
  const { investments, loading, addInvestment, updateInvestmentPrice, deleteInvestment } = useInvestments();
  
  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    name: '',
    quantity: '',
    purchase_price: '',
    current_price: '',
    type: 'stock' as 'stock' | 'bond' | 'crypto' | 'etf'
  });

  const handleAddInvestment = async () => {
    if (newInvestment.symbol && newInvestment.name && newInvestment.quantity && newInvestment.purchase_price && newInvestment.current_price) {
      await addInvestment({
        symbol: newInvestment.symbol.toUpperCase(),
        name: newInvestment.name,
        quantity: parseFloat(newInvestment.quantity),
        purchase_price: parseFloat(newInvestment.purchase_price),
        current_price: parseFloat(newInvestment.current_price),
        type: newInvestment.type
      });
      setNewInvestment({ symbol: '', name: '', quantity: '', purchase_price: '', current_price: '', type: 'stock' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading investment data...</div>
      </div>
    );
  }

  const totalValue = investments.reduce((sum, inv) => sum + (inv.current_price * inv.quantity), 0);
  const totalCost = investments.reduce((sum, inv) => sum + (inv.purchase_price * inv.quantity), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const portfolioData = investments.map(inv => ({
    name: inv.symbol,
    value: inv.current_price * inv.quantity,
    gainLoss: (inv.current_price - inv.purchase_price) * inv.quantity,
    gainLossPercent: ((inv.current_price - inv.purchase_price) / inv.purchase_price) * 100
  }));

  const typeDistribution = investments.reduce((acc, inv) => {
    const value = inv.current_price * inv.quantity;
    acc[inv.type] = (acc[inv.type] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([type, value]) => ({
    name: type.toUpperCase(),
    value
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Mock historical data for chart
  const historicalData = [
    { date: 'Jan', value: totalCost * 0.95 },
    { date: 'Feb', value: totalCost * 0.98 },
    { date: 'Mar', value: totalCost * 1.02 },
    { date: 'Apr', value: totalCost * 1.05 },
    { date: 'May', value: totalCost * 1.03 },
    { date: 'Jun', value: totalValue },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {totalGainLoss >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return %</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holdings Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="gainLoss" fill="#8884d8" name="Gain/Loss ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Investment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={newInvestment.symbol}
                onChange={(e) => setNewInvestment({...newInvestment, symbol: e.target.value})}
                placeholder="e.g., AAPL"
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newInvestment.name}
                onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newInvestment.type} onValueChange={(value: 'stock' | 'bond' | 'crypto' | 'etf') => setNewInvestment({...newInvestment, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="bond">Bond</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={newInvestment.quantity}
                onChange={(e) => setNewInvestment({...newInvestment, quantity: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                value={newInvestment.purchase_price}
                onChange={(e) => setNewInvestment({...newInvestment, purchase_price: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="current_price">Current Price</Label>
              <Input
                id="current_price"
                type="number"
                value={newInvestment.current_price}
                onChange={(e) => setNewInvestment({...newInvestment, current_price: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button onClick={handleAddInvestment} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {investments.map((investment) => {
              const totalValue = investment.current_price * investment.quantity;
              const totalCost = investment.purchase_price * investment.quantity;
              const gainLoss = totalValue - totalCost;
              const gainLossPercent = ((investment.current_price - investment.purchase_price) / investment.purchase_price) * 100;

              return (
                <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{investment.symbol}</div>
                    <div className="text-sm text-muted-foreground">{investment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {investment.quantity} shares @ ${investment.current_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="font-medium">${totalValue.toFixed(2)}</div>
                    <div className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteInvestment(investment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {investments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No investments yet. Add your first investment above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentPortfolio;
