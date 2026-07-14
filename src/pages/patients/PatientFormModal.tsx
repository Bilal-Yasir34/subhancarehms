import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Select } from '../../components/ui';
import { api } from '../../services/api';
import { DEPARTMENTS, BLOOD_TYPES } from '../../constants';
import type { Patient } from '../../types';

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: Patient | null;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType: string;
  address: string;
  city: string;
  status: Patient['status'];
  department: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
}

export function PatientFormModal({ open, onClose, onSuccess, patient }: PatientFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: patient ? {
      firstName: patient.firstName, lastName: patient.lastName, email: patient.email,
      phone: patient.phone, dateOfBirth: patient.dateOfBirth.split('T')[0],
      gender: patient.gender, bloodType: patient.bloodType, address: patient.address,
      city: patient.city, status: patient.status, department: patient.department,
      emergencyContactName: patient.emergencyContact?.name ?? '',
      emergencyContactRelation: patient.emergencyContact?.relation ?? '',
      emergencyContactPhone: patient.emergencyContact?.phone ?? '',
    } : {
      gender: 'male', bloodType: 'O+', status: 'outpatient', department: 'General Medicine',
      emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
    },
  });

  const onSubmit = async (formData: FormData) => {
    const { emergencyContactName, emergencyContactRelation, emergencyContactPhone, ...rest } = formData;
    const data = {
      ...rest,
      emergencyContact: {
        name: emergencyContactName ?? '',
        relation: emergencyContactRelation ?? '',
        phone: emergencyContactPhone ?? '',
      }
    };
    try {
      if (patient) {
        await api.updatePatient(patient.id, data);
        toast.success('Patient updated successfully');
      } else {
        await api.createPatient(data);
        toast.success('Patient added successfully');
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
      title={patient ? 'Edit Patient' : 'Add New Patient'}
      description={patient ? `Update ${patient.firstName}'s information` : 'Register a new patient in the system'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)}>{patient ? 'Save Changes' : 'Add Patient'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" placeholder="John" error={errors.firstName?.message} {...register('firstName', { required: 'Required' })} />
          <Input label="Last Name" placeholder="Doe" error={errors.lastName?.message} {...register('lastName', { required: 'Required' })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" type="email" placeholder="john@mail.com" error={errors.email?.message} {...register('email', { required: 'Required', pattern: { value: /^[^\s@]+@[^\s@]+$/, message: 'Invalid email' } })} />
          <Input label="Phone" placeholder="+92 300 0000000" error={errors.phone?.message} {...register('phone', { required: 'Required' })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth', { required: 'Required' })} />
          <Select label="Gender" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} {...register('gender')} />
          <Select label="Blood Type" options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))} {...register('bloodType')} />
        </div>
        <Input label="Address" placeholder="123 Main St" error={errors.address?.message} {...register('address', { required: 'Required' })} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="City" placeholder="New York" error={errors.city?.message} {...register('city', { required: 'Required' })} />
          <Select label="Department" options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} {...register('department')} />
          <Select label="Status" options={[
            { value: 'outpatient', label: 'Outpatient' },
            { value: 'admitted', label: 'Admitted' },
            { value: 'emergency', label: 'Emergency' },
            { value: 'discharged', label: 'Discharged' },
          ]} {...register('status')} />
        </div>

        <div className="border-t border-ink-100 dark:border-ink-800 pt-4 mt-2">
          <h4 className="text-sm font-semibold text-ink-700 dark:text-ink-300 mb-3">Emergency Contact (Optional)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Contact Name" placeholder="Jane Doe" error={errors.emergencyContactName?.message} {...register('emergencyContactName')} />
            <Input label="Relation" placeholder="Spouse" error={errors.emergencyContactRelation?.message} {...register('emergencyContactRelation')} />
            <Input label="Contact Phone" placeholder="+92 300 0000000" error={errors.emergencyContactPhone?.message} {...register('emergencyContactPhone')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
