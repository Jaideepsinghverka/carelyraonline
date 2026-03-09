import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Hospital and account settings</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Hospital Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Hospital Name</p>
              <p className="font-medium">{user?.hospital?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{user?.hospital?.address || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user?.hospital?.phone || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.profile.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role(s)</p>
              <p className="font-medium capitalize">{user?.roles.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
