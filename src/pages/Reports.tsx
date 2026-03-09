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
      const startDate = subDays(new Date(), days - 1);
      const startStr = `${format(startDate, 'yyyy-MM-dd')}T00:00:00`;

      // Fetch all data in TWO queries instead of 28
      const [apptsRes, patsRes] = await Promise.all([
        supabase.from('appointments').select('appointment_time').gte('appointment_time', startStr),
        supabase.from('patients').select('created_at').gte('created_at', startStr),
      ]);

      const appts = apptsRes.data || [];
      const pats = patsRes.data || [];

      // Group by date client-side
      const data: any[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        data.push({
          date: format(date, 'MMM d'),
          appointments: appts.filter(a => a.appointment_time?.startsWith(dateStr)).length,
          patients: pats.filter(p => p.created_at?.startsWith(dateStr)).length,
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
