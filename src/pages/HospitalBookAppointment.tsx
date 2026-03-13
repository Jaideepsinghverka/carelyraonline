import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Hospital } from '@/types/database';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

export default function HospitalBookAppointmentPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [form, setForm] = useState({ doctor_id: '', appointment_time: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
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
    if (authLoading || !hospital) return;
    if (!user) {
      navigate(`/h/${slug}/signup`);
      return;
    }

    const fetchData = async () => {
      const [docRes, patRes] = await Promise.all([
        supabase.from('doctors').select('id, name, specialization').eq('hospital_id', hospital.id),
        supabase.from('patients').select('id').eq('hospital_id', hospital.id).eq('name', user.profile.name).limit(1),
      ]);
      setDoctors((docRes.data as Doctor[]) || []);
      if (patRes.data && patRes.data.length > 0) {
        setPatientId(patRes.data[0].id);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, hospital, slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientId || !hospital) {
      toast.error('Patient record not found. Please contact the hospital.');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: form.doctor_id,
      appointment_time: form.appointment_time,
      notes: form.notes || null,
      hospital_id: hospital.id,
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    setBooked(true);
    toast.success('Appointment booked successfully!');
  };

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
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  if (booked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-fade-in text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold">Appointment Booked!</h2>
            <p className="text-muted-foreground">Your appointment at {hospital?.name} has been scheduled.</p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => { setBooked(false); setForm({ doctor_id: '', appointment_time: '', notes: '' }); }}>
                Book Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <CalendarDays className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-heading">Book Appointment</CardTitle>
            <CardDescription>{hospital?.name} — Welcome, {user?.profile.name}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select value={form.doctor_id} onValueChange={v => setForm(f => ({ ...f, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Date & Time *</Label>
              <Input type="datetime-local" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} required min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div className="space-y-2">
              <Label>Notes / Reason for visit</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief description of your concern..." rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !form.doctor_id}>
              {submitting ? 'Booking...' : 'Book Appointment'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to={`/h/${slug}/signup`} className="text-primary hover:underline">← Back</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
