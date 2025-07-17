
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Clock, CheckCircle, Plus, Eye, Trash2 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";

const InvoiceBilling = () => {
  const { invoices, loading, addInvoice, updateInvoiceStatus, deleteInvoice } = useInvoices();
  
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    client_name: '',
    amount: '',
    due_date: '',
    description: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue'
  });

  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleAddInvoice = async () => {
    if (newInvoice.invoice_number && newInvoice.client_name && newInvoice.amount && newInvoice.due_date) {
      await addInvoice({
        invoice_number: newInvoice.invoice_number,
        client_name: newInvoice.client_name,
        amount: parseFloat(newInvoice.amount),
        due_date: newInvoice.due_date,
        status: newInvoice.status,
        description: newInvoice.description || undefined
      });
      setNewInvoice({ 
        invoice_number: '', 
        client_name: '', 
        amount: '', 
        due_date: '', 
        description: '', 
        status: 'draft' 
      });
      setShowCreateForm(false);
    }
  };

  const getStatusColor = (status: 'draft' | 'sent' | 'paid' | 'overdue') => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading invoice data...</div>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totalOutstanding.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  value={newInvoice.invoice_number}
                  onChange={(e) => setNewInvoice({...newInvoice, invoice_number: e.target.value})}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={newInvoice.client_name}
                  onChange={(e) => setNewInvoice({...newInvoice, client_name: e.target.value})}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newInvoice.due_date}
                  onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newInvoice.status} onValueChange={(value: 'draft' | 'sent' | 'paid' | 'overdue') => setNewInvoice({...newInvoice, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  placeholder="Enter invoice description"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={handleAddInvoice}>Create Invoice</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{invoice.invoice_number}</h3>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Client: {invoice.client_name}</p>
                  {invoice.description && (
                    <p className="text-sm text-muted-foreground mb-1">Description: {invoice.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(invoice.created_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-2">${invoice.amount.toFixed(2)}</div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {invoice.status !== 'paid' && (
                      <Select
                        value={invoice.status}
                        onValueChange={(value: 'draft' | 'sent' | 'paid' | 'overdue') => updateInvoiceStatus(invoice.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {invoices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No invoices yet. Create your first invoice above.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceBilling;
