import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import DashboardPage from "@/pages/Dashboard";
import PatientsPage from "@/pages/Patients";
import PatientDetailPage from "@/pages/PatientDetail";
import AppointmentsPage from "@/pages/Appointments";
import DoctorsPage from "@/pages/Doctors";
import ReportsPage from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";
import MasterPanelPage from "@/pages/MasterPanel";
import PatientSignupPage from "@/pages/PatientSignup";
import PatientBookAppointmentPage from "@/pages/PatientBookAppointment";
import HospitalPatientSignupPage from "@/pages/HospitalPatientSignup";
import HospitalBookAppointmentPage from "@/pages/HospitalBookAppointment";
import PatientDashboardPage from "@/pages/PatientDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            {/* Legacy patient routes (hardcoded hospital) */}
            <Route path="/patient/signup" element={<PatientSignupPage />} />
            <Route path="/patient/book" element={<PatientBookAppointmentPage />} />
            {/* Hospital-specific patient routes */}
            <Route path="/h/:slug/signup" element={<HospitalPatientSignupPage />} />
            <Route path="/h/:slug/book" element={<HospitalBookAppointmentPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/doctors" element={<ProtectedRoute allowedRoles={['admin']}><DoctorsPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
              <Route path="/master" element={<ProtectedRoute allowedRoles={['super_admin']}><MasterPanelPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
