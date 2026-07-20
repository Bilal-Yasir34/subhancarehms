import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Search, Calendar, User, Clock, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardBody, Input, Badge, EmptyState, SkeletonCard } from '../../components/ui';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils';
import type { Prescription } from '../../types';

export function PrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getPrescriptions({ patientId: user.patientId })
      .then((res) => setPrescriptions(res.items))
      .catch((err) => {
        console.error(err);
        setPrescriptions([]);
      })
      .finally(() => setLoading(false));
  }, [user?.patientId]);

  const filtered = prescriptions.filter((p) =>
    p.medicationName.toLowerCase().includes(search.toLowerCase()) ||
    p.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    p.dosage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white flex items-center gap-2.5">
            <Pill className="h-7 w-7 text-primary-500" /> My Prescriptions
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            View medications suggested by your attending doctors along with dosage instructions and important notes.
          </p>
        </div>
      </motion.div>

      <Card>
        <CardBody className="p-4 sm:p-5">
          <Input
            placeholder="Search by medicine name, doctor, or dosage…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="mb-5 max-w-md"
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} className="h-44" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Pill className="h-10 w-10 text-primary-500" />}
              title={search ? "No matching prescriptions" : "No prescribed medications yet"}
              description={search ? "Try searching for a different term." : "Your doctor's suggested medicines and referral notes will appear here once prescribed."}
              className="py-12"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full border-ink-200/80 dark:border-ink-800 hover:shadow-md transition-all">
                    <CardBody className="p-5 flex flex-col justify-between space-y-4">
                      {/* Top section: Medicine name & badges */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-ink-900 dark:text-white text-lg leading-snug">
                                {item.medicationName}
                              </h3>
                              <p className="text-xs text-ink-400 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3.5 w-3.5" /> Referred on {formatDate(item.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="success" className="shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Prescribed
                          </Badge>
                        </div>

                        {/* Dosage & Duration pills */}
                        <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
                          <div className="px-2.5 py-1 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-800 dark:text-ink-200 font-medium flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-ink-400" />
                            <span>Dosage: {item.dosage}</span>
                          </div>
                          {item.duration && (
                            <div className="px-2.5 py-1 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 font-medium">
                              Duration: {item.duration}
                            </div>
                          )}
                        </div>

                        {/* Instructions */}
                        {item.instructions && (
                          <div className="mt-3 text-xs text-ink-600 dark:text-ink-300 bg-ink-50 dark:bg-ink-900/60 p-2.5 rounded-lg border border-ink-100 dark:border-ink-800">
                            <span className="font-semibold text-ink-800 dark:text-ink-200">Instructions: </span>
                            {item.instructions}
                          </div>
                        )}

                        {/* Doctor notes / Important info */}
                        {item.notes && (
                          <div className="mt-2.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Important Notes: </span>
                              {item.notes}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Doctor footer */}
                      <div className="pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
                        <span className="flex items-center gap-1.5 font-medium text-ink-700 dark:text-ink-300">
                          <User className="h-3.5 w-3.5 text-ink-400" /> {item.doctorName}
                        </span>
                        <span className="text-[11px] text-ink-400">Hospital Pharmacy Stocked</span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
