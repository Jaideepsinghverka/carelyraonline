import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Copy, Users, Stethoscope, CalendarDays, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Hospital } from '@/types/database';

interface HospitalWithStats extends Hospital {
  patient_count?: number;
  doctor_count?: number;
  appointment_count?: number;
}

export default function MasterPanelPage() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const [hospitals, setHospitals] = useState<HospitalWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '' });
  const [adminForm, setAdminForm] = useState({ hospital_id: '', name: '', email: '', password: '' });
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = hasRole('super_admin');

  const fetchHospitals = async () => {
    const { data, error } = await supabase.from('hospitals').select('*');
    if (error) {
      console.error(error);
      return;
    }
    
    // Fetch stats for each hospital
    const hospitalsWithStats: HospitalWithStats[] = await Promise.all(
      (data as Hospital[]).map(async (h) => {
        const [patients, doctors, appointments] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }).eq('hospital_id', h.id),
          supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('hospital_id', h.id),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('hospital_id', h.id),
        ]);
        return {
          ...h,
          patient_count: patients.count || 0,
          doctor_count: doctors.count || 0,
          appointment_count: appointments.count || 0,
        };
      })
    );
    
    setHospitals(hospitalsWithStats);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && isSuperAdmin) fetchHospitals();
  }, [authLoading, isSuperAdmin]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const slug = form.slug || generateSlug(form.name);
    const { error } = await supabase.from('hospitals').insert({
      name: form.name,
      slug,
      address: form.address || null,
      phone: form.phone || null,
    } as any);

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success(`Hospital "${form.name}" created!`);
    setForm({ name: '', slug: '', address: '', phone: '' });
    setDialogOpen(false);
    setSubmitting(false);
    fetchHospitals();
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Create user via auth signup
    const { data, error } = await supabase.auth.signUp({
      email: adminForm.email,
      password: adminForm.password,
      options: {
        data: {
          name: adminForm.name,
          hospital_id: adminForm.hospital_id,
          role: 'admin',
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success(`Admin "${adminForm.name}" created and assigned!`);
    setAdminForm({ hospital_id: '', name: '', email: '', password: '' });
    setAdminDialogOpen(false);
    setSubmitting(false);
  };

  const handleDeleteHospital = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove all associated data.`)) return;
    
    const { error } = await supabase.from('hospitals').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Hospital "${name}" deleted.`);
    fetchHospitals();
  };

  const copyPatientUrl = (slug: string) => {
    const url = `${window.location.origin}/h/${slug}/signup`;
    navigator.clipboard.writeText(url);
    toast.success('Patient URL copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Master Panel</h1>
          <p className="text-muted-foreground mt-1">Manage all hospitals on the platform</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Users className="h-4 w-4 mr-2" /> Assign Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Hospital Admin</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssignAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Hospital</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={adminForm.hospital_id}
                    onChange={e => setAdminForm(f => ({ ...f, hospital_id: e.target.value }))}
                    required
                  >
                    <option value="">Select hospital...</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Admin Name</Label>
                  <Input value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} required placeholder="admin@hospital.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} required minLength={6} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Admin Account'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Hospital</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Onboard New Hospital</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateHospital} className="space-y-4">
                <div className="space-y-2">
                  <Label>Hospital Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} required placeholder="City General Hospital" />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required placeholder="city-general" />
                  <p className="text-xs text-muted-foreground">
                    Patient URL: {window.location.origin}/h/{form.slug || '...'}/signup
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Medical Drive" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Hospital'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-foreground">Loading hospitals...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Hospitals ({hospitals.length})
            </CardTitle>
            <CardDescription>All onboarded hospitals and their stats</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Doctors</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hospitals.map(h => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.address || 'No address'}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{h.slug}</Badge></TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {h.patient_count}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {h.doctor_count}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {h.appointment_count}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Copy patient URL" onClick={() => copyPatientUrl(h.slug)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete hospital" onClick={() => handleDeleteHospital(h.id, h.name)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {hospitals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hospitals onboarded yet. Click "Add Hospital" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
