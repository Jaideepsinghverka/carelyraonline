import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Patient, Appointment } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [patRes, apptRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('appointments').select('*, doctor:doctors(name, specialization)').eq('patient_id', id).order('appointment_time', { ascending: false }),
    ]);
    setPatient(patRes.data as unknown as Patient | null);
    setAppointments((apptRes.data as unknown as Appointment[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    scheduled: 'outline',
    checked_in: 'secondary',
    completed: 'default',
    cancelled: 'destructive',
    no_show: 'destructive',
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button asChild variant="outline"><Link to="/patients"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Patients</Link></Button>
      </div>
    );
  }

  const age = patient.date_of_birth
    ? differenceInYears(new Date(), new Date(patient.date_of_birth))
    : null;

  const upcoming = appointments.filter(a => a.status === 'scheduled' || a.status === 'checked_in');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/patients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">{patient.name}</h1>
          <p className="text-muted-foreground text-sm">Patient Details</p>
        </div>
      </div>

      {/* Patient Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Gender / Age</p>
              <p className="font-medium capitalize truncate">
                {patient.gender || 'Not set'}{age !== null ? ` · ${age} yrs` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="font-medium truncate">
                {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium truncate">{patient.phone || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium truncate">{patient.address || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Upcoming Appointments
          </CardTitle>
          <CardDescription>{upcoming.length} upcoming</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {upcoming.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No upcoming appointments.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">Dr. {(a as any).doctor?.name}</TableCell>
                    <TableCell>{format(new Date(a.appointment_time), 'MMM d, yyyy · HH:mm')}</TableCell>
                    <TableCell><Badge variant={statusVariant[a.status] || 'outline'}>{a.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{a.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointment History</CardTitle>
          <CardDescription>{past.length} past appointments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {past.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No past appointments.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">Dr. {(a as any).doctor?.name}</TableCell>
                    <TableCell>{format(new Date(a.appointment_time), 'MMM d, yyyy · HH:mm')}</TableCell>
                    <TableCell><Badge variant={statusVariant[a.status] || 'outline'}>{a.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{a.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
