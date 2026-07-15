import type { UserRole } from '../types';

export const APP_NAME = 'Subhan Care Clinic';
export const APP_TAGLINE = 'Hospital Management System';

export const DEFAULT_PAGE_SIZE = 8;

export type NavItem = { label: string; path: string; icon: string; roles: UserRole[] };

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'doctor', 'general_staff', 'patient'] },
  { label: 'Request Appointment', path: '/request-appointment', icon: 'CalendarDays', roles: ['patient'] },
  { label: 'Medical History', path: '/medical-history', icon: 'HeartPulse', roles: ['patient'] },
  { label: 'Patients', path: '/patients', icon: 'Users', roles: ['admin'] },
  { label: 'Doctors', path: '/doctors', icon: 'Stethoscope', roles: ['admin'] },
  { label: 'Appointments', path: '/appointments', icon: 'CalendarDays', roles: ['admin', 'doctor'] },
  { label: 'Billing', path: '/billing', icon: 'ReceiptText', roles: ['admin', 'patient'] },
  { label: 'Inventory', path: '/inventory', icon: 'Package', roles: ['general_staff'] },
  { label: 'Pharmacy', path: '/pharmacy', icon: 'Pill', roles: ['general_staff'] },
  { label: 'Blood Bank', path: '/blood-bank', icon: 'Droplets', roles: ['general_staff'] },
  { label: 'Reports', path: '/reports', icon: 'BarChart3', roles: ['admin'] },
  { label: 'Staff', path: '/staff', icon: 'UserCog', roles: ['admin'] },
  { label: 'Register User', path: '/register-user', icon: 'UserPlus', roles: ['admin'] },
  { label: 'My Patients', path: '/my-patients', icon: 'HeartPulse', roles: ['doctor'] },
  { label: 'My Schedule', path: '/my-schedule', icon: 'CalendarClock', roles: ['doctor'] },
  { label: 'Notifications', path: '/notifications', icon: 'Bell', roles: ['admin', 'doctor', 'general_staff', 'patient'] },
  { label: 'Settings', path: '/settings', icon: 'Settings', roles: ['admin', 'doctor', 'general_staff', 'patient'] },
];

export const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
  'Oncology', 'Radiology', 'Emergency', 'General Medicine', 'Psychiatry',
  'ENT', 'Ophthalmology', 'Gynecology', 'Urology', 'Dental',
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Full access to all modules' },
  { value: 'doctor', label: 'Doctor', description: 'Patient care & appointments' },
  { value: 'general_staff', label: 'General Staff', description: 'Inventory & blood bank management' },
  { value: 'patient', label: 'Patient', description: 'View own records & appointments' },
] as const;

export const STORAGE_KEYS = {
  THEME: 'subhancare_theme',
} as const;

export const INVENTORY_CATEGORIES = [
  'Equipment', 'Supplies', 'Lab Reagent',
];

export const PHARMACY_CATEGORIES = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other',
];

export const CURRENCY = 'PKR';
export const CURRENCY_SYMBOL = 'Rs.';
