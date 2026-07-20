import { useAuth } from '../../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, MapPin, Droplet, Calendar, User,
  Pencil, Trash2, Activity, HeartPulse, AlertCircle, Plus, FileText, Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, Avatar, StatusBadge, Badge, Button, Skeleton, EmptyState, ConfirmDialog, Modal, Input, Textarea } from '../../components/ui';
import { PatientFormModal } from './PatientFormModal';
import { SuggestMedicineModal } from '../doctor/SuggestMedicineModal';
import { api } from '../../services/api';
import type { Patient, Prescription } from '../../types';
import { calcAge, formatDate, formatDateTime, cn } from '../../utils';
export function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [recordOpen, setRecordOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  const parseNotes = (notesText?: string) => {
    if (!notesText) return { cleanNotes: '', reportUrl: '' };
    const marker = '||PDF_REPORT||:';
    const idx = notesText.indexOf(marker);
    if (idx === -1) return { cleanNotes: notesText, reportUrl: '' };
    return {
      cleanNotes: notesText.slice(0, idx).trim(),
      reportUrl: notesText.slice(idx + marker.length).trim(),
    };
  };

  const openPdf = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddRecord = async () => {
    if (!patient) return;
    if (!diagnosis.trim()) { toast.error('Condition / Title is required'); return; }
    if (!treatment.trim()) { toast.error('Treatment details are required'); return; }
    if (!doctorName.trim()) { toast.error('Attending doctor name is required'); return; }

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
        treatment: treatment.trim(),
        doctorName: doctorName.trim(),
        notes: finalNotes.trim() || undefined,
      });

      toast.success('Medical report uploaded successfully');
      setRecordOpen(false);
      setDiagnosis('');
      setTreatment('');
      setDoctorName('');
      setNotes('');
      setPdfFile(null);
      reload();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add medical record');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this medical record?')) return;
    try {
      await api.deleteMedicalRecord(recordId);
      toast.success('Medical record deleted');
      reload();
    } catch {
      toast.error('Failed to delete medical record');
    }
  };
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);

  const loadPrescriptions = (patientId: string) => {
    api.getPrescriptions({ patientId })
      .then((res) => setPrescriptions(res.items))
      .catch(() => setPrescriptions([]));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getPatient(id)
      .then((p) => {
        setPatient(p);
        loadPrescriptions(p.id);
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
        .then((p) => {
          setPatient(p);
          loadPrescriptions(p.id);
        })
        .catch((err) => {
          console.error(err);
          setPatient(null);
        });
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    if (!window.confirm('Are you sure you want to remove this suggested medicine?')) return;
    try {
      await api.deletePrescription(prescriptionId);
      toast.success('Prescription removed');
      if (patient) loadPrescriptions(patient.id);
    } catch {
      toast.error('Failed to remove prescription');
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
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <Button size="sm" leftIcon={<Pill className="h-4 w-4" />} onClick={() => setSuggestModalOpen(true)}>
              Suggest Medicine
            </Button>
          )}
          {user?.role === 'admin' && (
            <>
              <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit</Button>
              <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>Delete</Button>
            </>
          )}
        </div>
      </div>

      {/* Profile header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="h-28 gradient-brand relative">
            <div className="absolute inset-0 bg-grid opacity-20" />
          </div>
          <CardBody className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
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
              <div className="flex items-center gap-2">
                <CardTitle>Medical History</CardTitle>
                <Badge variant="neutral">{patient.medicalHistory.length} records</Badge>
              </div>
              {user?.role === 'admin' && (
                <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setRecordOpen(true)}>
                  Upload Report
                </Button>
              )}
            </CardHeader>
            <CardBody className="p-0">
              {patient.medicalHistory.length === 0 ? (
                <EmptyState icon={<Activity className="h-8 w-8" />} title="No medical records" description="This patient has no recorded medical history yet." className="py-12" />
              ) : (
                <div className="px-5 py-4">
                  <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
                    <div className="space-y-5">
                      {patient.medicalHistory.map((rec, i) => {
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
                                {user?.role === 'admin' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1"
                                    onClick={() => handleDeleteRecord(rec.id)}
                                    title="Delete Record"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-ink-500 dark:text-ink-400 mt-1"><span className="font-semibold">Treatment:</span> {rec.treatment}</p>
                              <p className="text-xs text-ink-400 mt-1"><span className="font-semibold text-ink-500">Doctor:</span> {rec.doctorName}</p>
                              {cleanNotes && <p className="text-xs text-ink-400 mt-2 p-2 rounded bg-ink-50 dark:bg-ink-900/60 border border-ink-100 dark:border-ink-800 italic">"{cleanNotes}"</p>}
                              {reportUrl && (
                                <div className="mt-2.5">
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

          {/* Prescriptions & Suggested Medicines */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary-500" /> Prescriptions & Suggested Medicines
                </CardTitle>
                <Badge variant="neutral">{prescriptions.length}</Badge>
              </div>
              {(user?.role === 'doctor' || user?.role === 'admin') && (
                <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setSuggestModalOpen(true)}>
                  Suggest Medicine
                </Button>
              )}
            </CardHeader>
            <CardBody className="p-0">
              {prescriptions.length === 0 ? (
                <EmptyState icon={<Pill className="h-8 w-8" />} title="No prescribed medications" description="No medicines have been suggested for this patient yet." className="py-8" />
              ) : (
                <div className="divide-y divide-ink-100 dark:divide-ink-800">
                  {prescriptions.map((p) => (
                    <div key={p.id} className="p-4 flex items-start justify-between gap-4 hover:bg-ink-50/50 dark:hover:bg-ink-900/30 transition-colors">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-semibold text-ink-900 dark:text-white text-base">{p.medicationName}</span>
                          <Badge variant="primary">{p.dosage}</Badge>
                          {p.duration && <Badge variant="neutral">{p.duration}</Badge>}
                        </div>
                        <p className="text-xs text-ink-500 dark:text-ink-400">
                          Referred by <strong className="text-ink-700 dark:text-ink-200">{p.doctorName}</strong> on {formatDate(p.createdAt)}
                        </p>
                        {p.instructions && (
                          <p className="text-xs text-ink-600 dark:text-ink-300">
                            <span className="font-medium">Instructions:</span> {p.instructions}
                          </p>
                        )}
                        {p.notes && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-2 rounded-lg mt-1.5">
                            <span className="font-medium">Note:</span> {p.notes}
                          </p>
                        )}
                      </div>
                      {(user?.role === 'doctor' || user?.role === 'admin') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 shrink-0"
                          onClick={() => handleDeletePrescription(p.id)}
                          title="Remove prescription"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <SuggestMedicineModal open={suggestModalOpen} onClose={() => setSuggestModalOpen(false)} onSuccess={reload} patient={patient} />
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
    
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Upload Patient Medical Report" size="lg">
        <div className="space-y-4">
          <Input
            label="Condition / Diagnosis Title"
            placeholder="e.g. Chronic Asthma Review, Lab Blood Panel"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Treatment Provided"
              placeholder="e.g. Albuterol inhaler prescribed"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              required
            />
            <Input
              label="Attending Doctor"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
            />
          </div>
          <Textarea
            label="Clinical Notes / Findings"
            placeholder="Enter diagnosis findings or doctor recommendations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            required
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
            <Button onClick={handleAddRecord} loading={savingRecord}>Save & Upload</Button>
          </div>
        </div>
      </Modal>
  </div>
  );
}
