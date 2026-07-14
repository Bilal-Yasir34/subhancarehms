import type {
  Patient, Doctor, Appointment, Invoice, Department, ActivityItem, Notification,
} from '../types';

// Deterministic pseudo-random for stable mock data
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260714);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const pickN = <T,>(arr: T[], n: number): T[] =>
  [...arr].sort(() => rng() - 0.5).slice(0, n);
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

const FIRST_NAMES_M = ['James', 'Liam', 'Noah', 'Ethan', 'Lucas', 'Mason', 'Aiden', 'Daniel', 'Henry', 'Owen', 'Leo', 'Caleb', 'Adam', 'Marcus', 'Felix'];
const FIRST_NAMES_F = ['Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Amelia', 'Harper', 'Evelyn', 'Luna', 'Aria', 'Layla', 'Nora', 'Zoe', 'Maya', 'Chloe'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Patel', 'Kim', 'Chen', 'Wang', 'Nguyen', 'Khan', 'Singh'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Boston', 'Seattle', 'Miami', 'Denver', 'Atlanta'];
const STREETS = ['Maple Ave', 'Oak St', 'Pine Rd', 'Cedar Blvd', 'Elm Way', 'Birch Ln', 'Walnut Dr', 'Spruce Ct'];
const INSURERS = ['BlueShield', 'MediCare Plus', 'HealthGuard', 'VitaLife', 'CareSecure', 'GlobalHealth'];
const SPECIALTIES = [
  { name: 'Cardiologist', dept: 'Cardiology' },
  { name: 'Neurologist', dept: 'Neurology' },
  { name: 'Orthopedic Surgeon', dept: 'Orthopedics' },
  { name: 'Pediatrician', dept: 'Pediatrics' },
  { name: 'Dermatologist', dept: 'Dermatology' },
  { name: 'Oncologist', dept: 'Oncology' },
  { name: 'Radiologist', dept: 'Radiology' },
  { name: 'General Physician', dept: 'General Medicine' },
  { name: 'ENT Specialist', dept: 'ENT' },
  { name: 'Ophthalmologist', dept: 'Ophthalmology' },
  { name: 'Gynecologist', dept: 'Gynecology' },
  { name: 'Urologist', dept: 'Urology' },
];
const QUALIFICATIONS = ['MD, FACP', 'MD, PhD', 'MBBS, MS', 'MD, DM', 'MBBS, MD', 'MD, FRCS'];
const DOCTOR_FIRST = ['Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Linda', 'James', 'Maria', 'Kevin', 'Anna', 'Daniel', 'Sophia', 'Christopher', 'Olivia', 'Andrew', 'Rachel', 'Thomas'];
const DOCTOR_LAST = ['Chen', 'Patel', 'Rodriguez', 'Kim', 'Anderson', 'Martinez', 'Thompson', 'Garcia', 'Lee', 'Wang', 'Singh', 'Okafor', 'Müller', 'Rossi', 'Costa', 'Walsh'];

function avatar(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1f4e3,ffd5dc,ffdfbf`;
}

function dateStr(daysAgo: number) {
  const d = new Date('2026-07-14T10:00:00');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function futureDate(daysAhead: number) {
  const d = new Date('2026-07-14T10:00:00');
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

// ----- Departments -----
const DEPT_META: Record<string, { color: string; icon: string }> = {
  Cardiology: { color: '#ef4444', icon: 'Heart' },
  Neurology: { color: '#8b5cf6', icon: 'Brain' },
  Orthopedics: { color: '#f59e0b', icon: 'Bone' },
  Pediatrics: { color: '#22c55e', icon: 'Baby' },
  Dermatology: { color: '#ec4899', icon: 'Sparkles' },
  Oncology: { color: '#6366f1', icon: 'Ribbon' },
  Radiology: { color: '#06b6d4', icon: 'Scan' },
  Emergency: { color: '#dc2626', icon: 'Siren' },
  'General Medicine': { color: '#2563eb', icon: 'Stethoscope' },
  ENT: { color: '#14b8a6', icon: 'Ear' },
  Ophthalmology: { color: '#0ea5e9', icon: 'Eye' },
  Gynecology: { color: '#e11d48', icon: 'Flower' },
  Urology: { color: '#0891b2', icon: 'Droplets' },
};

// ----- Doctors -----
export const doctors: Doctor[] = Array.from({ length: 28 }, (_, i) => {
  const spec = SPECIALTIES[i % SPECIALTIES.length];
  const first = DOCTOR_FIRST[i % DOCTOR_FIRST.length];
  const last = DOCTOR_LAST[i % DOCTOR_LAST.length];
  const fullName = `${first} ${last}`;
  const statuses: Doctor['status'][] = ['available', 'busy', 'off-duty', 'on-leave'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    id: `doc_${String(i + 1).padStart(3, '0')}`,
    firstName: first,
    lastName: last,
    avatar: avatar(`doc-${fullName}`),
    specialty: spec.name,
    department: spec.dept,
    qualification: pick(QUALIFICATIONS),
    experienceYears: randInt(3, 28),
    rating: Number((3.8 + rng() * 1.2).toFixed(1)),
    phone: `+92 300 ${randInt(1000000, 9999999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@subhancare.med`,
    status: pick(statuses),
    room: `${pick(['A', 'B', 'C'])}-${randInt(100, 420)}`,
    fee: randInt(80, 450),
    schedule: pickN(days, randInt(4, 6)).map((day) => ({
      day,
      slots: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    })),
    patientsTreated: randInt(120, 2400),
  };
});

export const departments: Department[] = Object.entries(DEPT_META).map(([name, meta], i) => {
  const docs = doctors.filter((d) => d.department === name);
  return {
    id: `dept_${i}`,
    name,
    icon: meta.icon,
    head: docs[0] ? `Dr. ${docs[0].firstName} ${docs[0].lastName}` : '—',
    doctorsCount: docs.length,
    beds: randInt(20, 60),
    occupied: randInt(10, 50),
    color: meta.color,
  };
});

// ----- Patients -----
const DIAGNOSES = ['Hypertension', 'Type 2 Diabetes', 'Migraine', 'Asthma', 'Arthritis', 'Fracture', 'Pneumonia', 'Gastritis', 'Anemia', 'Hypothyroidism', 'Bronchitis', 'Appendicitis'];
const TREATMENTS = ['Prescribed medication', 'Physical therapy', 'Surgery scheduled', 'Lifestyle changes', 'Observation', 'Lab tests ordered', 'Follow-up in 2 weeks'];
const ALLERGIES = ['Penicillin', 'Peanuts', 'Latex', 'Aspirin', 'Sulfa drugs', 'None'];

export const patients: Patient[] = Array.from({ length: 48 }, (_, i) => {
  const gender: Patient['gender'] = rng() > 0.5 ? 'male' : 'female';
  const first = gender === 'male' ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
  const last = pick(LAST_NAMES);
  const fullName = `${first} ${last}`;
  const status: Patient['status'] = pick(['admitted', 'outpatient', 'discharged', 'emergency']);
  const dept = pick(Object.keys(DEPT_META));
  const dob = new Date(randInt(1940, 2010), randInt(0, 11), randInt(1, 28));
  const historyCount = randInt(1, 4);
  return {
    id: `pat_${String(i + 1).padStart(3, '0')}`,
    mrn: `MRN-${String(10000 + i).padStart(6, '0')}`,
    firstName: first,
    lastName: last,
    avatar: avatar(`pat-${fullName}-${i}`),
    dateOfBirth: dob.toISOString(),
    gender,
    bloodType: pick(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    phone: `+92 300 ${randInt(1000000, 9999999)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@mail.com`,
    address: `${randInt(100, 9999)} ${pick(STREETS)}`,
    city: pick(CITIES),
    status,
    department: dept,
    admittedOn: status === 'admitted' ? dateStr(randInt(0, 14)) : undefined,
    emergencyContact: {
      name: `${pick([...FIRST_NAMES_M, ...FIRST_NAMES_F])} ${pick(LAST_NAMES)}`,
      relation: pick(['Spouse', 'Parent', 'Sibling', 'Child', 'Guardian']),
      phone: `+92 300 ${randInt(1000000, 9999999)}`,
    },
    insurance: {
      provider: pick(INSURERS),
      policyNumber: `POL-${randInt(100000, 999999)}`,
      validTill: futureDate(randInt(30, 900)),
    },
    medicalHistory: Array.from({ length: historyCount }, (_, j) => ({
      id: `rec_${i}_${j}`,
      date: dateStr(randInt(30, 900)),
      diagnosis: pick(DIAGNOSES),
      treatment: pick(TREATMENTS),
      doctorName: `Dr. ${pick(DOCTOR_FIRST)} ${pick(DOCTOR_LAST)}`,
      notes: rng() > 0.6 ? 'Monitor vitals regularly. Patient responsive to treatment.' : undefined,
    })),
    allergies: pickN(ALLERGIES, randInt(0, 2)).filter((a) => a !== 'None'),
    createdAt: dateStr(randInt(1, 400)),
  };
});

// ----- Appointments -----
const APPT_TYPES: Appointment['type'][] = ['consultation', 'follow-up', 'emergency', 'surgery', 'checkup'];
// const APPT_STATUSES: Appointment['status'][] = ['scheduled', 'completed', 'cancelled', 'no-show', 'in-progress'];
const APPT_REASONS = ['Routine checkup', 'Chest pain evaluation', 'Follow-up consultation', 'Pre-surgery assessment', 'Post-op review', 'Lab result discussion', 'Vaccination', 'Chronic condition management'];

export const appointments: Appointment[] = Array.from({ length: 40 }, (_, i) => {
  const patient = patients[i % patients.length];
  const doctor = doctors[i % doctors.length];
  const dayOffset = i < 8 ? randInt(0, 1) : randInt(-20, 15);
  const d = new Date('2026-07-14T10:00:00');
  d.setDate(d.getDate() + dayOffset);
  const status: Appointment['status'] =
    dayOffset < 0 ? pick(['completed', 'cancelled', 'no-show']) :
    dayOffset === 0 ? pick(['scheduled', 'in-progress', 'completed']) :
    'scheduled';
  return {
    id: `apt_${String(i + 1).padStart(3, '0')}`,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientAvatar: patient.avatar,
    doctorId: doctor.id,
    doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
    department: doctor.department,
    date: d.toISOString(),
    time: pick(['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00']),
    durationMin: pick([15, 30, 30, 45, 60]),
    status,
    type: pick(APPT_TYPES),
    reason: pick(APPT_REASONS),
    room: doctor.room,
  };
});

// ----- Invoices -----
const INVOICE_ITEMS_POOL = [
  { description: 'Consultation Fee', category: 'Consultation', unitPrice: 150 },
  { description: 'ECG Test', category: 'Diagnostics', unitPrice: 220 },
  { description: 'Blood Test (CBC)', category: 'Laboratory', unitPrice: 85 },
  { description: 'X-Ray Chest', category: 'Radiology', unitPrice: 180 },
  { description: 'MRI Scan', category: 'Radiology', unitPrice: 1200 },
  { description: 'Room Charges (per day)', category: 'Room', unitPrice: 350 },
  { description: 'Surgical Procedure', category: 'Procedure', unitPrice: 4500 },
  { description: 'Physiotherapy Session', category: 'Therapy', unitPrice: 120 },
  { description: 'Medication - IV', category: 'Pharmacy', unitPrice: 95 },
  { description: 'Ultrasound', category: 'Radiology', unitPrice: 280 },
  { description: 'Vaccination', category: 'Pharmacy', unitPrice: 60 },
  { description: 'Emergency Service', category: 'Emergency', unitPrice: 500 },
];

export const invoices: Invoice[] = Array.from({ length: 35 }, (_, i) => {
  const patient = patients[i % patients.length];
  const itemCount = randInt(2, 5);
  const items = pickN(INVOICE_ITEMS_POOL, itemCount).map((it, j) => ({
    id: `item_${i}_${j}`,
    description: it.description,
    category: it.category,
    quantity: randInt(1, 3),
    unitPrice: it.unitPrice,
  }));
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const taxRate = 8;
  const tax = Math.round(subtotal * (taxRate / 100));
  const discount = rng() > 0.7 ? randInt(50, 200) : 0;
  const total = subtotal + tax - discount;
  const status: Invoice['status'] = pick(['paid', 'pending', 'overdue', 'partially-paid']);
  const amountPaid = status === 'paid' ? total : status === 'partially-paid' ? Math.round(total * 0.5) : 0;
  return {
    id: `inv_${String(i + 1).padStart(3, '0')}`,
    invoiceNumber: `INV-2026-${String(i + 1).padStart(4, '0')}`,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientAvatar: patient.avatar,
    date: dateStr(randInt(0, 120)),
    dueDate: dateStr(randInt(-10, 30)),
    items,
    subtotal,
    taxRate,
    tax,
    discount,
    total,
    amountPaid,
    status,
    paymentMethod: status === 'paid' || status === 'partially-paid' ? pick(['cash', 'card', 'insurance', 'online', 'upi']) : undefined,
    notes: rng() > 0.8 ? 'Payment due within 30 days of invoice date.' : undefined,
  };
});

// ----- Activity Timeline -----
export const activities: ActivityItem[] = [
  { id: 'a1', type: 'appointment', title: 'New appointment booked', description: 'Sarah Chen scheduled with Dr. Patel — Cardiology', time: dateStr(0), user: 'Maya R.', avatar: avatar('maya') },
  { id: 'a2', type: 'admission', title: 'Patient admitted', description: 'James Wilson admitted to Emergency ward', time: dateStr(0), user: 'System', avatar: avatar('sys') },
  { id: 'a3', type: 'payment', title: 'Invoice paid', description: 'INV-2026-0018 settled via card — $1,840.00', time: dateStr(0), user: 'Billing', avatar: avatar('bill') },
  { id: 'a4', type: 'lab', title: 'Lab results ready', description: 'CBC panel results uploaded for MRN-000012', time: dateStr(1), user: 'Lab Bot', avatar: avatar('lab') },
  { id: 'a5', type: 'discharge', title: 'Patient discharged', description: 'Emma Davis discharged from Orthopedics', time: dateStr(1), user: 'Dr. Lee', avatar: avatar('lee') },
  { id: 'a6', type: 'doctor', title: 'Doctor on leave', description: 'Dr. Robert Anderson on leave until Jul 18', time: dateStr(2), user: 'HR', avatar: avatar('hr') },
  { id: 'a7', type: 'appointment', title: 'Appointment completed', description: 'Liam Garcia completed checkup with Dr. Kim', time: dateStr(2), user: 'Dr. Kim', avatar: avatar('kim') },
];

// ----- Notifications -----
export const notifications: Notification[] = [
  { id: 'n1', title: 'Emergency case incoming', message: 'Ambulance ETA 8 minutes — Trauma unit standby', time: dateStr(0), read: false, type: 'error' },
  { id: 'n2', title: 'Lab results delayed', message: 'MRI queue is backed up by 40 minutes', time: dateStr(0), read: false, type: 'warning' },
  { id: 'n3', title: 'New patient registered', message: 'Olivia Martinez added to General Medicine', time: dateStr(0), read: false, type: 'success' },
  { id: 'n4', title: 'Inventory restock needed', message: 'Surgical gloves below threshold (120 units)', time: dateStr(1), read: true, type: 'warning' },
  { id: 'n5', title: 'Weekly report ready', message: 'Patient throughput report for Jul 8–14 is available', time: dateStr(1), read: true, type: 'info' },
];

// ----- Dashboard chart data -----
export const revenueData = [
  { month: 'Jan', revenue: 284000, expenses: 198000 },
  { month: 'Feb', revenue: 312000, expenses: 205000 },
  { month: 'Mar', revenue: 298000, expenses: 210000 },
  { month: 'Apr', revenue: 356000, expenses: 228000 },
  { month: 'May', revenue: 392000, expenses: 241000 },
  { month: 'Jun', revenue: 418000, expenses: 255000 },
  { month: 'Jul', revenue: 445000, expenses: 262000 },
];

export const patientFlowData = [
  { day: 'Mon', admitted: 24, discharged: 18 },
  { day: 'Tue', admitted: 31, discharged: 22 },
  { day: 'Wed', admitted: 28, discharged: 25 },
  { day: 'Thu', admitted: 35, discharged: 20 },
  { day: 'Fri', admitted: 42, discharged: 30 },
  { day: 'Sat', admitted: 26, discharged: 28 },
  { day: 'Sun', admitted: 18, discharged: 15 },
];

export const departmentDistribution = Object.entries(DEPT_META).slice(0, 8).map(([name, meta]) => ({
  name,
  value: patients.filter((p) => p.department === name).length + randInt(8, 40),
  color: meta.color,
}));

export const appointmentTypeData = [
  { name: 'Consultation', value: 145, color: '#2563eb' },
  { name: 'Follow-up', value: 82, color: '#06b6d4' },
  { name: 'Emergency', value: 38, color: '#ef4444' },
  { name: 'Checkup', value: 64, color: '#22c55e' },
  { name: 'Surgery', value: 21, color: '#f59e0b' },
];
