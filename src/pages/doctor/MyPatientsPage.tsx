import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, Search, Eye, Phone, Mail, Pill } from 'lucide-react';
import { Card, CardBody, Input, Badge, Avatar, SkeletonCard, EmptyState, StatusBadge, Button } from '../../components/ui';
import { SuggestMedicineModal } from './SuggestMedicineModal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks';
import { formatDate } from '../../utils';
import type { Patient } from '../../types';

export function MyPatientsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [suggestingPatient, setSuggestingPatient] = useState<Patient | null>(null);

  const { data: allPatients, loading } = useAsync(() => api.getPatients({ pageSize: 200 }), []);
  const { data: appointments } = useAsync(() => api.getAppointments({ pageSize: 200 }), []);

  // Filter patients to those who have appointments with this doctor
  const doctorAppts = (appointments?.items ?? []).filter((a) => a.doctorId === user?.doctorId);
  const myPatientIds = new Set(doctorAppts.map((a) => a.patientId));
  const myPatients = (allPatients?.items ?? []).filter((p) => myPatientIds.has(p.id));

  const filtered = myPatients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">My Patients</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Patients under your care — {myPatients.length} total</p>
      </div>

      <Card>
        <CardBody className="p-4 sm:p-5">
          <Input
            placeholder="Search by name or MRN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="mb-4 max-w-sm"
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-48" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<HeartPulse className="h-10 w-10" />} title="No patients yet" description="Your assigned patients will appear here once appointments are booked." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((patient, i) => (
                <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="h-full hover:shadow-lg transition-shadow flex flex-col justify-between">
                    <CardBody className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-3">
                          <Avatar src={patient.avatar} name={`${patient.firstName} ${patient.lastName}`} size="lg" ring />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-ink-900 dark:text-ink-100 truncate">{patient.firstName} {patient.lastName}</p>
                            <p className="text-xs text-ink-400 font-mono">{patient.mrn}</p>
                          </div>
                          <StatusBadge status={patient.status} />
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <p className="text-ink-500 dark:text-ink-400 flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" /> {patient.phone}
                          </p>
                          <p className="text-ink-500 dark:text-ink-400 flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5" /> {patient.email}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-ink-400 flex-wrap">
                            <Badge variant="primary">{patient.bloodType}</Badge>
                            <span>{patient.department}</span>
                            <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Pill className="h-3.5 w-3.5" />}
                          onClick={() => setSuggestingPatient(patient)}
                        >
                          Suggest Med
                        </Button>
                        <Link
                          to={`/patients/${patient.id}`}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/15 py-1.5 px-3 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/25 transition-colors text-center"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {suggestingPatient && (
        <SuggestMedicineModal
          open={!!suggestingPatient}
          onClose={() => setSuggestingPatient(null)}
          onSuccess={() => setSuggestingPatient(null)}
          patient={suggestingPatient}
        />
      )}
    </div>
  );
}

