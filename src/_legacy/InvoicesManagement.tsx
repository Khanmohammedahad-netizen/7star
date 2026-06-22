import { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Invoice, Event } from '../types/database';

type InvoiceWithEvent = Invoice & { event?: Event };

export function InvoicesManagement() {
  const [invoices, setInvoices] = useState<InvoiceWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        event:events(*)
      `)
      .order('issue_date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.event?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalAmount = filteredInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total_amount), 0);
  const unpaidAmount = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + Number(i.total_amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-slate-600 font-medium mb-2">Total Invoiced</div>
          <div className="text-3xl font-bold text-slate-900">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-emerald-600 font-medium mb-2">Paid</div>
          <div className="text-3xl font-bold text-emerald-900">
            ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-amber-600 font-medium mb-2">Unpaid</div>
          <div className="text-3xl font-bold text-amber-900">
            ${unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">All Invoices</h2>
          <p className="text-slate-600">Manage and track all invoices</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by invoice number, client, or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as typeof filterStatus)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500">
              {searchTerm || filterStatus !== 'all'
                ? 'No invoices found matching your criteria'
                : 'No invoices generated yet'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-slate-900">Invoice #{invoice.invoice_number}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-1">Client: {invoice.client_name}</div>
                  {invoice.event && (
                    <div className="text-sm text-slate-600 mb-1">Event: {invoice.event.title}</div>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                    <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                  {invoice.notes && <div className="text-sm text-slate-500 mt-1">{invoice.notes}</div>}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-slate-900">
                    ${Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{invoice.client_contact}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
