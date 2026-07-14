import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CalendarPlus, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardBody, Avatar, StatusBadge, Badge, Button, EmptyState, Select, Input, Textarea } from '../../components/ui';
import { Modal } from '../../components/ui';
import { api } from '../../services/api';
import { useAsync } from '../../hooks';
import { formatDate } from '../../utils';
import { TIME_SLOTS } from '../../constants';
import type { Doctor, Appointment } from '../../types';

export function PatientRequestAppointmentPage() {
  const { user } = useAuth();
  const [bookOpen, setBookOpen] = useState(false);

  const { data: appointmentsData, reload } = useAsync(
    () => api.getAppointments({ pageSize: 100 }),
    []
  );

  // Filter appointments for this patient
  const myAppointments = (appointmentsData?.items ?? []).filter(
    (a) => a.patientName === user?.name
  );
  const upcomingAppts = myAppointments.filter(
    (a) => a.status === 'scheduled' && new Date(a.date) >= new Date()
  );
  const pastAppts = myAppointments.filter(
    (a) => a.status !== 'scheduled' || new Date(a.date) < new Date()
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Request an Appointment</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Book a new appointment or view your scheduled visits.</p>
        </div>
        <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => setBookOpen(true)}>
          Book Appointment
        </Button>
      </motion.div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-500" /> Upcoming Appointments
          </CardTitle>
          <Badge variant="primary">{upcomingAppts.length} upcoming</Badge>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
            {upcomingAppts.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<CalendarDays className="h-8 w-8" />}
                  title="No upcoming appointments"
                  description="Book an appointment to get started."
                  action={<Button size="sm" onClick={() => setBookOpen(true)}>Book Now</Button>}
                />
              </div>
            ) : (
              upcomingAppts.map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center h-14 w-16 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 shrink-0">
                    <span className="text-[11px] font-semibold leading-none">{formatDate(appt.date, { month: 'short', day: 'numeric' })}</span>
                    <span className="text-sm font-bold mt-0.5">{appt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">Dr. {appt.doctorName}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.type} · {appt.department}</p>
                    {appt.reason && <p className="text-xs text-ink-400 mt-1 truncate">{appt.reason}</p>}
                  </div>
                  <StatusBadge status={appt.status} />
                </motion.div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Past Appointments */}
      {pastAppts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-ink-400" /> Past Appointments
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
              {pastAppts.slice(0, 10).map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center h-12 w-14 rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-500 dark:text-ink-400 shrink-0">
                    <span className="text-[10px] font-semibold leading-none">{formatDate(appt.date, { month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs font-bold mt-0.5">{appt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">Dr. {appt.doctorName}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.type} · {appt.department}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Simple Book Modal for Patient */}
      <PatientBookModal open={bookOpen} onClose={() => setBookOpen(false)} onSuccess={() => { reload(); setBookOpen(false); }} userName={user?.name ?? ''} />
    </div>
  );
}

// Simplified booking modal for patients (no patient selection step)
function PatientBookModal({ open, onClose, onSuccess, userName }: { open: boolean; onClose: () => void; onSuccess: () => void; userName: string }) {
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<Appointment['type']>('consultation');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    if (open) {
      setDoctorId(''); setDate(''); setTime(''); setType('consultation'); setReason('');
      api.getDoctors({ pageSize: 100 }).then((r) => setDoctors(r.items)).catch(() => {});
    }
  }, [open]);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!selectedDoctor || !date || !time) return;
    setLoading(true);
    try {
      await api.createAppointment({
        patientId: '',
        patientName: userName,
        patientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
        doctorId: selectedDoctor.id,
        doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        department: selectedDoctor.department,
        date,
        time,
        durationMin: 30,
        status: 'scheduled',
        type,
        reason,
        room: selectedDoctor.room,
      });
      toast.success('Appointment request submitted!');
      onSuccess();
    } catch {
      toast.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = doctorId && date && time;

  return (
    <Modal open={open} onClose={onClose} title="Book an Appointment" size="lg">
      <div className="space-y-5 p-1">
        <Select
          label="Select Doctor"
          options={[
            { value: '', label: 'Choose a doctor…' },
            ...doctors.map((d) => ({
              value: d.id,
              label: `Dr. ${d.firstName} ${d.lastName} — ${d.specialty} (${d.department})`,
            })),
          ]}
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        />

        {selectedDoctor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20">
            <Avatar src={selectedDoctor.avatar} name={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`} size="md" />
            <div>
              <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">{selectedDoctor.specialty} · {selectedDoctor.department} · Room {selectedDoctor.room}</p>
              <p className="text-xs text-ink-400 mt-0.5">Fee: Rs. {selectedDoctor.fee}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
          <Select
            label="Time Slot"
            options={[
              { value: '', label: 'Select time…' },
              ...TIME_SLOTS.map((t) => ({ value: t, label: t })),
            ]}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <Select
          label="Appointment Type"
          options={[
            { value: 'consultation', label: 'Consultation' },
            { value: 'follow-up', label: 'Follow-up' },
            { value: 'checkup', label: 'Checkup' },
            { value: 'emergency', label: 'Emergency' },
          ]}
          value={type}
          onChange={(e) => setType(e.target.value as Appointment['type'])}
        />

        <Textarea label="Reason / Notes" placeholder="Briefly describe your concern…" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!canSubmit} leftIcon={<Check className="h-4 w-4" />}>
            Submit Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
