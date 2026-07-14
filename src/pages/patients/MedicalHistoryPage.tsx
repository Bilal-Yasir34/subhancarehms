import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HeartPulse, Plus, FileText, Activity, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Skeleton, EmptyState, Modal, Input, Textarea } from '../../components/ui';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types';
import { formatDateTime } from '../../utils';

export function MedicalHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const [recordOpen, setRecordOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  const reload = () => {
    if (user?.patientId) {
      api.getPatient(user.patientId)
        .then(setPatient)
        .catch(() => setPatient(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [user?.patientId]);

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medical history record?')) return;
    try {
      await api.deleteMedicalRecord(id);
      toast.success('Record deleted successfully');
      reload();
    } catch (err) {
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
    } catch (err) {
      console.error(err);
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

  if (!user?.patientId) {
    return (
      <Card className="m-6">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Activity className="h-8 w-8 text-ink-400 mb-2" />
          <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-200">Profile not linked</h3>
          <p className="text-sm text-ink-500 mt-1">Your account is not linked to a patient profile. Please contact support.</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const records = patient?.medicalHistory ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Medical History</h1>
            <p className="text-sm text-ink-500">View and update your complete clinical records</p>
          </div>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRecordOpen(true)}>
          Add Record
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {records.length === 0 ? (
            <EmptyState
              icon={<HeartPulse className="h-8 w-8" />}
              title="No Medical History"
              description="You have no medical records on file. Click 'Add Record' to create one."
              className="py-12"
            />
          ) : (
            <div className="px-6 py-6">
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
                <div className="space-y-6">
                  {records.map((rec, i) => {
                    const { cleanNotes, reportUrl } = parseNotes(rec.notes);
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 ring-4 ring-white dark:ring-ink-900">
                          <HeartPulse className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 card-base rounded-lg p-5">
                          <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-ink-800 dark:text-ink-200">{rec.diagnosis}</p>
                              <span className="text-xs text-ink-400 shrink-0">{formatDateTime(rec.date)}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1"
                              onClick={() => handleDeleteRecord(rec.id)}
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-ink-500 dark:text-ink-400 mt-2"><span className="font-semibold text-ink-700 dark:text-ink-300">Treatment:</span> {rec.treatment}</p>
                          <p className="text-xs text-ink-400 mt-1"><span className="font-semibold text-ink-500 dark:text-ink-400">Doctor:</span> {rec.doctorName}</p>
                          {cleanNotes && (
                            <p className="text-sm text-ink-600 dark:text-ink-400 mt-3 p-3 rounded-lg bg-ink-50 dark:bg-ink-900/60 border border-ink-100 dark:border-ink-800 italic">
                              "{cleanNotes}"
                            </p>
                          )}
                          {reportUrl && (
                            <div className="mt-3">
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
