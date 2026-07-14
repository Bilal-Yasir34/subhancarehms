import { supabase } from './supabase';
import type {
  Patient, Doctor, Appointment, Invoice, Department, ActivityItem, Notification,
  UserRole, StaffProfile, InventoryItem, MedicalRecord, BloodBankStock,
} from '../types';
// utils import removed

// ---- DB row → domain object mappers ----

function mapDoctor(row: any): Doctor {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.avatar,
    specialty: row.specialty,
    department: row.department,
    qualification: row.qualification,
    experienceYears: row.experience_years,
    rating: Number(row.rating),
    phone: row.phone,
    email: row.email,
    status: row.status,
    room: row.room,
    fee: Number(row.fee),
    schedule: row.schedule ?? [],
    patientsTreated: row.patients_treated,
  };
}

function mapPatient(row: any, records?: MedicalRecord[]): Patient {
  return {
    id: row.id,
    mrn: row.mrn,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.avatar,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    bloodType: row.blood_type,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    status: row.status,
    department: row.department,
    admittedOn: row.admitted_on,
    emergencyContact: row.emergency_contact ?? { name: '', relation: '', phone: '' },
    insurance: row.insurance
      ? { provider: row.insurance.provider ?? '', policyNumber: row.insurance.policy_number ?? '', validTill: row.insurance.valid_till ?? '' }
      : { provider: '', policyNumber: '', validTill: '' },
    medicalHistory: records ?? [],
    allergies: row.allergies ?? [],
    createdAt: row.created_at,
  };
}

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientAvatar: row.patient_avatar,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    department: row.department,
    date: row.date,
    time: row.time,
    durationMin: row.duration_min,
    status: row.status,
    type: row.type,
    reason: row.reason,
    room: row.room,
  };
}

function mapInvoice(row: any): Invoice {
  const items = (row.items ?? [])
    .filter((it: any) => it !== null && it !== undefined)
    .map((it: any) => ({
      id: it.id,
      description: it.description,
      category: it.category,
      quantity: it.quantity,
      unitPrice: Number(it.unit_price),
    }));
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientAvatar: row.patient_avatar,
    date: row.date,
    dueDate: row.due_date,
    items,
    subtotal: Number(row.subtotal),
    taxRate: row.tax_rate,
    tax: Number(row.tax),
    discount: Number(row.discount),
    total: Number(row.total),
    amountPaid: Number(row.amount_paid),
    status: row.status,
    paymentMethod: row.payment_method,
    notes: row.notes,
  };
}

// ---- domain → DB row mappers ----

function patientToRow(data: Partial<Patient>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.firstName !== undefined) row.first_name = data.firstName;
  if (data.lastName !== undefined) row.last_name = data.lastName;
  if (data.dateOfBirth !== undefined) row.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) row.gender = data.gender;
  if (data.bloodType !== undefined) row.blood_type = data.bloodType;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.email !== undefined) row.email = data.email;
  if (data.address !== undefined) row.address = data.address;
  if (data.city !== undefined) row.city = data.city;
  if (data.status !== undefined) row.status = data.status;
  if (data.department !== undefined) row.department = data.department;
  if (data.admittedOn !== undefined) row.admitted_on = data.admittedOn;
  if (data.emergencyContact !== undefined) {
    row.emergency_contact = {
      name: data.emergencyContact.name,
      relation: data.emergencyContact.relation,
      phone: data.emergencyContact.phone,
    };
  }
  if (data.insurance !== undefined) {
    row.insurance = {
      provider: data.insurance.provider,
      policy_number: data.insurance.policyNumber,
      valid_till: data.insurance.validTill,
    };
  }
  if (data.allergies !== undefined) row.allergies = data.allergies;
  return row;
}

function doctorToRow(data: Partial<Doctor>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.firstName !== undefined) row.first_name = data.firstName;
  if (data.lastName !== undefined) row.last_name = data.lastName;
  if (data.avatar !== undefined) row.avatar = data.avatar;
  if (data.specialty !== undefined) row.specialty = data.specialty;
  if (data.department !== undefined) row.department = data.department;
  if (data.qualification !== undefined) row.qualification = data.qualification;
  if (data.experienceYears !== undefined) row.experience_years = data.experienceYears;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.email !== undefined) row.email = data.email;
  if (data.status !== undefined) row.status = data.status;
  if (data.room !== undefined) row.room = data.room;
  if (data.fee !== undefined) row.fee = data.fee;
  if (data.schedule !== undefined) row.schedule = data.schedule;
  return row;
}

function appointmentToRow(data: Partial<Appointment>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.patientId !== undefined) row.patient_id = data.patientId;
  if (data.patientName !== undefined) row.patient_name = data.patientName;
  if (data.patientAvatar !== undefined) row.patient_avatar = data.patientAvatar;
  if (data.doctorId !== undefined) row.doctor_id = data.doctorId;
  if (data.doctorName !== undefined) row.doctor_name = data.doctorName;
  if (data.department !== undefined) row.department = data.department;
  if (data.date !== undefined) row.date = data.date;
  if (data.time !== undefined) row.time = data.time;
  if (data.durationMin !== undefined) row.duration_min = data.durationMin;
  if (data.status !== undefined) row.status = data.status;
  if (data.type !== undefined) row.type = data.type;
  if (data.reason !== undefined) row.reason = data.reason;
  if (data.room !== undefined) row.room = data.room;
  return row;
}

function invoiceToRow(data: Partial<Invoice>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.patientId !== undefined) row.patient_id = data.patientId;
  if (data.patientName !== undefined) row.patient_name = data.patientName;
  if (data.patientAvatar !== undefined) row.patient_avatar = data.patientAvatar;
  if (data.items !== undefined) {
    row.items = data.items.map((it) => ({
      id: it.id,
      description: it.description,
      category: it.category,
      quantity: it.quantity,
      unit_price: it.unitPrice,
    }));
  }
  if (data.discount !== undefined) row.discount = data.discount;
  if (data.notes !== undefined) row.notes = data.notes;
  return row;
}

function mapInventoryItem(row: any): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sku: row.sku,
    quantity: row.quantity,
    unit: row.unit,
    reorderLevel: row.reorder_level,
    unitPrice: Number(row.unit_price),
    supplier: row.supplier,
    expiryDate: row.expiry_date,
    location: row.location,
    createdAt: row.created_at,
  };
}

function inventoryItemToRow(data: Partial<InventoryItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.category !== undefined) row.category = data.category;
  if (data.sku !== undefined) row.sku = data.sku;
  if (data.quantity !== undefined) row.quantity = data.quantity;
  if (data.unit !== undefined) row.unit = data.unit;
  if (data.reorderLevel !== undefined) row.reorder_level = data.reorderLevel;
  if (data.unitPrice !== undefined) row.unit_price = data.unitPrice;
  if (data.supplier !== undefined) row.supplier = data.supplier;
  if (data.expiryDate !== undefined) row.expiry_date = data.expiryDate;
  if (data.location !== undefined) row.location = data.location;
  return row;
}

function mapBloodBankStock(row: any): BloodBankStock {
  return {
    id: row.id,
    bloodType: row.blood_type,
    unitsAvailable: row.units_available,
    reorderLevel: row.reorder_level,
    location: row.location,
    updatedAt: row.updated_at,
  };
}

function mapStaffProfile(row: any): StaffProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email ?? '',
    role: row.role,
    phone: row.phone,
    avatar: row.avatar,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    department: row.department,
    active: row.active,
    createdAt: row.created_at,
  };
}

export const api = {

  // ----- Patients -----
  async getPatients(params?: { page?: number; pageSize?: number; search?: string; status?: string; department?: string }): Promise<{ items: Patient[]; total: number }> {
    let query = supabase.from('patients').select('*', { count: 'exact' });
    if (params?.search) {
      const q = params.search;
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,mrn.ilike.%${q}%,email.ilike.%${q}%`);
    }
    if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
    if (params?.department && params.department !== 'all') query = query.eq('department', params.department);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data ?? []).map((r) => mapPatient(r)), total: count ?? 0 };
  },

  async getPatient(id: string): Promise<Patient | null> {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: recs } = await supabase
      .from('medical_records').select('*').eq('patient_id', id).order('date', { ascending: false });
    const records: MedicalRecord[] = (recs ?? []).map((r) => ({
      id: r.id, date: r.date, diagnosis: r.diagnosis, treatment: r.treatment, doctorName: r.doctor_name, notes: r.notes,
    }));
    return mapPatient(data, records);
  },

  async createPatient(data: Partial<Patient>): Promise<Patient> {
    const mrn = `MRN-${String(10000 + Math.floor(Math.random() * 90000)).padStart(6, '0')}`;
    const row = {
      ...patientToRow(data),
      mrn,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}-${data.lastName}`,
      allergies: data.allergies ?? [],
    };
    const { data: result, error } = await supabase.from('patients').insert(row).select().single();
    if (error) throw error;
    return mapPatient(result);
  },

  async updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    const { error } = await supabase.from('patients').update(patientToRow(data)).eq('id', id);
    if (error) throw error;
  },

  async deletePatient(id: string): Promise<void> {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadReportPdf(file: File): Promise<string> {
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage
      .from('medical-reports')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      console.warn('Storage upload error, fallback to URL:', error.message);
      return URL.createObjectURL(file);
    }
    const { data: publicUrlData } = supabase.storage.from('medical-reports').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  },

  async createMedicalRecord(data: { patientId: string; diagnosis: string; treatment: string; doctorName: string; notes?: string }): Promise<void> {
    const { error } = await supabase.from('medical_records').insert({
      id: crypto.randomUUID(),
      patient_id: data.patientId,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      doctor_name: data.doctorName,
      notes: data.notes ?? null,
      date: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async deleteMedicalRecord(id: string): Promise<void> {
    const { error } = await supabase.from('medical_records').delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Doctors -----
  async getDoctors(params?: { page?: number; pageSize?: number; search?: string; department?: string; status?: string }): Promise<{ items: Doctor[]; total: number }> {
    let query = supabase.from('doctors').select('*', { count: 'exact' });
    if (params?.search) {
      const q = params.search;
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,specialty.ilike.%${q}%,department.ilike.%${q}%`);
    }
    if (params?.department && params.department !== 'all') query = query.eq('department', params.department);
    if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data ?? []).map(mapDoctor), total: count ?? 0 };
  },

  async getDoctor(id: string): Promise<Doctor | null> {
    const { data, error } = await supabase.from('doctors').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapDoctor(data) : null;
  },

  async createDoctor(data: Partial<Doctor>): Promise<Doctor> {
    const row = {
      ...doctorToRow(data),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}-${data.lastName}`,
      rating: 4.5,
      schedule: data.schedule ?? [],
      patients_treated: 0,
    };
    const { data: result, error } = await supabase.from('doctors').insert(row).select().single();
    if (error) throw error;
    return mapDoctor(result);
  },

  async updateDoctor(id: string, data: Partial<Doctor>): Promise<void> {
    const { error } = await supabase.from('doctors').update(doctorToRow(data)).eq('id', id);
    if (error) throw error;
  },

  async deleteDoctor(id: string): Promise<void> {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Appointments -----
  async getAppointments(params?: { page?: number; pageSize?: number; search?: string; status?: string; date?: string; doctorId?: string; patientId?: string }): Promise<{ items: Appointment[]; total: number }> {
    let query = supabase.from('appointments').select('*', { count: 'exact' });
    if (params?.patientId) query = query.eq('patient_id', params.patientId);
    if (params?.search) {
      const q = params.search;
      query = query.or(`patient_name.ilike.%${q}%,doctor_name.ilike.%${q}%`);
    }
    if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
    if (params?.doctorId) query = query.eq('doctor_id', params.doctorId);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    query = query.order('date', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    let items = (data ?? []).map(mapAppointment);
    if (params?.date) items = items.filter((a) => new Date(a.date).toDateString() === new Date(params.date!).toDateString());
    return { items, total: count ?? 0 };
  },

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const row = appointmentToRow(data);
    const { data: result, error } = await supabase.from('appointments').insert(row).select().single();
    if (error) throw error;
    return mapAppointment(result);
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async rescheduleAppointment(id: string, date: string, time: string): Promise<void> {
    const { error } = await supabase.from('appointments').update({ date, time }).eq('id', id);
    if (error) throw error;
  },

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Invoices -----
  async getInvoices(params?: { page?: number; pageSize?: number; search?: string; status?: string; patientId?: string }): Promise<{ items: Invoice[]; total: number }> {
    let query = supabase.from('invoices').select('*', { count: 'exact' });
    if (params?.patientId) {
      query = query.eq('patient_id', params.patientId);
    }
    if (params?.search) {
      const q = params.search;
      query = query.or(`invoice_number.ilike.%${q}%,patient_name.ilike.%${q}%`);
    }
    if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    query = query.order('date', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data ?? []).map(mapInvoice), total: count ?? 0 };
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapInvoice(data) : null;
  },

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const items = (data.items ?? []).map((it) => ({
      id: it.id, description: it.description, category: it.category, quantity: it.quantity, unit_price: it.unitPrice,
    }));
    const subtotal = (data.items ?? []).reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const invNum = `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
    const row = {
      ...invoiceToRow(data),
      invoice_number: invNum,
      date: new Date().toISOString(),
      items,
      subtotal,
      tax_rate: 8,
      tax,
      total: subtotal + tax - (data.discount ?? 0),
      amount_paid: 0,
      status: 'pending',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    const { data: result, error } = await supabase.from('invoices').insert(row).select().single();
    if (error) throw error;
    return mapInvoice(result);
  },

  async markInvoicePaid(id: string, method: Invoice['paymentMethod']): Promise<void> {
    const { data: inv } = await supabase.from('invoices').select('total').eq('id', id).maybeSingle();
    if (!inv) throw new Error('Invoice not found');
    const { error } = await supabase.from('invoices')
      .update({ status: 'paid', amount_paid: inv.total, payment_method: method })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Misc -----
  async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id, name: r.name, icon: r.icon, head: r.head_doctor_name,
      doctorsCount: 0, beds: r.beds, occupied: r.occupied, color: r.color,
    }));
  },
  async getActivities(): Promise<ActivityItem[]> {
    const { data, error } = await supabase.from('activities').select('*').order('time', { ascending: false }).limit(10);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id, type: r.type, title: r.title, description: r.description,
      time: r.time, user: r.user_name, avatar: r.user_avatar,
    }));
  },
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase.from('notifications').select('*').order('time', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id, title: r.title, message: r.message, time: r.time, read: r.read, type: r.type,
    }));
  },

  async markNotificationsRead(): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) throw error;
  },

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw error;
  },

  async clearNotifications(): Promise<void> {
    const { error } = await supabase.from('notifications').delete().gt('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  },

  // ----- Dashboard stats (real DB data) -----
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const [patientsRes, doctorsRes, apptsRes, invoicesRes] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact' }).gte('date', today + 'T00:00:00').lte('date', today + 'T23:59:59'),
      supabase.from('invoices').select('total, status, date'),
    ]);
    const monthlyRevenue = (invoicesRes.data ?? [])
      .filter((inv) => {
        if (inv.status !== 'paid') return false;
        const d = new Date(inv.date);
        return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
      })
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    return {
      totalPatients: patientsRes.count ?? 0,
      activeDoctors: doctorsRes.count ?? 0,
      todayAppointments: apptsRes.count ?? 0,
      monthlyRevenue,
    };
  },

  // ----- Revenue chart data (real DB) -----
  async getRevenueData() {
    const now = new Date();
    const months: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const { data } = await supabase.from('invoices').select('total').eq('status', 'paid').gte('date', monthStart).lte('date', monthEnd);
      const revenue = (data ?? []).reduce((s, r) => s + Number(r.total), 0);
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        expenses: Math.round(revenue * 0.62),
      });
    }
    return months;
  },

  // ----- Patient flow data (real DB) -----
  async getPatientFlowData() {
    const days: { day: string; admitted: number; discharged: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
      const [admRes, disRes] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'admitted').gte('admitted_on', dayStart).lte('admitted_on', dayEnd),
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'discharged').gte('created_at', dayStart).lte('created_at', dayEnd),
      ]);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        admitted: admRes.count ?? 0,
        discharged: disRes.count ?? 0,
      });
    }
    return days;
  },

  // ----- Department distribution (real DB) -----
  async getDepartmentDistribution() {
    const { data: depts } = await supabase.from('departments').select('name, color').order('name');
    const { data: pats } = await supabase.from('patients').select('department');
    const countFor = (name: string) => (pats ?? []).filter((p) => p.department === name).length;
    return (depts ?? []).slice(0, 8).map((d) => ({
      name: d.name,
      value: countFor(d.name) || 1,
      color: d.color,
    }));
  },

  // ----- Appointment type distribution (real DB) -----
  async getAppointmentTypeData() {
    const colors: Record<string, string> = { consultation: '#2563eb', 'follow-up': '#06b6d4', emergency: '#ef4444', checkup: '#22c55e', surgery: '#f59e0b' };
    const { data } = await supabase.from('appointments').select('type');
    const counts: Record<string, number> = {};
    (data ?? []).forEach((a) => { counts[a.type] = (counts[a.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: colors[type] ?? '#6b7280',
    }));
  },

  // Bulk data access for dropdowns (queries DB, not mock)
  allPatients: [] as Patient[],
  allDoctors: [] as Doctor[],
  allDepartments: [] as Department[],
  async refreshLookups() {
    const [p, d, dept] = await Promise.all([
      supabase.from('patients').select('*').order('first_name').limit(100),
      supabase.from('doctors').select('*').order('first_name').limit(100),
      supabase.from('departments').select('*').order('name'),
    ]);
    this.allPatients = (p.data ?? []).map((r) => mapPatient(r));
    this.allDoctors = (d.data ?? []).map(mapDoctor);
    this.allDepartments = (dept.data ?? []).map((r) => ({
      id: r.id, name: r.name, icon: r.icon, head: r.head_doctor_name,
      doctorsCount: 0, beds: r.beds, occupied: r.occupied, color: r.color,
    }));
  },

  // ----- Inventory CRUD (excludes Medication) -----
  async getInventoryItems(params?: { page?: number; pageSize?: number; search?: string; category?: string; excludeCategory?: string }): Promise<{ items: InventoryItem[]; total: number }> {
    let query = supabase.from('inventory_items').select('*', { count: 'exact' });
    if (params?.search) {
      const q = params.search;
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,supplier.ilike.%${q}%`);
    }
    if (params?.category && params.category !== 'all') query = query.eq('category', params.category);
    if (params?.excludeCategory) query = query.neq('category', params.excludeCategory);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data ?? []).map(mapInventoryItem), total: count ?? 0 };
  },

  async createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const row = inventoryItemToRow(data);
    const { data: result, error } = await supabase.from('inventory_items').insert(row).select().single();
    if (error) throw error;
    return mapInventoryItem(result);
  },

  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<void> {
    const { error } = await supabase.from('inventory_items').update(inventoryItemToRow(data)).eq('id', id);
    if (error) throw error;
  },

  async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Pharmacy CRUD (Medication category only) -----
  async getPharmacyItems(params?: { page?: number; pageSize?: number; search?: string; category?: string }): Promise<{ items: InventoryItem[]; total: number }> {
    let query = supabase.from('inventory_items').select('*', { count: 'exact' }).eq('category', 'Medication');
    if (params?.search) {
      const q = params.search;
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,supplier.ilike.%${q}%`);
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 8;
    query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data ?? []).map(mapInventoryItem), total: count ?? 0 };
  },

  async createPharmacyItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
    const row = inventoryItemToRow({ ...data, category: 'Medication' });
    const { data: result, error } = await supabase.from('inventory_items').insert(row).select().single();
    if (error) throw error;
    return mapInventoryItem(result);
  },

  async updatePharmacyItem(id: string, data: Partial<InventoryItem>): Promise<void> {
    const { error } = await supabase.from('inventory_items').update(inventoryItemToRow(data)).eq('id', id);
    if (error) throw error;
  },

  async deletePharmacyItem(id: string): Promise<void> {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
  },

  // ----- Blood Bank -----
  async getBloodBankStock(): Promise<BloodBankStock[]> {
    const { data, error } = await supabase.from('blood_bank_stock').select('*').order('blood_type', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapBloodBankStock);
  },

  async updateBloodBankStock(id: string, data: { unitsAvailable?: number; reorderLevel?: number; location?: string }): Promise<void> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.unitsAvailable !== undefined) row.units_available = data.unitsAvailable;
    if (data.reorderLevel !== undefined) row.reorder_level = data.reorderLevel;
    if (data.location !== undefined) row.location = data.location;
    const { error } = await supabase.from('blood_bank_stock').update(row).eq('id', id);
    if (error) throw error;
  },

  // ----- Staff management -----
  async getStaffProfiles(): Promise<StaffProfile[]> {
    const { data, error } = await supabase.from('staff_profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapStaffProfile);
  },

  async createStaffUser(email: string, password: string, fullName: string, role: UserRole, doctorId?: string, department?: string, patientId?: string): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    if (data.user) {
      await new Promise((r) => setTimeout(r, 300));
      await supabase.from('staff_profiles')
        .update({ role, doctor_id: doctorId ?? null, patient_id: patientId ?? null, department: department ?? null })
        .eq('id', data.user.id);
    }
  },

  async updateStaffProfile(id: string, data: { role?: UserRole; department?: string; doctor_id?: string; active?: boolean; full_name?: string; phone?: string }): Promise<void> {
    const { error } = await supabase.from('staff_profiles').update(data).eq('id', id);
    if (error) throw error;
  },

  async deleteStaffProfile(id: string): Promise<void> {
    const { error } = await supabase.from('staff_profiles').delete().eq('id', id);
    if (error) throw error;
  },

  async createStaffWithoutPortal(fullName: string, role: UserRole, department?: string, phone?: string): Promise<void> {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('staff_profiles').insert({
      id,
      full_name: fullName,
      role,
      department: department ?? null,
      phone: phone ?? null,
      active: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
    });
    if (error) throw error;
  },
};
