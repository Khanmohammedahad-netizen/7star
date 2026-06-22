import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface Report {
  id: string;
  name: string;
  region: string;
  material_cost: number;
  received: number;
  pending: number;
}

export function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase.rpc('event_financial_report', {
      region_filter: user.role === 'admin' ? null : user.region
    });

    setReports(data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="py-24 text-center">Loading reports…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Financial Reports</h2>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th>Event</th>
              <th>Region</th>
              <th>Material Cost</th>
              <th>Received</th>
              <th>Pending</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => {
              const pnl = r.received - r.material_cost;

              return (
                <tr key={r.id} className="border-b">
                  <td>{r.name}</td>
                  <td>{r.region}</td>
                  <td>₹{r.material_cost.toLocaleString()}</td>
                  <td className="text-green-600">
                    ₹{r.received.toLocaleString()}
                  </td>
                  <td className="text-yellow-600">
                    ₹{r.pending.toLocaleString()}
                  </td>
                  <td className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{pnl.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
