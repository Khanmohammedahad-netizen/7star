import { useState, useEffect } from 'react';
import { ArrowLeft, Package, DollarSign, FileText, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Event, Profile, Material, Payment, Invoice } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { AddMaterialModal } from './AddMaterialModal';
import { AddPaymentModal } from './AddPaymentModal';
import { GenerateInvoiceModal } from './GenerateInvoiceModal';

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
}

export function EventDetails({ eventId, onBack }: EventDetailsProps) {
  const { profile } = useAuth();
  const [event, setEvent] = useState<(Event & { manager?: Profile }) | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);

    const [eventResult, materialsResult, paymentsResult, invoicesResult] = await Promise.all([
      supabase
        .from('events')
        .select('*, manager:profiles!events_manager_id_fkey(*)')
        .eq('id', eventId)
        .maybeSingle(),
      supabase.from('materials').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('event_id', eventId).order('payment_date', { ascending: false }),
      supabase.from('invoices').select('*').eq('event_id', eventId).order('issue_date', { ascending: false }),
    ]);

    if (eventResult.data) setEvent(eventResult.data);
    if (materialsResult.data) setMaterials(materialsResult.data);
    if (paymentsResult.data) setPayments(paymentsResult.data);
    if (invoicesResult.data) setInvoices(invoicesResult.data);

    setLoading(false);
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading event details...</div>
      </div>
    );
  }

  const totalMaterialCost = materials.reduce((sum, m) => sum + Number(m.total_cost), 0);
  const totalPaymentsReceived = payments
    .filter(p => p.payment_type === 'received')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaymentsPending = payments
    .filter(p => p.payment_type === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const statusColors = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-slate-100 text-slate-800',
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Calendar</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{event.title}</h1>
            <p className="text-slate-600 mb-4">{event.description}</p>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[event.status]}`}>
                {event.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                {event.region.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Event Date</div>
              <div className="font-medium text-slate-900">
                {new Date(event.event_date).toLocaleDateString()}
                {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm text-slate-500">Location</div>
              <div className="font-medium text-slate-900">{event.location}</div>
            </div>
          </div>

          {event.manager && (
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <div className="text-sm text-slate-500">Manager In Charge</div>
                <div className="font-medium text-slate-900">{event.manager.full_name}</div>
                <div className="text-sm text-slate-600">{event.manager.contact_number}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Material Cost</div>
            <div className="text-2xl font-bold text-blue-900">
              ${totalMaterialCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="text-sm text-emerald-600 font-medium mb-1">Payments Received</div>
            <div className="text-2xl font-bold text-emerald-900">
              ${totalPaymentsReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="text-sm text-amber-600 font-medium mb-1">Payments Pending</div>
            <div className="text-2xl font-bold text-amber-900">
              ${totalPaymentsPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Materials Used</h2>
          </div>
          <button
            onClick={() => setShowMaterialModal(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm"
          >
            Add Material
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No materials recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Material</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Total Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(material => (
                  <tr key={material.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{material.material_name}</div>
                      {material.notes && <div className="text-sm text-slate-500">{material.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {material.quantity} {material.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      ${Number(material.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ${Number(material.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{material.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={3} className="py-3 px-4 font-bold text-slate-900 text-right">
                    Total:
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    ${totalMaterialCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Payments</h2>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm"
          >
            Add Payment
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No payments recorded yet</div>
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
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
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                    {payment.payment_method && <span>{payment.payment_method}</span>}
                  </div>
                  {payment.notes && <div className="text-sm text-slate-500 mt-1">{payment.notes}</div>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Invoices</h2>
          </div>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm"
          >
            Generate Invoice
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No invoices generated yet</div>
        ) : (
          <div className="space-y-3">
            {invoices.map(invoice => (
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
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                    <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    ${Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showMaterialModal && (
        <AddMaterialModal
          eventId={eventId}
          onClose={() => setShowMaterialModal(false)}
          onSuccess={() => {
            setShowMaterialModal(false);
            fetchEventDetails();
          }}
        />
      )}

      {showPaymentModal && (
        <AddPaymentModal
          eventId={eventId}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchEventDetails();
          }}
        />
      )}

      {showInvoiceModal && (
        <GenerateInvoiceModal
          eventId={eventId}
          totalMaterialCost={totalMaterialCost}
          onClose={() => setShowInvoiceModal(false)}
          onSuccess={() => {
            setShowInvoiceModal(false);
            fetchEventDetails();
          }}
        />
      )}
    </div>
  );
}
