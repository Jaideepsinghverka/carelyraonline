import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { Hospital } from '@/types/database';

export default function HospitalPatientSignupPage() {
  const { slug } = useParams<{ slug: string }>();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', date_of_birth: '', gender: 'male',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHospital = async () => {
      const { data, error } = await supabase.from('hospitals').select('*').eq('slug', slug).single();
      if (error || !data) {
        setNotFound(true);
      } else {
        setHospital(data as Hospital);
      }
      setLoading(false);
    };
    fetchHospital();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;
    setError('');
    setSubmitting(true);

    const { error: signUpError } = await signUp(form.email, form.password, {
      name: form.name,
      hospital_id: hospital.id,
      role: 'patient',
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // Try to create patient record immediately if session is available
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('patients').insert({
        hospital_id: hospital.id,
        name: form.name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        user_id: session.user.id,
      } as any);
      toast.success('Account created! You can now book appointments.');
      navigate(`/h/${slug}/dashboard`);
    } else {
      // Email confirmation required — show message
      toast.success('Account created! Please check your email to confirm, then log in to book appointments.');
      navigate('/login');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <h2 className="text-2xl font-heading font-bold text-foreground">Hospital Not Found</h2>
            <p className="text-muted-foreground">The hospital link you followed doesn't exist. Please check the URL and try again.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
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
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-heading">Patient Registration</CardTitle>
            <CardDescription>{hospital?.name} — Register to book an appointment</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register & Book Appointment'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
