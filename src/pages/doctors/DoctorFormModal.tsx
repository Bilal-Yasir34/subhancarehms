import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Select } from '../../components/ui';
import { api } from '../../services/api';
import { DEPARTMENTS, WEEK_DAYS, TIME_SLOTS } from '../../constants';
import type { Doctor } from '../../types';

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctor?: Doctor | null;
}

interface FormData {
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
  qualification: string;
  experienceYears: number;
  phone: string;
  email: string;
  status: Doctor['status'];
  room: string;
  fee: number;
}

export function DoctorFormModal({ open, onClose, onSuccess, doctor }: DoctorFormModalProps) {
  const [schedule, setSchedule] = useState<{ day: string; slots: { start: string; end: string }[] }[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: doctor ? {
      firstName: doctor.firstName, lastName: doctor.lastName, specialty: doctor.specialty,
      department: doctor.department, qualification: doctor.qualification, experienceYears: doctor.experienceYears,
      phone: doctor.phone, email: doctor.email, status: doctor.status, room: doctor.room, fee: doctor.fee,
    } : {
      department: 'General Medicine', status: 'available', experienceYears: 1, fee: 150,
    },
  });

  const [departmentsList, setDepartmentsList] = useState<string[]>(DEPARTMENTS);

  useEffect(() => {
    api.getDepartments().then((list) => {
      if (list.length > 0) {
        setDepartmentsList(list.map(d => d.name));
      }
    }).catch(() => console.warn('Failed to load departments'));
  }, []);

  useEffect(() => {
    if (open) {
      setSchedule(doctor?.schedule ?? []);
      reset(doctor ? {
        firstName: doctor.firstName, lastName: doctor.lastName, specialty: doctor.specialty,
        department: doctor.department, qualification: doctor.qualification, experienceYears: doctor.experienceYears,
        phone: doctor.phone, email: doctor.email, status: doctor.status, room: doctor.room, fee: doctor.fee,
      } : {
        firstName: '', lastName: '', specialty: '', qualification: '', experienceYears: 1,
        phone: '', email: '', status: 'available', room: '', fee: 150, department: 'General Medicine',
      });
    }
  }, [open, doctor, reset]);

  const handleToggleDay = (day: string) => {
    setSchedule(prev => {
      const exists = prev.find(s => s.day === day);
      if (exists) {
        return prev.filter(s => s.day !== day);
      } else {
        return [...prev, { day, slots: [{ start: '09:00', end: '17:00' }] }];
      }
    });
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setSchedule(prev => prev.map(s => {
      if (s.day === day) {
        const slots = [...s.slots];
        if (slots.length === 0) {
          slots.push({ start: '09:00', end: '17:00' });
        }
        slots[0] = { ...slots[0], [type]: value };
        return { ...s, slots };
      }
      return s;
    }));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, schedule };
      if (doctor) {
        await api.updateDoctor(doctor.id, payload);
        toast.success('Doctor updated successfully');
      } else {
        await api.createDoctor(payload);
        toast.success('Doctor added successfully');
      }
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? 'Edit Doctor' : 'Add New Doctor'}
      description={doctor ? `Update Dr. ${doctor.firstName}'s information` : 'Register a new doctor in the system'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)}>{doctor ? 'Save Changes' : 'Add Doctor'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" placeholder="Sarah" error={errors.firstName?.message} {...register('firstName', { required: 'Required' })} />
          <Input label="Last Name" placeholder="Chen" error={errors.lastName?.message} {...register('lastName', { required: 'Required' })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Specialty" placeholder="Cardiologist" error={errors.specialty?.message} {...register('specialty', { required: 'Required' })} />
          <Select label="Department" options={departmentsList.map((d) => ({ value: d, label: d }))} {...register('department')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Qualification" placeholder="MD, FACP" {...register('qualification')} />
          <Input label="Experience (years)" type="number" error={errors.experienceYears?.message} {...register('experienceYears', { required: 'Required', valueAsNumber: true })} />
          <Input label="Consultation Fee" type="number" leftIcon={<span className="text-xs font-semibold">Rs.</span>} {...register('fee', { valueAsNumber: true })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" placeholder="sarah@subhancare.med" error={errors.email?.message} {...register('email', { required: 'Required', pattern: { value: /^[^\s@]+@[^\s@]+$/, message: 'Invalid email' } })} />
          <Input label="Phone" placeholder="+92 300 0000000" error={errors.phone?.message} {...register('phone', { required: 'Required' })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Room" placeholder="A-201" {...register('room')} />
          <Select label="Status" options={[
            { value: 'available', label: 'Available' },
            { value: 'busy', label: 'Busy' },
            { value: 'off-duty', label: 'Off Duty' },
            { value: 'on-leave', label: 'On Leave' },
          ]} {...register('status')} />
        </div>

        {/* Weekly Schedule Section */}
        <div className="pt-4 border-t border-ink-200 dark:border-ink-800">
          <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-2">Weekly Schedule</h4>
          <p className="text-xs text-ink-500 mb-4">Select the days the doctor is available and specify work hours.</p>
          <div className="space-y-3">
            {WEEK_DAYS.map((day) => {
              const daySched = schedule.find(s => s.day === day);
              const isChecked = !!daySched;
              const slot = daySched?.slots?.[0] ?? { start: '09:00', end: '17:00' };

              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/35">
                  <label className="flex items-center gap-2 cursor-pointer min-w-[80px]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleDay(day)}
                      className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-ink-800 dark:text-ink-200">{day}</span>
                  </label>

                  {isChecked && (
                    <div className="flex items-center gap-2 flex-1">
                      <Select
                        label=""
                        value={slot.start}
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                        options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
                        className="!mt-0 flex-1"
                      />
                      <span className="text-xs text-ink-400">to</span>
                      <Select
                        label=""
                        value={slot.end}
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                        options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
                        className="!mt-0 flex-1"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
