import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getInvoices, createInvoice } from '../services/invoiceService';
import { getQuotations } from '../services/quotationService';
import { Invoice } from '../types/invoice';
import { Quotation } from '../types/quotation';
import { generatePdfFromHtml } from '../utils/pdfGenerator';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesData, quotationsData] = await Promise.all([
          getInvoices(),
          getQuotations(),
        ]);
        setInvoices(invoicesData);
        setQuotations(quotationsData.filter(q => q.status === 'approved'));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateInvoice = async () => {
    if (!selectedQuotationId) return;
    const quotation = quotations.find(q => q.id === selectedQuotationId);
    if (!quotation) return;

    try {
      await createInvoice({
        quotation_id: quotation.id,
        invoice_number: `INV-${Date.now()}`,
        total_amount: quotation.total_amount,
        status: 'draft',
      });
      const invoicesData = await getInvoices();
      setInvoices(invoicesData);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };
  
  const handleDownloadPdf = async (invoice: Invoice) => {
    const quotation = quotations.find(q => q.id === invoice.quotation_id);
    if(!quotation) return;
    const data = {
        INVOICE_DATE: new Date(invoice.created_at).toLocaleDateString(),
        INVOICE_NO: invoice.invoice_number,
        INVOICE_ROWS: `<tr><td>1</td><td>${quotation.event_title}</td><td></td><td>1</td><td>${invoice.total_amount}</td><td>${invoice.total_amount}</td></tr>`,
        NET: invoice.total_amount.toString(),
        VAT: (invoice.total_amount * 0.05).toString(),
        TOTAL: (invoice.total_amount * 1.05).toString(),
        AMOUNT_WORDS: 'One Thousand Fifty Only', // Placeholder
    };
    const pdf = await generatePdfFromHtml('/invoice.html', data);
    pdf.save(`invoice-${invoice.invoice_number}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(invoices.map(inv => ({
      'Invoice No.': inv.invoice_number,
      'Date': new Date(inv.created_at).toLocaleDateString(),
      'Company': quotations.find(q => q.id === inv.quotation_id)?.client_name || '',
      'Amount': inv.total_amount,
      'VAT': inv.total_amount * 0.05,
      'Total': inv.total_amount * 1.05,
      'PAID': 0, // Placeholder
      'Balance': inv.total_amount * 1.05, // Placeholder
      'Status': inv.status,
      'Expense': 0, // Placeholder
      'Gross Profit': 0, // Placeholder
      'Income Tax 9%': 0, // Placeholder
      'NET Profit': 0, // Placeholder
      'Commission': 0, // Placeholder
      '7 STAR PROFIT': 0, // Placeholder
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, 'Invoice_Summary.xlsx');
  };

  if (isLoading) {
    return <div>Loading invoices...</div>;
  }

  const canCreateInvoice = profile?.role === 'admin' || profile?.role === 'accountant';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
        <div className="flex space-x-4">
          {canCreateInvoice && (
            <button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
              <Plus className="w-5 h-5" />
              <span>Create Invoice</span>
            </button>
          )}
          <button onClick={handleExportExcel} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg">
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {invoices.map((inv) => (
            <div key={inv.id} className="p-4 border rounded-lg flex justify-between">
                <p>{inv.invoice_number} - ${inv.total_amount}</p>
                <button onClick={() => handleDownloadPdf(inv)}>Download PDF</button>
            </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Create New Invoice</h2>
            <select onChange={(e) => setSelectedQuotationId(e.target.value)}>
              <option>Select an approved quotation</option>
              {quotations.map(q => <option key={q.id} value={q.id}>{q.event_title} for {q.client_name}</option>)}
            </select>
            <button onClick={handleCreateInvoice}>Generate Invoice</button>
            <button onClick={() => setCreateModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
