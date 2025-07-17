import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, Percent, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface LoanCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paymentSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

const LoanCalculator = () => {
  const [loanAmount, setLoanAmount] = useState('100000');
  const [interestRate, setInterestRate] = useState('5.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount);
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numberOfPayments = parseFloat(loanTerm) * 12;

    if (monthlyRate === 0) {
      // Handle 0% interest rate
      const monthlyPayment = principal / numberOfPayments;
      const totalPayment = principal;
      const totalInterest = 0;
      
      const paymentSchedule = [];
      let remainingBalance = principal;
      
      for (let i = 1; i <= numberOfPayments; i++) {
        const principalPayment = monthlyPayment;
        const interestPayment = 0;
        remainingBalance -= principalPayment;
        
        paymentSchedule.push({
          month: i,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, remainingBalance)
        });
      }
      
      setCalculation({
        monthlyPayment,
        totalPayment,
        totalInterest,
        paymentSchedule
      });
      return;
    }

    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;

    // Generate amortization schedule
    const paymentSchedule = [];
    let remainingBalance = principal;

    for (let i = 1; i <= numberOfPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      paymentSchedule.push({
        month: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance)
      });
    }

    setCalculation({
      monthlyPayment,
      totalPayment,
      totalInterest,
      paymentSchedule
    });
  };

  const pieData = calculation ? [
    { name: 'Principal', value: parseFloat(loanAmount) },
    { name: 'Interest', value: calculation.totalInterest }
  ] : [];

  const chartData = calculation ? 
    calculation.paymentSchedule.filter((_, index) => index % 12 === 0 || index === calculation.paymentSchedule.length - 1)
      .map(payment => ({
        year: Math.ceil(payment.month / 12),
        principal: payment.principal,
        interest: payment.interest,
        balance: payment.balance
      })) : [];

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loan Calculator
          </CardTitle>
          <CardDescription>Calculate monthly payments and analyze loan terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="loanAmount">Loan Amount ($)</Label>
              <Input
                id="loanAmount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="100000"
              />
            </div>
            <div>
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="5.5"
              />
            </div>
            <div>
              <Label htmlFor="loanTerm">Loan Term (years)</Label>
              <Select value={loanTerm} onValueChange={setLoanTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 years</SelectItem>
                  <SelectItem value="20">20 years</SelectItem>
                  <SelectItem value="25">25 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={calculateLoan} className="w-full">
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {calculation && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculation.monthlyPayment.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payment</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculation.totalPayment.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${calculation.totalInterest.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Principal vs Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: $${value.toFixed(0)} (${(percent * 100).toFixed(1)}%)`}
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

            <Card>
              <CardHeader>
                <CardTitle>Payment Breakdown by Year</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="principal" stackId="a" fill="#0088FE" name="Principal" />
                    <Bar dataKey="interest" stackId="a" fill="#00C49F" name="Interest" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="schedule" className="w-full">
            <TabsList>
              <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
              <TabsTrigger value="comparison">Loan Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>Amortization Schedule</CardTitle>
                  <CardDescription>Monthly payment breakdown for the first 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Month</th>
                          <th className="border border-gray-300 p-2 text-right">Payment</th>
                          <th className="border border-gray-300 p-2 text-right">Principal</th>
                          <th className="border border-gray-300 p-2 text-right">Interest</th>
                          <th className="border border-gray-300 p-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.paymentSchedule.slice(0, 12).map((payment) => (
                          <tr key={payment.month}>
                            <td className="border border-gray-300 p-2">{payment.month}</td>
                            <td className="border border-gray-300 p-2 text-right">${payment.payment.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2 text-right">${payment.principal.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2 text-right">${payment.interest.toFixed(2)}</td>
                            <td className="border border-gray-300 p-2 text-right">${payment.balance.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Term Comparison</CardTitle>
                  <CardDescription>Compare different loan terms for the same amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Term</th>
                          <th className="border border-gray-300 p-2 text-right">Monthly Payment</th>
                          <th className="border border-gray-300 p-2 text-right">Total Payment</th>
                          <th className="border border-gray-300 p-2 text-right">Total Interest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[15, 20, 25, 30].map(years => {
                          const principal = parseFloat(loanAmount);
                          const monthlyRate = parseFloat(interestRate) / 100 / 12;
                          const numberOfPayments = years * 12;
                          const monthlyPayment = monthlyRate === 0 ? 
                            principal / numberOfPayments :
                            principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
                          const totalPayment = monthlyPayment * numberOfPayments;
                          const totalInterest = totalPayment - principal;

                          return (
                            <tr key={years}>
                              <td className="border border-gray-300 p-2">{years} years</td>
                              <td className="border border-gray-300 p-2 text-right">${monthlyPayment.toFixed(2)}</td>
                              <td className="border border-gray-300 p-2 text-right">${totalPayment.toFixed(2)}</td>
                              <td className="border border-gray-300 p-2 text-right">${totalInterest.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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

export default LoanCalculator;
