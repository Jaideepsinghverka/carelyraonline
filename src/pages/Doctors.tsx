import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Doctor } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorsPage() {
  const { user, hasRole } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', specialization: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    const { data } = await supabase.from('doctors').select('*').order('name');
    setDoctors((data as unknown as Doctor[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = { name: form.name, specialization: form.specialization || null, hospital_id: user.profile.hospital_id };

    if (editingId) {
      const { error } = await supabase.from('doctors').update(payload).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Doctor updated');
    } else {
      const { error } = await supabase.from('doctors').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Doctor added');
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm({ name: '', specialization: '' });
    fetchDoctors();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Doctors</h1>
          <p className="text-muted-foreground text-sm">{doctors.length} doctors</p>
        </div>
        {hasRole('admin') && (
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm({ name: '', specialization: '' }); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Add Doctor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Doctor</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full">{editingId ? 'Update' : 'Add'} Doctor</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  {hasRole('admin') && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">Dr. {d.name}</TableCell>
                    <TableCell>{d.specialization || '—'}</TableCell>
                    {hasRole('admin') && (
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(d.id); setForm({ name: d.name, specialization: d.specialization || '' }); setDialogOpen(true); }}>Edit</Button>
                      </TableCell>
                    )}
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
