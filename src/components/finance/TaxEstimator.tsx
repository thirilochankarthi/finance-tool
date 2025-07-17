import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, Percent, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface TaxCalculation {
  grossIncome: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  marginalRate: number;
}

const TaxEstimator = () => {
  const [income, setIncome] = useState('75000');
  const [filingStatus, setFilingStatus] = useState('single');
  const [deductions, setDeductions] = useState('standard');
  const [customDeduction, setCustomDeduction] = useState('');
  const [stateRate, setStateRate] = useState('5');
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);

  // 2024 Tax Brackets (simplified)
  const taxBrackets = {
    single: [
      { min: 0, max: 11000, rate: 0.10 },
      { min: 11000, max: 44725, rate: 0.12 },
      { min: 44725, max: 95375, rate: 0.22 },
      { min: 95375, max: 182050, rate: 0.24 },
      { min: 182050, max: 231250, rate: 0.32 },
      { min: 231250, max: 578125, rate: 0.35 },
      { min: 578125, max: Infinity, rate: 0.37 }
    ],
    marriedJoint: [
      { min: 0, max: 22000, rate: 0.10 },
      { min: 22000, max: 89450, rate: 0.12 },
      { min: 89450, max: 190750, rate: 0.22 },
      { min: 190750, max: 364200, rate: 0.24 },
      { min: 364200, max: 462500, rate: 0.32 },
      { min: 462500, max: 693750, rate: 0.35 },
      { min: 693750, max: Infinity, rate: 0.37 }
    ]
  };

  const standardDeductions = {
    single: 13850,
    marriedJoint: 27700,
    marriedSeparate: 13850,
    headOfHousehold: 20800
  };

  const calculateTax = () => {
    const grossIncome = parseFloat(income);
    const standardDeduction = standardDeductions[filingStatus as keyof typeof standardDeductions];
    const totalDeductions = deductions === 'standard' ? standardDeduction : parseFloat(customDeduction) || 0;
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Calculate federal tax using brackets
    const brackets = filingStatus === 'marriedJoint' ? taxBrackets.marriedJoint : taxBrackets.single;
    let federalTax = 0;
    let marginalRate = 0;

    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableAtThisBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
        federalTax += taxableAtThisBracket * bracket.rate;
        marginalRate = bracket.rate;
      }
    }

    // Calculate payroll taxes
    const socialSecurity = Math.min(grossIncome * 0.062, 147000 * 0.062); // 2024 SS wage base
    const medicare = grossIncome * 0.0145;
    const additionalMedicare = grossIncome > 200000 ? (grossIncome - 200000) * 0.009 : 0;

    // Calculate state tax (simplified)
    const stateTax = taxableIncome * (parseFloat(stateRate) / 100);

    const totalTax = federalTax + stateTax + socialSecurity + medicare + additionalMedicare;
    const netIncome = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

    setCalculation({
      grossIncome,
      taxableIncome,
      federalTax,
      stateTax,
      socialSecurity,
      medicare: medicare + additionalMedicare,
      totalTax,
      netIncome,
      effectiveRate,
      marginalRate: marginalRate * 100
    });
  };

  const pieData = calculation ? [
    { name: 'Federal Tax', value: calculation.federalTax },
    { name: 'State Tax', value: calculation.stateTax },
    { name: 'Social Security', value: calculation.socialSecurity },
    { name: 'Medicare', value: calculation.medicare },
    { name: 'Net Income', value: calculation.netIncome }
  ] : [];

  const comparisonData = calculation ? [
    { category: 'Gross Income', amount: calculation.grossIncome },
    { category: 'Taxable Income', amount: calculation.taxableIncome },
    { category: 'Total Tax', amount: calculation.totalTax },
    { category: 'Net Income', amount: calculation.netIncome }
  ] : [];

  const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884D8'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Estimator
          </CardTitle>
          <CardDescription>Estimate your federal and state income taxes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="income">Annual Income ($)</Label>
              <Input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="75000"
              />
            </div>
            <div>
              <Label htmlFor="filingStatus">Filing Status</Label>
              <Select value={filingStatus} onValueChange={setFilingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="marriedJoint">Married Filing Jointly</SelectItem>
                  <SelectItem value="marriedSeparate">Married Filing Separately</SelectItem>
                  <SelectItem value="headOfHousehold">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deductions">Deductions</Label>
              <Select value={deductions} onValueChange={setDeductions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Deduction</SelectItem>
                  <SelectItem value="itemized">Itemized Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {deductions === 'itemized' && (
              <div>
                <Label htmlFor="customDeduction">Itemized Amount ($)</Label>
                <Input
                  id="customDeduction"
                  type="number"
                  value={customDeduction}
                  onChange={(e) => setCustomDeduction(e.target.value)}
                  placeholder="20000"
                />
              </div>
            )}
            <div>
              <Label htmlFor="stateRate">State Tax Rate (%)</Label>
              <Input
                id="stateRate"
                type="number"
                step="0.1"
                value={stateRate}
                onChange={(e) => setStateRate(e.target.value)}
                placeholder="5.0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={calculateTax} className="w-full">
                Calculate Tax
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {calculation && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tax</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${calculation.totalTax.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${calculation.netIncome.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Effective Rate</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculation.effectiveRate.toFixed(2)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Marginal Rate</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculation.marginalRate.toFixed(2)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList>
              <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly Payments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="breakdown">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Tax Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Gross Income</span>
                      <span className="font-semibold">${calculation.grossIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Taxable Income</span>
                      <span className="font-semibold">${calculation.taxableIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Federal Tax</span>
                      <span className="font-semibold text-red-600">${calculation.federalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>State Tax</span>
                      <span className="font-semibold text-red-600">${calculation.stateTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Social Security</span>
                      <span className="font-semibold text-red-600">${calculation.socialSecurity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Medicare</span>
                      <span className="font-semibold text-red-600">${calculation.medicare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded bg-gray-50">
                      <span className="font-semibold">Total Tax</span>
                      <span className="font-bold text-red-600">${calculation.totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded bg-green-50">
                      <span className="font-semibold">Net Income</span>
                      <span className="font-bold text-green-600">${calculation.netIncome.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quarterly">
              <Card>
                <CardHeader>
                  <CardTitle>Quarterly Estimated Payments</CardTitle>
                  <CardDescription>For self-employed individuals or those with additional income</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
                      <div key={quarter} className="p-4 border rounded text-center">
                        <h3 className="font-semibold mb-2">{quarter} 2024</h3>
                        <p className="text-2xl font-bold">${(calculation.totalTax / 4).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {['Apr 15', 'Jun 17', 'Sep 16', 'Jan 15'][index]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> These are estimated payments based on your annual income. 
                      Consult with a tax professional for accurate quarterly payment calculations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default TaxEstimator;
