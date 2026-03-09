export type AppRole = 'admin' | 'receptionist' | 'doctor';

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  hospital_id: string;
  name: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  user_id: string | null;
  name: string;
  specialization: string | null;
  availability_json: Record<string, string[]>;
  created_at: string;
}

export interface Patient {
  id: string;
  hospital_id: string;
  name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export type AppointmentStatus = 'scheduled' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  // Joined
  patient?: Patient;
  doctor?: Doctor;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  roles: AppRole[];
  hospital: Hospital | null;
}
