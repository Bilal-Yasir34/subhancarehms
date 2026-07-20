import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type {
  Patient, Doctor, Appointment, Invoice, Department, ActivityItem, Notification,
  UserRole, StaffProfile, InventoryItem, MedicalRecord, BloodBankStock, Prescription,
} from '../types';
// utils import removed

// ---- DB row → domain object mappers ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvoice(row: any): Invoice {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (row.items as any[] ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((it: any) => it !== null && it !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    tempCode: row.temp_code,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrescription(row: any): Prescription {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    medicationId: row.medication_id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    duration: row.duration,
    instructions: row.instructions,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function prescriptionToRow(data: Partial<Prescription>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.patientId !== undefined) row.patient_id = data.patientId;
  if (data.doctorId !== undefined) row.doctor_id = data.doctorId;
  if (data.doctorName !== undefined) row.doctor_name = data.doctorName;
  if (data.medicationId !== undefined) row.medication_id = data.medicationId;
  if (data.medicationName !== undefined) row.medication_name = data.medicationName;
  if (data.dosage !== undefined) row.dosage = data.dosage;
  if (data.duration !== undefined) row.duration = data.duration;
  if (data.instructions !== undefined) row.instructions = data.instructions;
  if (data.notes !== undefined) row.notes = data.notes;
  return row;
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

    try {
      await api.logActivity({
        type: 'admission',
        title: 'New patient registered',
        description: `${result.first_name} ${result.last_name} registered under ${mrn}`,
      });
    } catch (e) {
      console.warn('Failed to log patient registration activity:', e);
    }

    return mapPatient(result);
  },

  async updatePatient(id: string, data: Partial<Patient>): Promise<void> {
    let oldStatus: string | null = null;
    let patientName = '';
    if (data.status !== undefined) {
      const { data: p } = await supabase.from('patients').select('status, first_name, last_name').eq('id', id).maybeSingle();
      if (p) {
        oldStatus = p.status;
        patientName = `${p.first_name} ${p.last_name}`;
      }
    }

    const { error } = await supabase.from('patients').update(patientToRow(data)).eq('id', id);
    if (error) throw error;

    if (data.status !== undefined && oldStatus !== data.status && patientName) {
      try {
        let type = 'admission';
        let title = 'Patient status updated';
        let description = `${patientName} status updated to ${data.status}`;
        if (data.status === 'admitted') {
          type = 'admission';
          title = 'Patient admitted';
          description = `${patientName} admitted to hospital`;
        } else if (data.status === 'discharged') {
          type = 'discharge';
          title = 'Patient discharged';
          description = `${patientName} discharged from hospital`;
        }
        await api.logActivity({ type, title, description });
      } catch (e) {
        console.warn('Failed to log patient status change activity:', e);
      }
    }
  },

  async deletePatient(id: string): Promise<void> {
    // 1. Fetch any linked staff profile first
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('patient_id', id)
      .maybeSingle();

    // 2. Delete the patient record
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;

    // 3. Clean up targeted notifications and delete the staff profile
    if (profile?.id) {
      await supabase.from('notifications').delete().eq('target_user_id', profile.id);
      await supabase.from('staff_profiles').delete().eq('id', profile.id);
    }
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
    // 1. Fetch any linked staff profile first
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('doctor_id', id)
      .maybeSingle();

    // 2. Delete the doctor record
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw error;

    // 3. Clean up targeted notifications and delete the staff profile
    if (profile?.id) {
      await supabase.from('notifications').delete().eq('target_user_id', profile.id);
      await supabase.from('staff_profiles').delete().eq('id', profile.id);
    }
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

    // Format date for notification message
    let formattedDate = data.date || '';
    try {
      if (data.date) {
        formattedDate = new Date(data.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      // use raw date value as fallback
    }

    // 1. Send notification to the respective doctor
    try {
      if (data.doctorId) {
        const { data: profile } = await supabase
          .from('staff_profiles')
          .select('id')
          .eq('doctor_id', data.doctorId)
          .maybeSingle();
        if (profile?.id) {
          await api.sendNotification({
            title: 'New Appointment Scheduled',
            message: `New appointment booked by ${data.patientName || 'Patient'} on ${formattedDate} at ${data.time || ''}.`,
            type: 'info',
            targetType: 'individual',
            targetUserId: profile.id,
          });
        } else {
          // Fallback: send as broadcast so admin/staff can see it
          await api.sendNotification({
            title: 'New Appointment Scheduled (Broadcast)',
            message: `New appointment booked by ${data.patientName || 'Patient'} with Dr. ${data.doctorName || ''} on ${formattedDate} at ${data.time || ''}.`,
            type: 'info',
            targetType: 'broadcast',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to send doctor appointment notification:', err);
    }

    // 2. Send notification to the respective patient
    try {
      if (data.patientId) {
        const { data: patientProfile } = await supabase
          .from('staff_profiles')
          .select('id')
          .eq('patient_id', data.patientId)
          .maybeSingle();
        if (patientProfile?.id) {
          await api.sendNotification({
            title: 'Appointment Confirmed',
            message: `Your appointment with ${data.doctorName || 'Doctor'} has been scheduled for ${formattedDate} at ${data.time || ''}.`,
            type: 'success',
            targetType: 'individual',
            targetUserId: patientProfile.id,
          });
        } else {
          // Fallback: send as broadcast so admin/staff can see it
          await api.sendNotification({
            title: 'Appointment Confirmed (Broadcast)',
            message: `Appointment scheduled for patient ${data.patientName || 'Patient'} with Dr. ${data.doctorName || ''} on ${formattedDate} at ${data.time || ''}.`,
            type: 'success',
            targetType: 'broadcast',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to send patient appointment notification:', err);
    }

    try {
      await api.logActivity({
        type: 'appointment',
        title: 'New appointment booked',
        description: `${result.patient_name} scheduled with ${result.doctor_name} — ${result.department}`,
      });
    } catch (e) {
      console.warn('Failed to log appointment activity:', e);
    }

    return mapAppointment(result);
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    const { data: appt } = await supabase.from('appointments').select('patient_name, doctor_name, status, doctor_id').eq('id', id).maybeSingle();
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) throw error;

    if (appt) {
      if (appt.status !== 'completed' && status === 'completed' && appt.doctor_id) {
        try {
          const { data: doc } = await supabase.from('doctors').select('patients_treated').eq('id', appt.doctor_id).maybeSingle();
          if (doc) {
            const currentTreated = Number(doc.patients_treated ?? 0);
            await supabase.from('doctors').update({ patients_treated: currentTreated + 1 }).eq('id', appt.doctor_id);
          }
        } catch (e) {
          console.warn('Failed to increment doctor patients treated count:', e);
        }
      }

      if (appt.status !== status) {
        try {
          await api.logActivity({
            type: 'appointment',
            title: 'Appointment status updated',
            description: `Appointment of ${appt.patient_name} with ${appt.doctor_name} updated to ${status}`,
          });
        } catch (e) {
          console.warn('Failed to log appointment update activity:', e);
        }
      }
    }
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
    const tax = 0;
    const invNum = `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
    const row = {
      ...invoiceToRow(data),
      invoice_number: invNum,
      date: new Date().toISOString(),
      items,
      subtotal,
      tax_rate: 0,
      tax,
      total: subtotal - (data.discount ?? 0),
      amount_paid: 0,
      status: 'pending',
      due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    const { data: result, error } = await supabase.from('invoices').insert(row).select().single();
    if (error) throw error;

    // Send notification to the patient
    try {
      if (result.patient_id) {
        const { data: profile } = await supabase
          .from('staff_profiles')
          .select('id')
          .eq('patient_id', result.patient_id)
          .maybeSingle();
        if (profile?.id) {
          await api.sendNotification({
            title: 'New Bill Generated',
            message: `A new invoice (${result.invoice_number}) for $${(result.total || 0).toFixed(2)} has been generated.`,
            type: 'warning',
            targetType: 'individual',
            targetUserId: profile.id,
          });
        } else {
          // Fallback: send as broadcast so admin/staff can see it
          await api.sendNotification({
            title: 'New Bill Generated (Broadcast)',
            message: `A new invoice (${result.invoice_number}) of $${(result.total || 0).toFixed(2)} has been generated for patient ${result.patient_name || ''}.`,
            type: 'warning',
            targetType: 'broadcast',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to send patient bill notification:', err);
    }

    try {
      await api.logActivity({
        type: 'payment',
        title: 'New bill generated',
        description: `Invoice ${result.invoice_number} generated for ${result.patient_name} — $${Number(result.total).toFixed(2)}`,
      });
    } catch (e) {
      console.warn('Failed to log invoice activity:', e);
    }

    return mapInvoice(result);
  },

  async markInvoicePaid(id: string, method: Invoice['paymentMethod']): Promise<void> {
    const { data: inv } = await supabase.from('invoices').select('total, invoice_number, patient_name').eq('id', id).maybeSingle();
    if (!inv) throw new Error('Invoice not found');
    const { error } = await supabase.from('invoices')
      .update({ status: 'paid', amount_paid: inv.total, payment_method: method })
      .eq('id', id);
    if (error) throw error;

    try {
      await api.logActivity({
        type: 'payment',
        title: 'Invoice paid',
        description: `Invoice ${inv.invoice_number} paid via ${method} — $${Number(inv.total).toFixed(2)}`,
      });
    } catch (e) {
      console.warn('Failed to log invoice payment activity:', e);
    }
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

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const row = {
      name: data.name,
      icon: data.icon ?? 'Heart',
      head_doctor_name: data.head ?? '',
      beds: Number(data.beds ?? 0),
      occupied: Number(data.occupied ?? 0),
      color: data.color ?? '#2563eb',
    };
    const { data: result, error } = await supabase.from('departments').insert(row).select().single();
    if (error) throw error;
    return {
      id: result.id, name: result.name, icon: result.icon, head: result.head_doctor_name,
      doctorsCount: 0, beds: result.beds, occupied: result.occupied, color: result.color,
    };
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.icon !== undefined) row.icon = data.icon;
    if (data.head !== undefined) row.head_doctor_name = data.head;
    if (data.beds !== undefined) row.beds = Number(data.beds);
    if (data.occupied !== undefined) row.occupied = Number(data.occupied);
    if (data.color !== undefined) row.color = data.color;
    const { error } = await supabase.from('departments').update(row).eq('id', id);
    if (error) throw error;
  },

  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw error;
  },
  async getActivities(): Promise<ActivityItem[]> {
    const { data, error } = await supabase.from('activities').select('*').order('time', { ascending: false }).limit(10);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id, type: r.type, title: r.title, description: r.description,
      time: r.time, user: r.user_name, avatar: r.user_avatar,
    }));
  },
  async logActivity(payload: {
    type: string;
    title: string;
    description: string;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userName = 'System';
      let userAvatar = '';
      if (user) {
        const { data: profile } = await supabase
          .from('staff_profiles')
          .select('full_name, avatar')
          .eq('id', user.id)
          .maybeSingle();
        if (profile) {
          userName = profile.full_name;
          userAvatar = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.full_name)}`;
        }
      }
      const { error } = await supabase.from('activities').insert({
        type: payload.type,
        title: payload.title,
        description: payload.description,
        time: new Date().toISOString(),
        user_name: userName,
        user_avatar: userAvatar,
      });
      if (error) throw error;
    } catch (err) {
      console.warn('Failed to log activity:', err);
    }
  },
  async getNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch the user's role from staff_profiles
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isStaffRole = profile?.role === 'admin' || profile?.role === 'doctor' || profile?.role === 'general_staff';

    let query = supabase.from('notifications').select('*').order('time', { ascending: false });

    if (isStaffRole) {
      // Staff see broadcast notifications + any individual ones addressed to them
      query = query.or(`target_type.eq.broadcast,and(target_type.eq.individual,target_user_id.eq.${user.id})`);
    } else {
      // Patients (and others) only see individual notifications addressed to them
      query = query.eq('target_type', 'individual').eq('target_user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      time: r.time,
      read: r.read,
      type: r.type,
      targetType: r.target_type ?? 'broadcast',
      targetUserId: r.target_user_id ?? undefined,
    }));
  },

  async markNotificationsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Only mark notifications that are visible to this user as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
      .or(`target_type.eq.broadcast,and(target_type.eq.individual,target_user_id.eq.${user.id})`);
    if (error) throw error;
  },

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw error;
  },

  async clearNotifications(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Only delete notifications visible to this user
    const { error } = await supabase
      .from('notifications')
      .delete()
      .or(`target_type.eq.broadcast,and(target_type.eq.individual,target_user_id.eq.${user.id})`);
    if (error) throw error;
  },

  async sendNotification(payload: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    targetType: 'broadcast' | 'individual';
    targetUserId?: string;
  }): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      title: payload.title,
      message: payload.message,
      type: payload.type,
      read: false,
      time: new Date().toISOString(),
      target_type: payload.targetType,
      target_user_id: payload.targetUserId ?? null,
    });
    if (error) throw error;
  },

  // ----- Dashboard stats (real DB data) -----
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const [patientsRes, doctorsRes, apptsRes, invoicesRes] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('status', 'available'),
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

    // 1. Fetch staff count to compute salary expenses
    const { count: doctorCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
    const { data: staffData } = await supabase.from('staff_profiles').select('role');
    const staffProfiles = staffData ?? [];
    const adminCount = staffProfiles.filter(s => s.role === 'admin').length;
    const generalStaffCount = staffProfiles.filter(s => s.role === 'general_staff').length;

    // Operational salaries: Doctor Rs.150,000, General Staff Rs.60,000, Admin Rs.120,000
    const monthlySalaries = (doctorCount ?? 0) * 150000 + generalStaffCount * 60000 + adminCount * 120000;

    // 2. Fetch inventory items to compute monthly procurement cost
    const { data: inventoryData } = await supabase.from('inventory_items').select('quantity, unit_price, created_at');
    const inventoryItems = inventoryData ?? [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      // Revenue: Paid invoices within this month
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('total')
        .eq('status', 'paid')
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString());
      const revenue = (invoicesData ?? []).reduce((s, r) => s + Number(r.total), 0);

      // Expenses: Utilities/Rent (Rs.20,000) + Salaries + Inventory created in this month
      const inventoryCost = inventoryItems
        .filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= monthStart && itemDate <= monthEnd;
        })
        .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

      const expenses = 20000 + monthlySalaries + inventoryCost;

      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        expenses: Math.round(expenses),
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

  async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async createStaffUser(email: string, password: string, fullName: string, role: UserRole, doctorId?: string, department?: string, patientId?: string, phone?: string): Promise<void> {
    // Use a separate, isolated Supabase client so that signUp does NOT fire
    // onAuthStateChange on the main client. This keeps the admin's session and
    // AuthContext completely untouched during new-user registration.
    const isolatedClient = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data, error } = await isolatedClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    if (data.user) {
      // Wait briefly for the DB trigger to create the staff_profiles row
      await new Promise((r) => setTimeout(r, 400));
      // Update the new user's profile with the correct role using the main client
      // (which still holds the admin session and has the needed permissions)
      const { error: updateError } = await supabase.from('staff_profiles')
        .update({ role, doctor_id: doctorId ?? null, patient_id: patientId ?? null, department: department ?? null, phone: phone ?? null })
        .eq('id', data.user.id);
      if (updateError) throw updateError;
    }
  },

  async updateStaffProfile(id: string, data: { role?: UserRole; department?: string; doctor_id?: string; active?: boolean; full_name?: string; phone?: string }): Promise<void> {
    const { error } = await supabase.from('staff_profiles').update(data).eq('id', id);
    if (error) throw error;
  },

  async deleteStaffProfile(id: string): Promise<void> {
    // 1. Fetch profile to check linked records
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('doctor_id, patient_id')
      .eq('id', id)
      .maybeSingle();

    // 2. Delete all notifications targeted to this user
    await supabase.from('notifications').delete().eq('target_user_id', id);

    // 3. Delete the staff profile row
    const { error } = await supabase.from('staff_profiles').delete().eq('id', id);
    if (error) throw error;

    // 3. Clean up linked doctor (if any)
    if (profile?.doctor_id) {
      await supabase.from('doctors').delete().eq('id', profile.doctor_id);
    }

    // 4. Clean up linked patient (if any)
    if (profile?.patient_id) {
      await supabase.from('patients').delete().eq('id', profile.patient_id);
    }
  },

  async createStaffWithoutPortal(fullName: string, role: UserRole, department?: string, phone?: string): Promise<void> {
    const email = `staff-${crypto.randomUUID()}@subhancare.internal`;
    const password = crypto.randomUUID();
    await api.createStaffUser(email, password, fullName, role, undefined, department, undefined, phone);
  },

  // ----- Prescriptions -----
  async getPrescriptions(params?: { patientId?: string; doctorId?: string; page?: number; pageSize?: number; search?: string }): Promise<{ items: Prescription[]; total: number }> {
    let query = supabase.from('prescriptions').select('*', { count: 'exact' });
    if (params?.patientId) query = query.eq('patient_id', params.patientId);
    if (params?.doctorId) query = query.eq('doctor_id', params.doctorId);
    if (params?.search) {
      const q = params.search;
      query = query.or(`medication_name.ilike.%${q}%,doctor_name.ilike.%${q}%,dosage.ilike.%${q}%`);
    }
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 100;
    query = query.order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data ?? []).map(mapPrescription), total: count ?? 0 };
  },

  async createPrescription(data: Partial<Prescription>): Promise<Prescription> {
    const row = prescriptionToRow(data);
    const { data: result, error } = await supabase.from('prescriptions').insert(row).select().single();
    if (error) throw error;
    return mapPrescription(result);
  },

  async deletePrescription(id: string): Promise<void> {
    const { error } = await supabase.from('prescriptions').delete().eq('id', id);
    if (error) throw error;
  },
};
