import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Printer, HeartPulse, ShieldAlert, Plus, UploadCloud } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody, Button, Input, Textarea, Avatar, Badge, Skeleton, EmptyState, Modal } from '../../components/ui';
import { api } from '../../services/api';
import type { Patient } from '../../types';
import { formatDate, formatDateTime, calcAge } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function ReportsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  // Load patient list
  useEffect(() => {
    setLoadingList(true);
    api.getPatients({ pageSize: 100 })
      .then((res) => {
        setPatients(res.items);
        if (res.items.length > 0) {
          setSelectedPatientId(res.items[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  // Helper to load patient detail
  const loadPatientDetail = useCallback(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      return;
    }
    setLoadingDetail(true);
    api.getPatient(selectedPatientId)
      .then((p) => setSelectedPatient(p))
      .catch(() => setSelectedPatient(null))
      .finally(() => setLoadingDetail(false));
  }, [selectedPatientId]);

  // Load detailed patient reports
  useEffect(() => {
    loadPatientDetail();
  }, [loadPatientDetail]);

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
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

  const openPdf = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUploadReport = async () => {
    if (!selectedPatient) return;
    if (!diagnosis.trim()) { toast.error('Condition / Diagnosis is required'); return; }
    if (!treatment.trim()) { toast.error('Treatment is required'); return; }
    if (!doctorName.trim()) { toast.error('Doctor name is required'); return; }

    setSavingRecord(true);
    try {
      let finalNotes = notes;
      if (pdfFile) {
        toast.loading('Uploading report PDF...', { id: 'pdf-upload' });
        const pdfUrl = await api.uploadReportPdf(pdfFile);
        finalNotes = `${notes}\n||PDF_REPORT||:${pdfUrl}`;
        toast.success('PDF uploaded successfully', { id: 'pdf-upload' });
      }

      await api.createMedicalRecord({
        patientId: selectedPatient.id,
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        doctorName: doctorName.trim(),
        notes: finalNotes.trim() || undefined,
      });

      toast.success('Medical report uploaded successfully');
      setIsUploadModalOpen(false);
      setDiagnosis('');
      setTreatment('');
      setDoctorName('');
      setNotes('');
      setPdfFile(null);
      loadPatientDetail();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload report');
    } finally {
      setSavingRecord(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Patient Medical Reports</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Search and export individual patient medical files</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPatient && (
            <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrint}>
              Print Report
            </Button>
          )}
          {user?.role === 'admin' && selectedPatient && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsUploadModalOpen(true)}>
              Upload Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient List (no-print) */}
        <div className="space-y-4 lg:col-span-1 no-print">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Find Patient</CardTitle>
            </CardHeader>
            <CardBody className="pt-0">
              <Input
                placeholder="Search name or MRN…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="h-10"
              />
            </CardBody>
          </Card>

          <Card className="max-h-[600px] overflow-y-auto">
            <CardBody className="p-2 space-y-1">
              {loadingList ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              ) : filteredPatients.length === 0 ? (
                <p className="text-sm text-ink-400 p-4 text-center">No patients found</p>
              ) : (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                      selectedPatientId === p.id
                        ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100 font-medium'
                        : 'hover:bg-ink-50 dark:hover:bg-ink-800/40 text-ink-700 dark:text-ink-300'
                    }`}
                  >
                    <Avatar src={p.avatar} name={`${p.firstName} ${p.lastName}`} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-ink-400 truncate">{p.mrn}</p>
                    </div>
                  </button>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Detailed Medical Reports (Printable area) */}
        <div className="lg:col-span-2 space-y-6 print-full-width">
          {loadingDetail ? (
            <Card>
              <CardBody className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </CardBody>
            </Card>
          ) : !selectedPatient ? (
            <Card className="no-print">
              <CardBody className="py-12">
                <EmptyState
                  icon={<FileText className="h-8 w-8" />}
                  title="No patient selected"
                  description="Select a patient from the list to view their detailed medical reports."
                />
              </CardBody>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Patient Info Card */}
              <Card className="print-border-none overflow-hidden">
                {/* Print-only Clinical Header */}
                <div className="hidden print:block text-center pb-4 border-b-2 border-black mb-6">
                  <h1 className="text-2xl font-bold uppercase tracking-wide text-black">Subhan Care Clinic</h1>
                  <p className="text-xs text-ink-500 mt-1">Patient Medical File & Clinical History</p>
                </div>

                <div className="p-6 bg-gradient-to-r from-primary-600 to-accent-600 text-white flex justify-between items-start flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={selectedPatient.avatar} name={`${selectedPatient.firstName} ${selectedPatient.lastName}`} size="lg" ring className="ring-4 ring-white/20 no-print" />
                    <div>
                      <h2 className="text-xl font-bold">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                      <p className="text-sm text-white/80">{selectedPatient.mrn} · {selectedPatient.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/70">Generated on {new Date().toLocaleDateString()}</p>
                    <Badge variant="neutral" className="mt-1 capitalize text-primary-700 bg-white/95">{selectedPatient.status}</Badge>
                  </div>
                </div>

                <CardBody className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-ink-50/50 dark:bg-ink-800/20">
                  <div>
                    <span className="text-xs text-ink-400 block">Date of Birth</span>
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">{formatDate(selectedPatient.dateOfBirth)} ({calcAge(selectedPatient.dateOfBirth)} yrs)</span>
                  </div>
                  <div>
                    <span className="text-xs text-ink-400 block">Gender</span>
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-200 capitalize">{selectedPatient.gender}</span>
                  </div>
                  <div>
                    <span className="text-xs text-ink-400 block">Blood Type</span>
                    <span className="text-sm font-semibold text-danger-600 dark:text-danger-400">{selectedPatient.bloodType}</span>
                  </div>
                  <div>
                    <span className="text-xs text-ink-400 block">Contact Info</span>
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-200 block truncate">{selectedPatient.phone}</span>
                  </div>
                </CardBody>
              </Card>

              {/* Medical History Section */}
              <Card>
                <CardHeader className="border-b border-ink-100 dark:border-ink-800 flex justify-between items-center flex-wrap gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary-500" /> Diagnosis & Treatment Reports
                  </CardTitle>
                  {user?.role === 'admin' && (
                    <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setIsUploadModalOpen(true)} className="no-print">
                      Add Report
                    </Button>
                  )}
                </CardHeader>
                <CardBody className="p-0">
                  {selectedPatient.medicalHistory.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="h-6 w-6" />}
                      title="No medical history"
                      description="There are no medical records found for this patient."
                      className="py-12"
                    />
                  ) : (
                    <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                      {selectedPatient.medicalHistory.map((rec) => {
                        const { cleanNotes, reportUrl } = parseNotes(rec.notes);
                        return (
                          <div key={rec.id} className="p-5 hover:bg-ink-50/20 dark:hover:bg-ink-800/10 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-semibold text-ink-900 dark:text-ink-100">{rec.diagnosis}</h3>
                              <span className="text-xs text-ink-400 shrink-0">{formatDateTime(rec.date)}</span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-ink-700 dark:text-ink-300">
                                <span className="text-xs text-ink-400 font-medium mr-1.5">Treatment:</span> {rec.treatment}
                              </p>
                              {cleanNotes && (
                                <p className="text-sm text-ink-600 dark:text-ink-400 italic">
                                  <span className="text-xs text-ink-400 font-medium mr-1.5">Notes:</span> "{cleanNotes}"
                                </p>
                              )}
                              {reportUrl && (
                                <div className="mt-2.5 no-print">
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
                              <p className="text-xs text-ink-400 mt-2">
                                Attending Doctor: <span className="font-medium text-ink-600 dark:text-ink-300">{rec.doctorName}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Allergies & Alerts */}
              {selectedPatient.allergies.length > 0 && (
                <Card className="border-danger-200 dark:border-danger-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-danger-600 dark:text-danger-400 flex items-center gap-1.5 font-bold uppercase tracking-wide">
                      <ShieldAlert className="h-4 w-4" /> Medical Alerts & Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="pt-0 flex flex-wrap gap-1.5">
                    {selectedPatient.allergies.map((allergy) => (
                      <Badge key={allergy} variant="danger">{allergy}</Badge>
                    ))}
                  </CardBody>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Admin Upload Report Modal */}
      {selectedPatient && (
        <Modal open={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={`Upload Report for ${selectedPatient.firstName} ${selectedPatient.lastName}`} size="lg">
          <div className="space-y-4">
            <Input
              label="Condition / Diagnosis"
              placeholder="e.g. Chronic Hypertension, Post-op Review"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
            <Input
              label="Treatment Plan / Action"
              placeholder="e.g. Prescribed Lisinopril 10mg daily, bed rest"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              required
            />
            <Input
              label="Attending Doctor"
              placeholder="e.g. Dr. Robert Anderson"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
            />
            <Textarea
              label="Additional Notes (Optional)"
              placeholder="Enter symptoms, precautions, clinical findings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            <div>
              <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1.5">
                Upload Report PDF (Optional)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-ink-300 dark:border-ink-700 rounded-xl cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800/20 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-ink-400" />
                    <p className="mb-1 text-sm text-ink-500 dark:text-ink-400 font-semibold">
                      {pdfFile ? pdfFile.name : 'Click to upload PDF report'}
                    </p>
                    <p className="text-xs text-ink-400">PDF files only (max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadReport} loading={savingRecord}>
                Upload Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

