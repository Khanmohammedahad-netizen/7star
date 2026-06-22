import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

interface Stat {
  label: string;
  value: string;
  icon: React.ComponentType;
  color: string;
}

interface Activity {
  action: string;
  event: string;
  time: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Total Users', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Active Events', value: '0', icon: Calendar, color: 'text-green-600' },
    { label: 'Completed Events', value: '0', icon: CheckCircle, color: 'text-gray-600' },
    { label: 'Pending Approvals', value: '0', icon: Clock, color: 'text-amber-600' },
  ]);

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch event counts
        const { data: events } = await supabase
          .from('events')
          .select('status');

        const activeEvents = events?.filter(e => e.status === 'Approved').length || 0;
        const completedEvents = events?.filter(e => e.status === 'Approved').length || 0; // Assuming completed means approved, adjust if needed
        const pendingEvents = events?.filter(e => e.status === 'Pending').length || 0;

        setStats([
          { label: 'Total Users', value: userCount?.toString() || '0', icon: Users, color: 'text-blue-600' },
          { label: 'Active Events', value: activeEvents.toString(), icon: Calendar, color: 'text-green-600' },
          { label: 'Completed Events', value: completedEvents.toString(), icon: CheckCircle, color: 'text-gray-600' },
          { label: 'Pending Approvals', value: pendingEvents.toString(), icon: Clock, color: 'text-amber-600' },
        ]);

        // Fetch recent activity from audit_logs
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('action, description, created_at')
          .order('created_at', { ascending: false })
          .limit(4);

        const activities = logs?.map(log => ({
          action: log.action,
          event: log.description || '',
          time: new Date(log.created_at).toLocaleString(),
        })) || [];

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-600">Overview of your event management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color}`}>
                  <Icon size={32} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-between pb-4 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-600 mt-1">{activity.event}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
