export type UserRole = 'admin' | 'doctor' | 'general_staff' | 'receptionist' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  doctorId?: string;
  patientId?: string;
  department?: string;
  phone?: string;
}

export type PatientStatus = 'admitted' | 'outpatient' | 'discharged' | 'emergency';
export type Gender = 'male' | 'female' | 'other';

export interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  doctorName: string;
  notes?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  avatar: string;
  dateOfBirth: string;
  gender: Gender;
  bloodType: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: PatientStatus;
  department: string;
  admittedOn?: string;
  emergencyContact: { name: string; relation: string; phone: string };
  insurance: { provider: string; policyNumber: string; validTill: string };
  medicalHistory: MedicalRecord[];
  allergies: string[];
  createdAt: string;
}

export type DoctorStatus = 'available' | 'busy' | 'off-duty' | 'on-leave';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  specialty: string;
  department: string;
  qualification: string;
  experienceYears: number;
  rating: number;
  phone: string;
  email: string;
  status: DoctorStatus;
  room: string;
  fee: number;
  schedule: { day: string; slots: { start: string; end: string }[] }[];
  patientsTreated: number;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'in-progress';
export type AppointmentType = 'consultation' | 'follow-up' | 'emergency' | 'surgery' | 'checkup';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  durationMin: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  room: string;
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'partially-paid';
export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'online' | 'upi';

export interface InvoiceItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  head: string;
  doctorsCount: number;
  beds: number;
  occupied: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'appointment' | 'admission' | 'discharge' | 'payment' | 'doctor' | 'lab';
  title: string;
  description: string;
  time: string;
  user: string;
  avatar: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitPrice: number;
  supplier?: string;
  expiryDate?: string;
  location?: string;
  createdAt: string;
}

export interface BloodBankStock {
  id: string;
  bloodType: string;
  unitsAvailable: number;
  reorderLevel: number;
  location?: string;
  updatedAt: string;
}

export interface StaffProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  doctorId?: string;
  patientId?: string;
  department?: string;
  active: boolean;
  createdAt: string;
}
