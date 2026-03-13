import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  BarChart3, Settings, Activity, LogOut, Building2,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Master Panel', url: '/master', icon: Building2, roles: ['super_admin'] },
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'receptionist', 'doctor', 'super_admin'] },
  { title: 'Patients', url: '/patients', icon: Users, roles: ['admin', 'receptionist', 'doctor', 'super_admin'] },
  { title: 'Appointments', url: '/appointments', icon: CalendarDays, roles: ['admin', 'receptionist', 'doctor', 'super_admin'] },
  { title: 'Doctors', url: '/doctors', icon: Stethoscope, roles: ['admin'] },
  { title: 'Reports', url: '/reports', icon: BarChart3, roles: ['admin'] },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item =>
    item.roles.some(r => user?.roles.includes(r as any))
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                <Activity className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              {!collapsed && <span className="font-heading text-base font-semibold text-sidebar-foreground">HospitalFlow</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.profile.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.roles.join(', ')}</p>
          </div>
        )}
        <Button variant="ghost" size={collapsed ? 'icon' : 'default'} className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
