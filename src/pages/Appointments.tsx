import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Appointment, Doctor } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_time: '', notes: '' });

  const fetchAll = useCallback(async () => {
    const [apptRes, docRes, patRes] = await Promise.all([
      supabase.from('appointments').select('*, patient:patients(name), doctor:doctors(name, specialization)').order('appointment_time', { ascending: true }),
      supabase.from('doctors').select('*'),
      supabase.from('patients').select('id, name'),
    ]);
    setAppointments(apptRes.data || []);
    setDoctors(docRes.data || []);
    setPatients(patRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('appointments').insert({
      patient_id: form.patient_id,
      doctor_id: form.doctor_id,
      appointment_time: form.appointment_time,
      notes: form.notes || null,
      hospital_id: user.profile.hospital_id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Appointment scheduled');
    setDialogOpen(false);
    setForm({ patient_id: '', doctor_id: '', appointment_time: '', notes: '' });
    fetchAll();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to ${status}`);
    fetchAll();
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-warning/10 text-warning',
    checked_in: 'bg-info/10 text-info',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
    no_show: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Appointments</h1>
          <p className="text-muted-foreground text-sm">{appointments.length} total</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Appointment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Doctor *</Label>
                <Select value={form.doctor_id} onValueChange={v => setForm(f => ({ ...f, doctor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialization}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full">Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No appointments.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="hidden md:table-cell">Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{(a as any).patient?.name}</TableCell>
                    <TableCell>Dr. {(a as any).doctor?.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(a.appointment_time), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] || ''}`}>{a.status}</span>
                    </TableCell>
                    <TableCell>
                      <Select value={a.status} onValueChange={v => updateStatus(a.id, v)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['scheduled','checked_in','completed','cancelled','no_show'].map(s =>
                            <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
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
