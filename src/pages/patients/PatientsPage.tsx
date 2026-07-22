import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Filter, Eye, Pencil, Trash2, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Select, Avatar, StatusBadge, Pagination, SkeletonCard, EmptyState, ConfirmDialog } from '../../components/ui';
import { SearchBox } from '../../components/SearchBox';
import { PatientFormModal } from './PatientFormModal';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks';
import { DEPARTMENTS } from '../../constants';
import type { Patient } from '../../types';
import { calcAge } from '../../utils';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'discharged', label: 'Discharged' },
  { value: 'emergency', label: 'Emergency' },
];

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<string[]>(DEPARTMENTS);

  useEffect(() => {
    api.getDepartments().then((list) => {
      if (list.length > 0) {
        setDepartmentsList(list.map(d => d.name));
      }
    }).catch(() => console.warn('Failed to load departments'));
  }, []);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPatients({ page, search: debouncedSearch, status, department });
      setPatients(res.items);
      setTotal(res.total);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, department]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deletePatient) return;
    setDeleting(true);
    try {
      await api.deletePatient(deletePatient.id);
      toast.success('Patient deleted');
      setDeletePatient(null);
      load();
    } catch {
      toast.error('Failed to delete patient');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Patients</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{total} registered patients</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBox value={search} onChange={setSearch} placeholder="Search by name, MRN, or email…" className="flex-1" />
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>
              Filters
            </Button>
          </div>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">
              <Select label="Status" options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
              <Select label="Department" options={[{ value: 'all', label: 'All Departments' }, ...departmentsList.map((d) => ({ value: d, label: d }))]} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} />
            </motion.div>
          )}
        </CardBody>
      </Card>

      {/* Patient cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : patients.length === 0 ? (
        <Card><EmptyState icon={<Users className="h-8 w-8" />} title="No patients found" description="Try adjusting your filters." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {patients.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card hover className="group">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Link to={`/patients/${p.id}`} className="flex items-center gap-3 min-w-0 w-full">
                      <Avatar src={p.avatar} name={`${p.firstName} ${p.lastName}`} size="md" ring />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900 dark:text-ink-100 truncate group-hover:text-primary-600 transition-colors">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-ink-400">{p.mrn}</p>
                      </div>
                    </Link>
                  </div>

                  <div className="mb-3">
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                      <span className="text-xs font-medium text-ink-400 w-16">Age</span>
                      <span>{calcAge(p.dateOfBirth)} yrs · {p.gender}</span>
                    </p>
                    <p className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
                      <span className="text-xs font-medium text-ink-400 w-16">Blood</span>
                      <span className="font-medium text-danger-600 dark:text-danger-400">{p.bloodType}</span>
                    </p>
                    <p className="flex items-center gap-2 text-ink-500 dark:text-ink-400 truncate">
                      <Phone className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                      <span className="truncate">{p.phone}</span>
                    </p>
                    <p className="flex items-center gap-2 text-ink-500 dark:text-ink-400 truncate">
                      <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                      <span className="truncate">{p.city}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between">
                    <span className="text-xs text-ink-400">{p.department}</span>
                    <div className="flex items-center gap-1">
                      <Link to={`/patients/${p.id}`} className="p-1.5 rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 transition-colors" aria-label="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button onClick={() => { setEditPatient(p); setFormOpen(true); }} className="p-1.5 rounded-lg text-ink-400 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-500/15 transition-colors" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeletePatient(p)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <Pagination page={page} pageSize={8} total={total} onPageChange={setPage} />
      )}

      <PatientFormModal open={formOpen} onClose={() => setFormOpen(false)} onSuccess={load} patient={editPatient} />
      <ConfirmDialog
        open={!!deletePatient}
        onClose={() => setDeletePatient(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deletePatient?.firstName} ${deletePatient?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
