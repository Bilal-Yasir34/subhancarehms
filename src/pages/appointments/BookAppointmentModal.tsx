import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Calendar as CalIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Select, Input, Textarea, Avatar } from '../../components/ui';
import { api } from '../../services/api';
import { TIME_SLOTS } from '../../constants';
import type { Patient, Doctor, Appointment } from '../../types';
import { cn, formatDate } from '../../utils';

interface BookAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookAppointmentModal({ open, onClose, onSuccess }: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<Appointment['type']>('consultation');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1); setPatientId(''); setDoctorId(''); setDate(''); setTime(''); setType('consultation'); setReason('');
    }
  }, [open]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    if (open) {
      api.getPatients({ pageSize: 100 }).then((r) => setPatients(r.items)).catch(() => {});
      api.getDoctors({ pageSize: 100 }).then((r) => setDoctors(r.items)).catch(() => {});
    }
  }, [open]);

  const selectedPatient = patients.find((p) => p.id === patientId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const today = new Date('2026-07-14').toISOString().split('T')[0];

  const canNext = (step === 1 && patientId && doctorId) || (step === 2 && date && time);

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor) return;
    setLoading(true);
    try {
      await api.createAppointment({
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        patientAvatar: selectedPatient.avatar,
        doctorId: selectedDoctor.id,
        doctorName: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        department: selectedDoctor.department,
        date: new Date(`${date}T${time}`).toISOString(),
        time, type, reason, room: selectedDoctor.room,
      });
      toast.success('Appointment booked successfully!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book Appointment"
      size="lg"
      footer={
        <>
          {step > 1 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>Confirm Booking</Button>
          )}
        </>
      }
    >
      {/* Progress steps */}
      <div className="flex items-center justify-between mb-6">
        {['Details', 'Schedule', 'Review'].map((label, i) => {
          const n = i + 1;
          const active = step >= n;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all', active ? 'bg-primary-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-400')}>
                  {step > n ? <Check className="h-4 w-4" /> : n}
                </div>
                <span className={cn('text-sm font-medium hidden sm:block', active ? 'text-ink-800 dark:text-ink-200' : 'text-ink-400')}>{label}</span>
              </div>
              {n < 3 && <div className={cn('h-0.5 flex-1 mx-2 sm:mx-3 rounded transition-colors', step > n ? 'bg-primary-600' : 'bg-ink-200 dark:bg-ink-800')} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <Select
            label="Select Patient"
            placeholder="Choose a patient…"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} — ${p.mrn}` }))}
          />
          {selectedPatient && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-500/10">
              <Avatar src={selectedPatient.avatar} name={`${selectedPatient.firstName} ${selectedPatient.lastName}`} size="sm" />
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="text-xs text-ink-400">{selectedPatient.department} · {selectedPatient.bloodType}</p>
              </div>
            </div>
          )}
          <Select
            label="Select Doctor"
            placeholder="Choose a doctor…"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            options={doctors.filter((d) => d.status !== 'on-leave').map((d) => ({ value: d.id, label: `Dr. ${d.firstName} ${d.lastName} — ${d.specialty}` }))}
          />
          {selectedDoctor && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-50 dark:bg-accent-500/10">
              <Avatar src={selectedDoctor.avatar} name={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`} size="sm" status={selectedDoctor.status} />
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
                <p className="text-xs text-ink-400">{selectedDoctor.department} · Room {selectedDoctor.room}</p>
              </div>
            </div>
          )}
          <Select
            label="Appointment Type"
            value={type}
            onChange={(e) => setType(e.target.value as Appointment['type'])}
            options={[
              { value: 'consultation', label: 'Consultation' },
              { value: 'follow-up', label: 'Follow-up' },
              { value: 'emergency', label: 'Emergency' },
              { value: 'surgery', label: 'Surgery' },
              { value: 'checkup', label: 'Checkup' },
            ]}
          />
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <Input label="Select Date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          {date && (
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-2">Available Time Slots</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <motion.button
                    key={slot}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTime(slot)}
                    className={cn(
                      'h-11 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                      time === slot
                        ? 'border-primary-500 bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                        : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10',
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />{slot}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          <Textarea label="Reason for Visit (optional)" rows={3} placeholder="Describe the symptoms or purpose…" value={reason} onChange={(e) => setReason(e.target.value)} />
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="card-base rounded-xl p-5 space-y-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600">
                <CalIcon className="h-6 w-6" />
              </div>
              <p className="text-lg font-semibold text-ink-900 dark:text-ink-100">{formatDate(date)} at {time}</p>
              <p className="text-sm text-ink-500">Appointment confirmed with the following details:</p>
            </div>
            <div className="border-t border-ink-100 dark:border-ink-800 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar src={selectedPatient?.avatar} name={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ''} size="sm" />
                <div><p className="text-xs text-ink-400">Patient</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{selectedPatient?.firstName} {selectedPatient?.lastName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar src={selectedDoctor?.avatar} name={selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : ''} size="sm" />
                <div><p className="text-xs text-ink-400">Doctor</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-ink-50 dark:bg-ink-800/40 p-3"><p className="text-xs text-ink-400">Type</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200 capitalize">{type}</p></div>
                <div className="rounded-lg bg-ink-50 dark:bg-ink-800/40 p-3"><p className="text-xs text-ink-400">Room</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{selectedDoctor?.room}</p></div>
              </div>
              {reason && <div className="rounded-lg bg-ink-50 dark:bg-ink-800/40 p-3"><p className="text-xs text-ink-400">Reason</p><p className="text-sm text-ink-700 dark:text-ink-300">{reason}</p></div>}
            </div>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}
