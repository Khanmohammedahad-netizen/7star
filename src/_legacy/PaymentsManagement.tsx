import { useState, useEffect } from 'react';
import { DollarSign, Search, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Payment, Event } from '../types/database';

type PaymentWithEvent = Payment & { event?: Event };

export function PaymentsManagement() {
  const [payments, setPayments] = useState<PaymentWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'received' | 'pending'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        event:events(*)
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.event?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || payment.payment_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalReceived = payments
    .filter((p) => p.payment_type === 'received')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPending = payments
    .filter((p) => p.payment_type === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalOverdue = payments
    .filter((p) => p.status === 'overdue')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">Payments Received</div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">Payments Pending</div>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600 font-medium">Overdue Payments</div>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">All Payments</h2>
          <p className="text-slate-600">Track received and pending payments</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by client or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('received')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'received'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Received
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500">
              {searchTerm || filterType !== 'all' ? 'No payments found matching your criteria' : 'No payments recorded yet'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-slate-900">{payment.client_name}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.payment_type === 'received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {payment.payment_type.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : payment.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {payment.status.toUpperCase()}
                    </span>
                  </div>
                  {payment.event && (
                    <div className="text-sm text-slate-600 mb-1">Event: {payment.event.title}</div>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                    {payment.payment_method && <span>{payment.payment_method}</span>}
                  </div>
                  {payment.notes && <div className="text-sm text-slate-500 mt-1">{payment.notes}</div>}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-slate-900">
                    ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
