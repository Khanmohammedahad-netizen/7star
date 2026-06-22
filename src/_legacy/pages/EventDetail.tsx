import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X, FileText } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { logAudit } from '../utils/audit';

/* ───────────────── TYPES ───────────────── */

interface Event {
  id: string;
  name: string;
  client: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  region: 'UAE' | 'SAUDI';
}

interface Material {
  id: string;
  name: string;
  cost: number;
}

interface Payment {
  id: string;
  amount: number;
  status: 'Received' | 'Pending';
}

/* ───────────────── COMPONENT ───────────────── */

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  /* ───────────────── FETCH ALL ───────────────── */

  const fetchAll = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) {
        console.error('Error fetching event:', eventError);
        setEvent(null);
        setLoading(false);
        return;
      }

      if (!eventData) {
        setEvent(null);
        setLoading(false);
        return;
      }

      // Map event_date to date for consistency
      // If your database column has a different name, check DATABASE_COLUMN_FIX.md
      const mappedEvent = {
        ...eventData,
        date: (eventData as any).event_date || (eventData as any).start_date || (eventData as any).scheduled_date || (eventData as any).date
      };

      // 🔒 REGION GUARD (frontend safety, RLS still mandatory)
      if (user?.role !== 'admin' && user?.region !== mappedEvent.region) {
        setEvent(null);
        setLoading(false);
        return;
      }

      const { data: materialData, error: materialError } = await supabase
        .from('materials')
        .select('*')
        .eq('event_id', id);

      if (materialError) {
        console.error('Error fetching materials:', materialError);
      }

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('event_id', id);

      if (paymentError) {
        console.error('Error fetching payments:', paymentError);
      }

      setEvent(mappedEvent as Event);
      setMaterials(materialData || []);
      setPayments(paymentData || []);
    } catch (err) {
      console.error('Unexpected error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ───────────────── ACTIONS ───────────────── */

  const updateStatus = async (status: Event['status']) => {
    if (!event || user?.role !== 'admin') return;

    await supabase
      .from('events')
      .update({ status })
      .eq('id', event.id);

    await logAudit(
      'event_status_changed',
      `Event status changed to ${status}`,
      user,
      event.id,
      event.region
    );

    fetchAll();
  };

  const addMaterial = async () => {
    if (!event || !user) return;

    await supabase.from('materials').insert({
      event_id: event.id,
      name: 'New Material',
      cost: 50000
    });

    await logAudit(
      'material_added',
      'Material added to event',
      user,
      event.id,
      event.region
    );

    fetchAll();
  };

  const markPaymentReceived = async (paymentId: string) => {
    if (!event || user?.role !== 'admin') return;

    await supabase
      .from('payments')
      .update({ status: 'Received' })
      .eq('id', paymentId);

    await logAudit(
      'payment_received',
      'Payment marked as received',
      user,
      event.id,
      event.region
    );

    fetchAll();
  };

  /* ───────────────── INVOICE ───────────────── */

  const generateInvoice = async () => {
    if (!event) return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) return;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ event, materials, payments })
      }
    );

    if (!res.ok) {
      alert('Failed to generate invoice');
      return;
    }

    const blob = await res.blob();
    window.open(URL.createObjectURL(blob));
  };

  /* ───────────────── UI STATES ───────────────── */

  if (loading) {
    return <div className="py-24 text-center text-gray-500">Loading event…</div>;
  }

  if (!event) {
    return (
      <div className="py-24 text-center text-gray-500">
        Event not found or access denied.
      </div>
    );
  }

  /* ───────────────── CALCULATIONS ───────────────── */

  const totalMaterialCost = materials.reduce((s, m) => s + m.cost, 0);
  const totalReceived = payments.filter(p => p.status === 'Received').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  const badgeVariant =
    event.status === 'Approved'
      ? 'success'
      : event.status === 'Pending'
      ? 'warning'
      : 'error';

  /* ───────────────── RENDER ───────────────── */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/events')}>
          <ArrowLeft size={16} />
        </Button>

        <div>
          <h2 className="text-2xl font-semibold">{event.name}</h2>
          <p className="text-sm text-gray-600">
            Client: {event.client} · Date: {new Date(event.date).toLocaleDateString()}
          </p>
        </div>

        <Badge variant={badgeVariant} className="ml-auto">
          {event.status}
        </Badge>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Material Cost</div>
          <div className="text-xl font-semibold">₹{totalMaterialCost.toLocaleString()}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Payments Received</div>
          <div className="text-xl font-semibold text-green-600">₹{totalReceived.toLocaleString()}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Payments Pending</div>
          <div className="text-xl font-semibold text-yellow-600">₹{totalPending.toLocaleString()}</div>
        </Card>
      </div>

      {/* MATERIALS */}
      <Card>
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Materials</h3>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button size="sm" onClick={addMaterial}>
              <Plus size={14} className="mr-1" /> Add Material
            </Button>
          )}
        </div>

        {materials.length === 0
          ? <p className="text-sm text-gray-500">No materials added.</p>
          : materials.map(m => (
              <div key={m.id} className="flex justify-between border-b py-2">
                <span>{m.name}</span>
                <span>₹{m.cost.toLocaleString()}</span>
              </div>
            ))}
      </Card>

      {/* PAYMENTS */}
      <Card>
        <h3 className="font-semibold mb-4">Payments</h3>

        {payments.map(p => (
          <div key={p.id} className="flex justify-between border-b py-2">
            <div>
              ₹{p.amount.toLocaleString()}
              <Badge className="ml-2" variant={p.status === 'Received' ? 'success' : 'warning'}>
                {p.status}
              </Badge>
            </div>

            {p.status === 'Pending' && user?.role === 'admin' && (
              <Button size="sm" variant="ghost" onClick={() => markPaymentReceived(p.id)}>
                <Check size={14} className="mr-1" /> Mark Received
              </Button>
            )}
          </div>
        ))}
      </Card>

      {/* ACTIONS */}
      <div className="flex gap-3">
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button onClick={generateInvoice}>
            <FileText size={16} className="mr-1" />
            Generate Invoice
          </Button>
        )}
      </div>

      {/* APPROVALS */}
      {user?.role === 'admin' && (
        <Card>
          <h3 className="font-semibold mb-4">Approvals</h3>
          <div className="flex gap-2">
            <Button onClick={() => updateStatus('Approved')}>
              <Check size={14} className="mr-1" /> Approve
            </Button>
            <Button variant="danger" onClick={() => updateStatus('Rejected')}>
              <X size={14} className="mr-1" /> Reject
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
