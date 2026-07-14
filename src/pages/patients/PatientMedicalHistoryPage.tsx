import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, HeartPulse, ClipboardList, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardBody, Badge, Skeleton, EmptyState, Button } from '../../components/ui';
import { api } from '../../services/api';
import { formatDateTime } from '../../utils';
import type { Patient } from '../../types';

export function PatientMedicalHistoryPage() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary-500" /> Medical History
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Complete record of your diagnoses and treatments.</p>
      </motion.div>

      {!patient ? (
        <Card>
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="Patient profile not linked"
            description="Your account is not linked to a patient record. Please contact the clinic."
          />
        </Card>
      ) : patient.medicalHistory.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="No medical records"
            description="Your medical history will appear here once records are added by your doctor."
            className="py-16"
          />
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>All Records</CardTitle>
            <Badge variant="neutral">{patient.medicalHistory.length} records</Badge>
          </CardHeader>
          <CardBody className="p-0">
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
                        transition={{ delay: i * 0.06 }}
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 ring-4 ring-white dark:ring-ink-900">
                          <HeartPulse className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 card-base rounded-lg p-4">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{rec.diagnosis}</p>
                            <span className="text-xs text-ink-400 shrink-0">{formatDateTime(rec.date)}</span>
                          </div>
                          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1.5">{rec.treatment}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
                            <span>Attending: <span className="font-medium text-ink-600 dark:text-ink-300">{rec.doctorName}</span></span>
                          </div>
                          {cleanNotes && (
                            <div className="mt-3 p-2.5 rounded-lg bg-ink-50 dark:bg-ink-800/50 border border-ink-100 dark:border-ink-800">
                              <p className="text-xs text-ink-500 dark:text-ink-400 italic">"{cleanNotes}"</p>
                            </div>
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
          </CardBody>
        </Card>
      )}
    </div>
  );
}
