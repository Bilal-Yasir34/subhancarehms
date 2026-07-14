import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, MapPin, Droplet, Calendar, User,
  Pencil, Trash2, Activity, HeartPulse, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, Avatar, StatusBadge, Badge, Button, Skeleton, EmptyState, ConfirmDialog } from '../../components/ui';
import { PatientFormModal } from './PatientFormModal';
import { api } from '../../services/api';
import type { Patient } from '../../types';
import { calcAge, formatDate, formatDateTime, cn } from '../../utils';
export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getPatient(id)
      .then((p) => {
        setPatient(p);
      })
      .catch((err) => {
        console.error(err);
        setPatient(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const reload = () => {
    if (id) {
      api.getPatient(id)
        .then(setPatient)
        .catch((err) => {
          console.error(err);
          setPatient(null);
        });
    }
  };

  const handleDelete = async () => {
    if (!patient) return;
    setDeleting(true);
    try {
      await api.deletePatient(patient.id);
      toast.success('Patient deleted');
      navigate('/patients');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

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
    return <Card><EmptyState title="Patient not found" description="This patient may have been removed." action={<Button onClick={() => navigate('/patients')}>Back to Patients</Button>} /></Card>;
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
      <div className="flex items-center justify-between gap-4">
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      {/* Profile header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="h-28 gradient-brand relative">
            <div className="absolute inset-0 bg-grid opacity-20" />
          </div>
          <CardBody className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <Avatar src={patient.avatar} name={`${patient.firstName} ${patient.lastName}`} size="xl" ring className="ring-4 ring-white dark:ring-ink-900" />
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-ink-900 dark:text-white">{patient.firstName} {patient.lastName}</h1>
                  <StatusBadge status={patient.status} />
                </div>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{patient.mrn} · {patient.department}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
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

          <Card>
            <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
            <CardBody>
              {patient.emergencyContact?.name ? (
                <div className="flex items-center gap-3">
                  <Avatar name={patient.emergencyContact.name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{patient.emergencyContact.name}</p>
                    <p className="text-xs text-ink-400">{patient.emergencyContact.relation} · {patient.emergencyContact.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-400">No emergency contact details provided.</p>
              )}
            </CardBody>
          </Card>



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
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {patient.admittedOn && (
            <Card>
              <CardBody className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400">
                  <HeartPulse className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Admitted on {formatDate(patient.admittedOn)}</p>
                  <p className="text-xs text-ink-400">Currently in {patient.department} department</p>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Medical History</CardTitle>
              <Badge variant="neutral">{patient.medicalHistory.length} records</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {patient.medicalHistory.length === 0 ? (
                <EmptyState icon={<Activity className="h-8 w-8" />} title="No medical records" description="This patient has no recorded medical history yet." className="py-12" />
              ) : (
                <div className="px-5 py-4">
                  <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
                    <div className="space-y-5">
                      {patient.medicalHistory.map((rec, i) => (
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
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{rec.diagnosis}</p>
                              <span className="text-xs text-ink-400 shrink-0">{formatDateTime(rec.date)}</span>
                            </div>
                            <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">{rec.treatment}</p>
                            <p className="text-xs text-ink-400 mt-2">Attending: {rec.doctorName}</p>
                            {rec.notes && <p className="text-xs text-ink-400 mt-1 italic">"{rec.notes}"</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <PatientFormModal open={editOpen} onClose={() => setEditOpen(false)} onSuccess={reload} patient={patient} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Patient"
        message={`Delete ${patient.firstName} ${patient.lastName}? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
