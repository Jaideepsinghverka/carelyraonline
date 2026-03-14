import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Fetch user roles to determine redirect
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', authUser.id);
        const isPatient = roles?.some(r => r.role === 'patient');
        if (isPatient) {
          // Get hospital slug for patient redirect
          const { data: profile } = await supabase.from('profiles').select('hospital_id').eq('id', authUser.id).single();
          if (profile) {
            const { data: hospital } = await supabase.from('hospitals').select('slug').eq('id', profile.hospital_id).single();
            if (hospital) {
              navigate(`/h/${hospital.slug}/dashboard`);
              return;
            }
          }
        }
      }
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-heading">HospitalFlow</CardTitle>
            <CardDescription>Sign in to your hospital dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="doctor@hospital.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary hover:underline">Sign up</a>
            </p>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">patients</span></div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Are you a patient? Use the unique hospital link provided by your hospital to register and book appointments.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
