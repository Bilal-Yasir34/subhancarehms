import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, ArrowLeft, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Select, Input, Textarea, Avatar } from '../../components/ui';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { TIME_SLOTS } from '../../constants';
import type { Patient, Doctor, Appointment } from '../../types';
import { cn, formatDate } from '../../utils';

export function RequestAppointmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<Appointment['type']>('consultation');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    if (user?.patientId) {
      api.getPatient(user.patientId).then(setPatient).catch(() => {});
    }
    const loadDoctors = () => {
      api.getDoctors({ pageSize: 100 }).then((r) => setDoctors(r.items)).catch(() => {});
    };
    
    loadDoctors();

    const channel = supabase
      .channel('request-appointment-doctors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        () => {
          loadDoctors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.patientId]);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const today = new Date().toLocaleDateString('sv');

  const canNext = (step === 1 && doctorId) || (step === 2 && date && time);

  const handleSubmit = async () => {
    if (!patient || !selectedDoctor) return;
    setLoading(true);
    try {
      await api.createAppointment({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientAvatar: patient.avatar,
        doctorId: selectedDoctor.id,
        doctorName: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        department: selectedDoctor.department,
        date: new Date(`${date}T${time}`).toISOString(),
        time,
        type,
        reason,
        room: selectedDoctor.room,
        status: 'scheduled',
      });
      toast.success('Appointment requested successfully!');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to request appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.patientId) {
    return (
      <Card className="m-6">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Stethoscope className="h-8 w-8 text-ink-400 mb-2" />
          <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-200">Profile not linked</h3>
          <p className="text-sm text-ink-500 mt-1">Your account is not linked to a patient profile. Please contact support.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Request Appointment</h1>
          <p className="text-sm text-ink-500">Book a slot with one of our specialized doctors</p>
        </div>
      </div>

      <Card>
        <CardBody className="py-6">
          {/* Progress steps */}
          <div className="flex items-center justify-between mb-8">
            {['Select Doctor', 'Schedule', 'Review'].map((label, i) => {
              const n = i + 1;
              const active = step >= n;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                      active ? 'bg-primary-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
                    )}>
                      {step > n ? <Check className="h-4 w-4" /> : n}
                    </div>
                    <span className={cn('text-sm font-medium hidden sm:inline', active ? 'text-ink-900 dark:text-white' : 'text-ink-400')}>{label}</span>
                  </div>
                  {i < 2 && <div className={cn('flex-1 h-px mx-4', step > n ? 'bg-primary-600' : 'bg-ink-200 dark:bg-ink-800')} />}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Select
                label="Choose a Doctor"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                options={[
                  { value: '', label: 'Select a doctor...' },
                  ...doctors.map((d) => ({
                    value: d.id,
                    label: `Dr. ${d.firstName} ${d.lastName} (${d.specialty} — ${d.department})`,
                  })),
                ]}
              />

              <Select
                label="Appointment Type"
                value={type}
                onChange={(e) => setType(e.target.value as Appointment['type'])}
                options={[
                  { value: 'consultation', label: 'Consultation' },
                  { value: 'follow-up', label: 'Follow-up' },
                  { value: 'checkup', label: 'General Checkup' },
                  { value: 'emergency', label: 'Emergency' },
                ]}
              />

              <Textarea
                label="Reason for Visit"
                placeholder="Briefly describe your symptoms or reason for visiting..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Select Date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-2">Available Time Slots</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const selected = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={cn(
                          'flex items-center justify-center py-2 px-3 text-xs font-medium rounded-lg border transition-all',
                          selected
                            ? 'bg-primary-600 border-primary-600 text-white shadow-soft shadow-primary-500/20'
                            : 'border-ink-200 hover:border-primary-300 hover:bg-primary-50/20 dark:border-ink-800 dark:hover:bg-primary-500/5 text-ink-700 dark:text-ink-300'
                        )}
                      >
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="rounded-xl bg-ink-50 dark:bg-ink-900 p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar name={patient ? `${patient.firstName} ${patient.lastName}` : ''} src={patient?.avatar} size="lg" />
                  <div>
                    <h3 className="text-sm font-semibold text-ink-500">Patient Details</h3>
                    <p className="text-base font-bold text-ink-900 dark:text-white">{patient?.firstName} {patient?.lastName}</p>
                    <p className="text-xs text-ink-400">MRN: {patient?.mrn}</p>
                  </div>
                </div>

                <div className="h-px bg-ink-200 dark:bg-ink-800" />

                <div className="flex items-center gap-4">
                  {selectedDoctor && (
                    <>
                      <Avatar name={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`} src={selectedDoctor.avatar} size="lg" />
                      <div>
                        <h3 className="text-sm font-semibold text-ink-500">Attending Doctor</h3>
                        <p className="text-base font-bold text-ink-900 dark:text-white">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                        <p className="text-xs text-ink-400">{selectedDoctor.specialty} · Room {selectedDoctor.room}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="h-px bg-ink-200 dark:bg-ink-800" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-ink-400 uppercase">Date & Time</span>
                    <span className="text-sm font-medium text-ink-800 dark:text-ink-200">{formatDate(date)} at {time}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-ink-400 uppercase">Consultation Type</span>
                    <span className="text-sm font-medium text-ink-800 dark:text-ink-200 capitalize">{type}</span>
                  </div>
                </div>

                {reason && (
                  <>
                    <div className="h-px bg-ink-200 dark:bg-ink-800" />
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase">Reason</span>
                      <p className="text-sm text-ink-600 dark:text-ink-400 mt-1 italic">"{reason}"</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-ink-100 dark:border-ink-800 mt-6">
            {step > 1 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Continue</Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading}>Request Appointment</Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
