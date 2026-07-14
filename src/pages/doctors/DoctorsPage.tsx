import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope, Filter, Pencil, Trash2, Star, Phone, Mail,
  LayoutGrid, Table as TableIcon, Eye, GraduationCap, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Select, Avatar, StatusBadge, Pagination, SkeletonCard, EmptyState, ConfirmDialog, Drawer, Badge } from '../../components/ui';
import { SearchBox } from '../../components/SearchBox';
import { Tabs } from '../../components/Tabs';
import { DoctorFormModal } from './DoctorFormModal';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks';
import { DEPARTMENTS, WEEK_DAYS } from '../../constants';
import type { Doctor } from '../../types';
import { formatCurrency, cn } from '../../utils';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'off-duty', label: 'Off Duty' },
  { value: 'on-leave', label: 'On Leave' },
];

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [deleteDoctor, setDeleteDoctor] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDoctors({ page, search: debouncedSearch, status, department });
      setDoctors(res.items);
      setTotal(res.total);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, department]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteDoctor) return;
    setDeleting(true);
    try {
      await api.deleteDoctor(deleteDoctor.id);
      toast.success('Doctor removed');
      setDeleteDoctor(null);
      load();
    } catch {
      toast.error('Failed to remove doctor');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Doctors</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{total} medical professionals</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            variant="pills"
            value={view}
            onChange={(v) => setView(v as 'grid' | 'table')}
            tabs={[
              { label: 'Grid', value: 'grid', icon: <LayoutGrid className="h-4 w-4" /> },
              { label: 'Table', value: 'table', icon: <TableIcon className="h-4 w-4" /> },
            ]}
          />
        </div>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBox value={search} onChange={setSearch} placeholder="Search by name, specialty, or department…" className="flex-1" />
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
          </div>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">
              <Select label="Status" options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
              <Select label="Department" options={[{ value: 'all', label: 'All Departments' }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} />
            </motion.div>
          )}
        </CardBody>
      </Card>

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <Card><CardBody className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</CardBody></Card>
        )
      ) : doctors.length === 0 ? (
        <Card><EmptyState icon={<Stethoscope className="h-8 w-8" />} title="No doctors found" description="Try adjusting your filters." /></Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {doctors.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hover className="group">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0" onClick={() => setDetailDoctor(doc)} role="button">
                      <Avatar src={doc.avatar} name={`${doc.firstName} ${doc.lastName}`} size="md" ring status={doc.status} />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900 dark:text-ink-100 truncate group-hover:text-primary-600 transition-colors">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-xs text-ink-400 truncate">{doc.specialty}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="primary" size="sm">{doc.department}</Badge>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-warning-500">
                      <Star className="h-3.5 w-3.5 fill-current" />{doc.rating}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                      <GraduationCap className="h-3.5 w-3.5 text-ink-400" />{doc.qualification} · {doc.experienceYears}y exp
                    </p>
                    <p className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                      <Phone className="h-3.5 w-3.5 text-ink-400" />{doc.phone}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">{formatCurrency(doc.fee)}<span className="text-xs font-normal text-ink-400"> /visit</span></span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailDoctor(doc)} className="p-1.5 rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 transition-colors" aria-label="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setEditDoctor(doc); setFormOpen(true); }} className="p-1.5 rounded-lg text-ink-400 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-500/15 transition-colors" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteDoctor(doc)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-800">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Doctor</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300 hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300 hidden lg:table-cell">Qualification</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300 hidden sm:table-cell">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Fee</th>
                  <th className="text-right px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {doctors.map((doc, i) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={doc.avatar} name={`${doc.firstName} ${doc.lastName}`} size="sm" status={doc.status} />
                        <div>
                          <p className="font-medium text-ink-800 dark:text-ink-200">Dr. {doc.firstName} {doc.lastName}</p>
                          <p className="text-xs text-ink-400">{doc.specialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-ink-600 dark:text-ink-400">{doc.department}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-ink-600 dark:text-ink-400">{doc.qualification}</td>
                    <td className="px-5 py-3 hidden sm:table-cell"><StatusBadge status={doc.status} /></td>
                    <td className="px-5 py-3 text-right font-medium text-ink-800 dark:text-ink-200">{formatCurrency(doc.fee)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailDoctor(doc)} className="p-1.5 rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 transition-colors" aria-label="View"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => { setEditDoctor(doc); setFormOpen(true); }} className="p-1.5 rounded-lg text-ink-400 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-500/15 transition-colors" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteDoctor(doc)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && total > 0 && <Pagination page={page} pageSize={8} total={total} onPageChange={setPage} />}

      <DoctorFormModal open={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} doctor={editDoctor} />
      <ConfirmDialog
        open={!!deleteDoctor}
        onClose={() => setDeleteDoctor(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Doctor"
        message={`Remove Dr. ${deleteDoctor?.firstName} ${deleteDoctor?.lastName} from the system?`}
        confirmText="Remove"
      />

      {/* Detail Drawer */}
      <Drawer open={!!detailDoctor} onClose={() => setDetailDoctor(null)} title="Doctor Profile" width="max-w-lg">
        {detailDoctor && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar src={detailDoctor.avatar} name={`${detailDoctor.firstName} ${detailDoctor.lastName}`} size="xl" ring status={detailDoctor.status} />
              <h2 className="mt-4 text-xl font-bold text-ink-900 dark:text-white">Dr. {detailDoctor.firstName} {detailDoctor.lastName}</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">{detailDoctor.specialty}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="primary">{detailDoctor.department}</Badge>
                <StatusBadge status={detailDoctor.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card-base rounded-lg p-4">
                <p className="text-xs text-ink-400">Experience</p>
                <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{detailDoctor.experienceYears} years</p>
              </div>
              <div className="card-base rounded-lg p-4">
                <p className="text-xs text-ink-400">Rating</p>
                <p className="text-lg font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning-400 text-warning-400" />{detailDoctor.rating}
                </p>
              </div>
              <div className="card-base rounded-lg p-4">
                <p className="text-xs text-ink-400">Patients Treated</p>
                <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{detailDoctor.patientsTreated.toLocaleString()}</p>
              </div>
              <div className="card-base rounded-lg p-4">
                <p className="text-xs text-ink-400">Consultation Fee</p>
                <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{formatCurrency(detailDoctor.fee)}</p>
              </div>
            </div>

            <div className="card-base rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">Contact & Details</p>
              {[
                { icon: GraduationCap, label: 'Qualification', value: detailDoctor.qualification },
                { icon: Phone, label: 'Phone', value: detailDoctor.phone },
                { icon: Mail, label: 'Email', value: detailDoctor.email },
                { icon: Stethoscope, label: 'Room', value: detailDoctor.room },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <row.icon className="h-4 w-4 text-ink-400 shrink-0" />
                  <span className="text-xs text-ink-400 w-24">{row.label}</span>
                  <span className="text-sm font-medium text-ink-700 dark:text-ink-300 truncate">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Weekly Schedule */}
            <div className="card-base rounded-lg p-4">
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink-400" /> Weekly Schedule
              </p>
              {detailDoctor.schedule.length === 0 ? (
                <p className="text-sm text-ink-400">No schedule set.</p>
              ) : (
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEK_DAYS.map((day) => {
                    const sched = detailDoctor.schedule.find((s) => s.day === day);
                    return (
                      <div key={day} className={cn('rounded-lg p-2 text-center', sched ? 'bg-primary-50 dark:bg-primary-500/10' : 'bg-ink-50 dark:bg-ink-800/40')}>
                        <p className="text-[10px] font-semibold text-ink-500">{day}</p>
                        {sched ? (
                          <p className="text-[9px] text-primary-600 dark:text-primary-400 mt-1 leading-tight">
                            {sched.slots[0]?.start}<br/>{sched.slots[1]?.start}
                          </p>
                        ) : (
                          <p className="text-[9px] text-ink-300 dark:text-ink-600 mt-1">Off</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
