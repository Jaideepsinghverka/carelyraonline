import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarDays, Clock, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  patientsToday: number;
  appointmentsToday: number;
  upcoming: number;
  totalDoctors: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ patientsToday: 0, appointmentsToday: 0, upcoming: 0, totalDoctors: 0 });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;

    Promise.all([
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
      supabase.from('appointments').select('id', { count: 'exact', head: true })
        .gte('appointment_time', new Date().toISOString()).eq('status', 'scheduled'),
      supabase.from('doctors').select('id', { count: 'exact', head: true }),
      supabase.from('patients').select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay).lte('created_at', endOfDay),
      supabase.from('appointments').select('*, patient:patients(name), doctor:doctors(name, specialization)')
        .gte('appointment_time', startOfDay).order('appointment_time', { ascending: true }).limit(10),
    ]).then(([apptToday, upcoming, doctors, patientsToday, recent]) => {
      setStats({
        appointmentsToday: apptToday.count || 0,
        upcoming: upcoming.count || 0,
        totalDoctors: doctors.count || 0,
        patientsToday: patientsToday.count || 0,
      });
      setRecentAppointments(recent.data || []);
      setLoading(false);
    });
  }, [user]);

  const statCards = [
    { title: 'Patients Today', value: stats.patientsToday, icon: Users, color: 'text-primary' },
    { title: 'Appointments Today', value: stats.appointmentsToday, icon: CalendarDays, color: 'text-accent' },
    { title: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-warning' },
    { title: 'Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'text-success' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.profile.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No appointments today.</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{appt.patient?.name}</p>
                    <p className="text-xs text-muted-foreground">Dr. {appt.doctor?.name} · {appt.doctor?.specialization}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{format(new Date(appt.appointment_time), 'HH:mm')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      appt.status === 'completed' ? 'bg-success/10 text-success' :
                      appt.status === 'checked_in' ? 'bg-info/10 text-info' :
                      appt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>{appt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
