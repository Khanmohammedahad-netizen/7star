import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface Forecast {
  region: string;
  avg_cost: number;
  projected_cost: number;
}

export function BudgetForecast() {
  const { user } = useAuth();
  const [data, setData] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.rpc('budget_forecast', {
      region_filter: user?.role === 'admin' ? null : user?.region
    });

    setData(data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="py-24 text-center">Loading forecast…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Budget Forecast</h2>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th>Region</th>
              <th>Avg Event Cost</th>
              <th>Forecasted Budget</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.region} className="border-b">
                <td>{r.region}</td>
                <td>₹{r.avg_cost.toLocaleString()}</td>
                <td className="font-semibold">
                  ₹{r.projected_cost.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
