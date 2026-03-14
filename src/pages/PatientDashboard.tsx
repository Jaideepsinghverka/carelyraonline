import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, Plus, LogOut, Activity } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import type { Hospital } from '@/types/database';

interface AppointmentRow {
  id: string;
  appointment_time: string;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  doctor: { name: string; specialization: string | null } | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  scheduled: { label: 'Scheduled', variant: 'default', icon: Clock },
  checked_in: { label: 'Checked In', variant: 'secondary', icon: AlertCircle },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  no_show: { label: 'No Show', variant: 'destructive', icon: XCircle },
};

export default function PatientDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchHospital = async () => {
      const { data, error } = await supabase.from('hospitals').select('*').eq('slug', slug).single();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setHospital(data as Hospital);
    };
    fetchHospital();
  }, [slug]);

  useEffect(() => {
    if (authLoading || !hospital || !user) return;

    const fetchAppointments = async () => {
      // Get patient record for this user at this hospital
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .eq('hospital_id', hospital.id)
        .eq('user_id', user.id)
        .limit(1);

      if (!patients || patients.length === 0) {
        setLoading(false);
        return;
      }

      const patientId = patients[0].id;

      const { data: appts } = await supabase
        .from('appointments')
        .select('id, appointment_time, status, notes, created_at, doctor:doctors(name, specialization)')
        .eq('patient_id', patientId)
        .eq('hospital_id', hospital.id)
        .order('appointment_time', { ascending: false });

      setAppointments((appts as unknown as AppointmentRow[]) || []);
      setLoading(false);
    };

    fetchAppointments();
  }, [user, authLoading, hospital]);

  useEffect(() => {
    if (!authLoading && !user && hospital) {
      navigate(`/h/${slug}/signup`);
    }
  }, [authLoading, user, hospital, slug, navigate]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <h2 className="text-2xl font-heading font-bold text-foreground">Hospital Not Found</h2>
            <p className="text-muted-foreground">The hospital link you followed doesn't exist.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = appointments.filter(a => !isPast(parseISO(a.appointment_time)) && a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show');
  const past = appointments.filter(a => isPast(parseISO(a.appointment_time)) || a.status === 'cancelled' || a.status === 'completed' || a.status === 'no_show');

  const handleSignOut = async () => {
    await signOut();
    navigate(`/h/${slug}/signup`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground">{hospital?.name}</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.profile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm">
              <Link to={`/h/${slug}/book`}>
                <Plus className="h-4 w-4 mr-1" /> Book Appointment
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{upcoming.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-muted-foreground">{past.length}</p>
              <p className="text-sm text-muted-foreground">Past</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center space-y-3">
                  <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Button asChild size="sm">
                    <Link to={`/h/${slug}/book`}>Book an Appointment</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcoming.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {past.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No past appointments</p>
                </CardContent>
              </Card>
            ) : (
              past.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: AppointmentRow }) {
  const status = statusConfig[appointment.status || 'scheduled'] || statusConfig.scheduled;
  const StatusIcon = status.icon;
  const dateTime = parseISO(appointment.appointment_time);

  return (
    <Card>
      <CardContent className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {appointment.doctor ? `Dr. ${appointment.doctor.name}` : 'Doctor'}
              {appointment.doctor?.specialization && (
                <span className="text-muted-foreground font-normal"> — {appointment.doctor.specialization}</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(dateTime, 'EEEE, MMMM d, yyyy')} at {format(dateTime, 'h:mm a')}
            </p>
            {appointment.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">"{appointment.notes}"</p>
            )}
          </div>
        </div>
        <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </CardContent>
    </Card>
  );
}
