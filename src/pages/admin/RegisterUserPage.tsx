import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, Phone, HeartPulse, Stethoscope, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, Button, Input, Select, Modal } from '../../components/ui';
import { api } from '../../services/api';
import { DEPARTMENTS, BLOOD_TYPES } from '../../constants';
import type { UserRole, Gender, PatientStatus } from '../../types';

export function RegisterUserPage() {
  const [role, setRole] = useState<UserRole>('patient');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [departmentsList, setDepartmentsList] = useState<string[]>(DEPARTMENTS);

  useEffect(() => {
    api.getDepartments().then((list) => {
      if (list.length > 0) {
        const names = list.map(d => d.name);
        setDepartmentsList(names);
        if (!names.includes(department)) {
          setDepartment(names[0]);
        }
      }
    }).catch(err => console.warn('Failed to load departments:', err));
  }, []);
  
  // Doctor fields
  const [specialty, setSpecialty] = useState('General Physician');
  const [qualification, setQualification] = useState('MD');
  const [experienceYears, setExperienceYears] = useState('2');
  const [room, setRoom] = useState('A-101');
  const [fee, setFee] = useState('500');

  // Patient fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [bloodType, setBloodType] = useState('O+');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<PatientStatus>('outpatient');

  // Portal fields
  const [createPortal, setCreatePortal] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDuplicateEmailModal, setShowDuplicateEmailModal] = useState(false);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setSpecialty('General Physician');
    setQualification('MD');
    setExperienceYears('2');
    setRoom('A-101');
    setFee('500');
    setDateOfBirth('');
    setGender('male');
    setBloodType('O+');
    setAddress('');
    setCity('');
    setStatus('outpatient');
    setEmail('');
    setPassword('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full Name is required');
      return;
    }
    if (createPortal && (!email.trim() || !password.trim())) {
      toast.error('Email and Password are required for portal login');
      return;
    }

    setSaving(true);
    try {
      if (createPortal) {
        const emailExists = await api.checkEmailExists(email);
        if (emailExists) {
          setShowDuplicateEmailModal(true);
          setSaving(false);
          return;
        }
      }

      if (role === 'doctor') {
        const names = fullName.split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'Physician';
        
        // 1. Create doctor record
        const doc = await api.createDoctor({
          firstName,
          lastName,
          specialty,
          department,
          qualification,
          experienceYears: parseInt(experienceYears, 10),
          phone,
          email: createPortal ? email : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@subhancare.med`,
          status: 'available',
          room,
          fee: parseFloat(fee),
        });

        // 2. Create portal if checked
        if (createPortal) {
          await api.createStaffUser(email, password, fullName, 'doctor', doc.id, department, undefined);
        }
        toast.success(`Doctor Dr. ${fullName} registered successfully!`);
      } 
      else if (role === 'patient') {
        const names = fullName.split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'Patient';

        // 1. Create patient record
        const pat = await api.createPatient({
          firstName,
          lastName,
          email: createPortal ? email : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@patient.med`,
          phone,
          dateOfBirth: dateOfBirth || new Date().toISOString().split('T')[0],
          gender,
          bloodType,
          address,
          city,
          status,
          department,
        });

        // 2. Create portal if checked
        if (createPortal) {
          await api.createStaffUser(email, password, fullName, 'patient', undefined, department, pat.id);
        }
        toast.success(`Patient ${fullName} registered successfully!`);
      } 
      else {
        // Admin or Receptionist role
        if (createPortal) {
          await api.createStaffUser(email, password, fullName, role, undefined, department, undefined);
        } else {
          await api.createStaffWithoutPortal(fullName, role, department, phone);
        }
        toast.success(`${role.toUpperCase()} ${fullName} registered successfully!`);
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Register a User</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Add a new user to the clinic system (Doctors, Patients, Admins, Receptionists)</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary-500" />
              <span>General User Information</span>
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Role to Register"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as UserRole);
                  resetForm();
                }}
                options={[
                  { value: 'patient', label: 'Patient (Register in Patient Records)' },
                  { value: 'doctor', label: 'Doctor (Register in Doctor Profile)' },
                  { value: 'general_staff', label: 'General Staff' },
                  { value: 'admin', label: 'Administrator' },
                ]}
              />
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                placeholder="+92 300 0000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
              <Select
                label="Assigned Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departmentsList.map(d => ({ value: d, label: d }))}
              />
            </div>
          </CardBody>
        </Card>

        {/* Doctor Custom Fields */}
        {role === 'doctor' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent-500">
                  <Stethoscope className="h-5 w-5" />
                  <span>Doctor Details</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Specialty"
                    placeholder="Cardiologist"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                  <Input
                    label="Qualification"
                    placeholder="MBBS, MD"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                  <Input
                    label="Experience (Years)"
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Consultation Fee (PKR)"
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                  <Input
                    label="Assigned Room"
                    placeholder="Room-102"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Patient Custom Fields */}
        {role === 'patient' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary-500">
                  <HeartPulse className="h-5 w-5" />
                  <span>Patient Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                  <Select
                    label="Gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <Select
                    label="Blood Type"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    options={BLOOD_TYPES.map(b => ({ value: b, label: b }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    placeholder="Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PatientStatus)}
                    options={[
                      { value: 'outpatient', label: 'Outpatient' },
                      { value: 'admitted', label: 'Admitted' },
                      { value: 'emergency', label: 'Emergency' },
                      { value: 'discharged', label: 'Discharged' },
                    ]}
                  />
                  <Input
                    label="Residential Address"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Portal access toggle checkbox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning-500">
              <ShieldAlert className="h-5 w-5" />
              <span>Portal Login Credentials</span>
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2.5 py-2">
              <input
                type="checkbox"
                id="createPortalAccess"
                checked={createPortal}
                onChange={(e) => setCreatePortal(e.target.checked)}
                className="h-5 w-5 rounded border-ink-300 text-primary-600 focus:ring-primary-500 dark:border-ink-600 dark:bg-ink-800"
              />
              <label htmlFor="createPortalAccess" className="text-sm font-semibold text-ink-700 dark:text-ink-300 cursor-pointer select-none">
                Create portal access for this user (allows logging in to the system)
              </label>
            </div>

            {createPortal && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden pt-2">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@subhancare.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required={createPortal}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required={createPortal}
                />
              </motion.div>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving} leftIcon={<UserPlus className="h-4 w-4" />}>
            {saving ? 'Registering...' : 'Register User'}
          </Button>
        </div>
      </form>

      {showDuplicateEmailModal && (
        <Modal
          open={showDuplicateEmailModal}
          onClose={() => setShowDuplicateEmailModal(false)}
          title="Registration Error"
          size="sm"
        >
          <div className="text-center py-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/15 text-danger-500">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-ink-900 dark:text-white">Email Already Registered</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              A user with the email <span className="font-semibold text-ink-900 dark:text-white">{email}</span> already exists. Please use different credentials.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowDuplicateEmailModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
