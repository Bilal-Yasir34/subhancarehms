import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, MapPin, Droplet, Calendar, Activity,
  HeartPulse, AlertCircle, CalendarDays, Clock, FileText, Plus, Trash2, Pill,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardBody, Avatar, StatusBadge, Badge, Button, Skeleton, EmptyState, Modal, Input, Textarea } from '../../components/ui';
import { api } from '../../services/api';
import { calcAge, formatDate, formatDateTime, cn } from '../../utils';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../../types';
import { useAsync } from '../../hooks';
import toast from 'react-hot-toast';

export function PatientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: prescriptionsData } = useAsync(
    () => (user?.patientId ? api.getPrescriptions({ patientId: user.patientId }) : Promise.resolve({ items: [], total: 0 })),
    [user?.patientId]
  );
  const prescriptions = prescriptionsData?.items ?? [];

  const [recordOpen, setRecordOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  const reload = () => {
    if (user?.patientId) {
      api.getPatient(user.patientId)
        .then(setPatient)
        .catch(() => setPatient(null));
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await api.deleteMedicalRecord(id);
      toast.success('Record deleted successfully');
      // reload patient info
      if (user?.patientId) {
        api.getPatient(user.patientId)
          .then(setPatient)
          .catch(() => setPatient(null));
      }
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleAddRecord = async () => {
    if (!patient) return;
    if (!diagnosis.trim()) { toast.error('Condition / Title is required'); return; }
    if (!notes.trim()) { toast.error('Details regarding medical history are required'); return; }

    setSavingRecord(true);
    try {
      let finalNotes = notes;
      if (pdfFile) {
        toast.loading('Uploading report PDF...', { id: 'pdf-upload' });
        const pdfUrl = await api.uploadReportPdf(pdfFile);
        finalNotes = `${notes}\n||PDF_REPORT||:${pdfUrl}`;
        toast.success('PDF uploaded', { id: 'pdf-upload' });
      }

      await api.createMedicalRecord({
        patientId: patient.id,
        diagnosis: diagnosis.trim(),
        treatment: 'Self Reported',
        doctorName: 'Self / Patient Uploaded',
        notes: finalNotes.trim() || undefined,
      });

      toast.success('Medical history record added');
      setRecordOpen(false);
      setDiagnosis('');
      setNotes('');
      setPdfFile(null);
      reload();
    } catch {
      toast.error('Failed to add record');
    } finally {
      setSavingRecord(false);
    }
  };

  const parseNotes = (notesText?: string) => {
    if (!notesText) return { cleanNotes: '', reportUrl: '' };
    const delimiter = '||PDF_REPORT||:';
    const parts = notesText.split(delimiter);
    if (parts.length > 1) {
      return { cleanNotes: parts[0].trim(), reportUrl: parts[1].trim() };
    }
    return { cleanNotes: notesText, reportUrl: '' };
  };

  const openPdf = (pdfData: string) => {
    if (pdfData.startsWith('data:application/pdf;base64,')) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<iframe src="${pdfData}" style="width:100%; height:100%; border:none;"></iframe>`
        );
      }
    } else {
      window.open(pdfData, '_blank');
    }
  };


  const { data: appointmentsData } = useAsync(
    () => api.getAppointments({ pageSize: 100 }),
    []
  );

  useEffect(() => {
    if (!user?.patientId) {
      setLoading(false);
      return;
    }
    api.getPatient(user.patientId)
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setLoading(false));
  }, [user?.patientId]);

  // Filter appointments for this patient
  const myAppointments = (appointmentsData?.items ?? []).filter(
    (a) => a.patientName === user?.name
  );
  const upcomingAppts = myAppointments
    .filter((a) => a.status === 'scheduled' && new Date(a.date) >= new Date())
    .slice(0, 5);

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const today = formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-400">{today}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
              Welcome, <span className="gradient-text">{firstName}</span>
            </h1>
          </div>
        </motion.div>
        <Card>
          <EmptyState
            icon={<User className="h-8 w-8" />}
            title="Patient profile not linked"
            description="Your account is not linked to a patient record. Please contact the clinic administration."
          />
        </Card>
      </div>
    );
  }

  const infoRows = [
    { icon: Calendar, label: 'Date of Birth', value: `${formatDate(patient.dateOfBirth)} (${calcAge(patient.dateOfBirth)} yrs)` },
    { icon: User, label: 'Gender', value: patient.gender },
    { icon: Droplet, label: 'Blood Type', value: patient.bloodType, highlight: true },
    { icon: Phone, label: 'Phone', value: patient.phone },
    { icon: Mail, label: 'Email', value: patient.email },
    { icon: MapPin, label: 'Address', value: `${patient.address}, ${patient.city}` },
    { icon: Activity, label: 'Department', value: patient.department },
    { icon: Calendar, label: 'Registered', value: formatDate(patient.createdAt) },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm text-ink-500 dark:text-ink-400">{today}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
            Welcome back, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="mt-1.5 text-ink-500 dark:text-ink-400">Here's your health overview and medical records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" leftIcon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/request-appointment')}>
            Request Appointment
          </Button>
        </div>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="overflow-hidden">
          <div className="h-28 gradient-brand relative">
            <div className="absolute inset-0 bg-grid opacity-20" />
          </div>
          <CardBody className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
              <Avatar src={patient.avatar} name={`${patient.firstName} ${patient.lastName}`} size="xl" ring className="ring-4 ring-white dark:ring-ink-900" />
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-ink-900 dark:text-white">{patient.firstName} {patient.lastName}</h2>
                  <StatusBadge status={patient.status} />
                </div>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{patient.mrn} · {patient.department}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Personal Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-400 shrink-0">
                    <row.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-400">{row.label}</p>
                    <p className={cn('text-sm font-medium text-ink-800 dark:text-ink-200 truncate', row.highlight && 'text-danger-600 dark:text-danger-400')}>{row.value}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Allergies */}
          {patient.allergies.length > 0 && (
            <Card className="border-danger-200 dark:border-danger-500/20">
              <CardHeader><CardTitle className="flex items-center gap-2 text-danger-600 dark:text-danger-400"><AlertCircle className="h-4 w-4" /> Allergies</CardTitle></CardHeader>
              <CardBody className="flex flex-wrap gap-2">
                {patient.allergies.map((a) => (
                  <Badge key={a} variant="danger">{a}</Badge>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Emergency Contact */}
          {patient.emergencyContact?.name && (
            <Card>
              <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
              <CardBody>
                <div className="flex items-center gap-3">
                  <Avatar name={patient.emergencyContact.name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{patient.emergencyContact.name}</p>
                    <p className="text-xs text-ink-400">{patient.emergencyContact.relation} · {patient.emergencyContact.phone}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column — Medical History + Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-500" /> Upcoming Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/request-appointment')}>
                Book New →
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {upcomingAppts.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-ink-400">No upcoming appointments.</p>
                ) : (
                  upcomingAppts.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center h-12 w-14 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 shrink-0">
                        <span className="text-[11px] font-semibold leading-none">{formatDate(appt.date, { month: 'short', day: 'numeric' })}</span>
                        <span className="text-xs font-bold mt-0.5">{appt.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">Dr. {appt.doctorName}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.type} · {appt.department}</p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </motion.div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          {/* Suggested Prescriptions */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary-500" /> Prescribed Medications
                </CardTitle>
                <Badge variant="neutral">{prescriptions.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/prescriptions')}>
                View All Prescriptions →
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {prescriptions.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-ink-400">No active prescribed medications.</p>
              ) : (
                <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                  {prescriptions.slice(0, 3).map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 truncate">{p.medicationName}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-400 truncate">Referred by {p.doctorName} • {formatDate(p.createdAt)}</p>
                        </div>
                      </div>
                      <Badge variant="primary" className="shrink-0">{p.dosage}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Medical History</CardTitle>
                <Badge variant="neutral">{patient.medicalHistory.length} records</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setRecordOpen(true)}>
                  Add Record
                </Button>
                {patient.medicalHistory.length > 3 && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/medical-history')}>
                    View All →
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {patient.medicalHistory.length === 0 ? (
                <EmptyState icon={<Activity className="h-8 w-8" />} title="No medical records" description="Your medical history will appear here once records are added." className="py-12" />
              ) : (
                <div className="px-5 py-4">
                  <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
                    <div className="space-y-5">
                      {patient.medicalHistory.slice(0, 5).map((rec, i) => {
                        const { cleanNotes, reportUrl } = parseNotes(rec.notes);
                        return (
                          <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="relative flex gap-4"
                          >
                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 ring-4 ring-white dark:ring-ink-900">
                              <HeartPulse className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 card-base rounded-lg p-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{rec.diagnosis}</p>
                                  <span className="text-xs text-ink-400 shrink-0">{formatDateTime(rec.date)}</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1"
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  title="Delete Record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">{rec.treatment}</p>
                              <p className="text-xs text-ink-400 mt-2">Attending: {rec.doctorName}</p>
                              {cleanNotes && <p className="text-xs text-ink-400 mt-1 italic">"{cleanNotes}"</p>}
                              {reportUrl && (
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<FileText className="h-3.5 w-3.5" />}
                                    onClick={() => openPdf(reportUrl)}
                                  >
                                    View Report PDF
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Add Medical History Details" size="lg">
        <div className="space-y-4">
          <Input
            label="Condition / Diagnosis Title"
            placeholder="e.g. Annual Health Checkup, Migraine"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          <Textarea
            label="Details regarding your medical history"
            placeholder="Enter symptoms, doctor recommendations, or details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <div>
            <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1.5">
              Upload Report PDF (Optional)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRecordOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRecord} loading={savingRecord}>Save Details</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
