import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';

export default function ReportsPage() {
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const days = 14;
      const data: any[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const start = `${dateStr}T00:00:00`;
        const end = `${dateStr}T23:59:59`;

        const [appts, pats] = await Promise.all([
          supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_time', start).lte('appointment_time', end),
          supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
        ]);

        data.push({
          date: format(date, 'MMM d'),
          appointments: appts.count || 0,
          patients: pats.count || 0,
        });
      }

      setDailyData(data);
      setLoading(false);
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 w-48 bg-muted rounded" /><div className="h-64 bg-muted rounded-lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">Last 14 days overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Daily Appointments</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="appointments" fill="hsl(210, 90%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>New Patients</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="hsl(170, 65%, 42%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
