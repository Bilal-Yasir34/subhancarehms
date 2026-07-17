import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, CalendarDays, Filter, Eye, CheckCircle2,
  XCircle, Clock, Calendar as CalIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, Button, Select, Avatar, StatusBadge, Pagination, SkeletonCard, EmptyState, ConfirmDialog, Modal, Badge } from '../../components/ui';
import { SearchBox } from '../../components/SearchBox';
import { Tabs } from '../../components/Tabs';
import { BookAppointmentModal } from './BookAppointmentModal';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks';
import type { Appointment } from '../../types';
import { formatDate, cn } from '../../utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' },
];

export function AppointmentsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [calAppts, setCalAppts] = useState<Appointment[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [calSelected, setCalSelected] = useState<Date | null>(new Date());

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.getAppointments>[0] = { page, search: debouncedSearch, status };
      if (user?.role === 'doctor' && user?.doctorId) {
        params.doctorId = user.doctorId;
      }
      const res = await api.getAppointments(params);
      setAppointments(res.items);
      setTotal(res.total);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, user]);

  useEffect(() => {
    load();
    const params: Parameters<typeof api.getAppointments>[0] = { pageSize: 200 };
    if (user?.role === 'doctor' && user?.doctorId) {
      params.doctorId = user.doctorId;
    }
    api.getAppointments(params).then((r) => setCalAppts(r.items)).catch(() => {});
  }, [load, user]);

  const handleCancel = async () => {
    if (!cancelAppt) return;
    setCanceling(true);
    try {
      await api.updateAppointmentStatus(cancelAppt.id, 'cancelled');
      toast.success('Appointment cancelled');
      setCancelAppt(null);
      load();
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setCanceling(false);
    }
  };

  const handleStatusChange = async (appt: Appointment, newStatus: Appointment['status']) => {
    try {
      await api.updateAppointmentStatus(appt.id, newStatus);
      toast.success(`Marked as ${newStatus}`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Calendar helpers
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const apptsByDate = new Map<string, Appointment[]>();
  calAppts.forEach((a) => {
    const key = new Date(a.date).toDateString();
    if (!apptsByDate.has(key)) apptsByDate.set(key, []);
    apptsByDate.get(key)!.push(a);
  });

  const selectedDayAppts = calSelected ? (apptsByDate.get(calSelected.toDateString()) ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Appointments</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{total} total appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            variant="pills"
            value={view}
            onChange={(v) => setView(v as 'list' | 'calendar')}
            tabs={[
              { label: 'List', value: 'list', icon: <CalendarDays className="h-4 w-4" /> },
              { label: 'Calendar', value: 'calendar', icon: <CalIcon className="h-4 w-4" /> },
            ]}
          />
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setBookOpen(true)}>Book</Button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchBox value={search} onChange={setSearch} placeholder="Search by patient or doctor name…" className="flex-1" />
                <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
              </div>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                  <Select label="Status" options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
                </motion.div>
              )}
            </CardBody>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : appointments.length === 0 ? (
            <Card><EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No appointments found" description="Try adjusting filters or book a new appointment." action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setBookOpen(true)}>Book Appointment</Button>} /></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {appointments.map((appt, i) => (
                <motion.div key={appt.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card hover className="group">
                    <CardBody className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 shrink-0">
                          <span className="text-lg font-bold leading-none">{new Date(appt.date).getDate()}</span>
                          <span className="text-[10px] mt-1 uppercase">{MONTHS[new Date(appt.date).getMonth()].slice(0, 3)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {appt.patientId ? (
                                <Link to={`/patients/${appt.patientId}`} className="font-semibold text-ink-900 dark:text-ink-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block">
                                  {appt.patientName}
                                </Link>
                              ) : (
                                <p className="font-semibold text-ink-900 dark:text-ink-100 truncate">{appt.patientName}</p>
                              )}
                              <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.doctorName} · {appt.department}</p>
                            </div>
                            <StatusBadge status={appt.status} pulse={appt.status === 'in-progress'} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-ink-500 dark:text-ink-400">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{appt.time} · {appt.durationMin}m</span>
                            <Badge variant="neutral" size="sm" className="capitalize">{appt.type}</Badge>
                            {appt.room && <span>Room {appt.room}</span>}
                          </div>
                          <p className="text-xs text-ink-400 mt-2 truncate">{appt.reason}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between">
                        <button onClick={() => setDetailAppt(appt)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 transition-colors">
                          <Eye className="h-3.5 w-3.5" /> Details
                        </button>
                        {appt.status === 'scheduled' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleStatusChange(appt, 'completed')} className="p-1.5 rounded-lg text-ink-400 hover:bg-secondary-50 hover:text-secondary-600 dark:hover:bg-secondary-500/15 transition-colors" aria-label="Mark complete"><CheckCircle2 className="h-4 w-4" /></button>
                            <button onClick={() => setCancelAppt(appt)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Cancel"><XCircle className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && total > 0 && <Pagination page={page} pageSize={8} total={total} onPageChange={setPage} />}
        </>
      ) : (
        // Calendar view
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{MONTHS[month]} {year}</CardTitle>
              <div className="flex items-center gap-1">
                <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-ink-400 py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const d = new Date(year, month, day);
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isSelected = calSelected?.toDateString() === d.toDateString();
                  const dayAppts = apptsByDate.get(d.toDateString()) ?? [];
                  return (
                    <button
                      key={i}
                      onClick={() => setCalSelected(d)}
                      className={cn(
                        'relative min-h-[72px] sm:min-h-[88px] rounded-lg p-1.5 text-left transition-all border',
                        isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-ink-100 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700',
                        isToday && !isSelected && 'ring-1 ring-primary-300',
                      )}
                    >
                      <span className={cn('text-xs font-medium', isToday ? 'text-primary-600 dark:text-primary-400' : 'text-ink-600 dark:text-ink-400')}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayAppts.slice(0, 3).map((a) => (
                          <div key={a.id} className={cn('text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate font-medium', a.status === 'completed' ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-300' : a.status === 'cancelled' ? 'bg-danger-100 text-danger-700 dark:bg-danger-500/20 dark:text-danger-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300')}>
                            {a.time} {a.patientName.split(' ')[0]}
                          </div>
                        ))}
                        {dayAppts.length > 3 && <p className="text-[9px] text-ink-400 px-1">+{dayAppts.length - 3} more</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Day detail panel */}
          <Card>
            <CardHeader>
              <CardTitle>{calSelected ? formatDate(calSelected, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a date'}</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {selectedDayAppts.length === 0 ? (
                <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No appointments" description="No appointments scheduled for this day." className="py-12" />
              ) : (
                <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                  {selectedDayAppts.map((appt) => (
                    <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors">
                      <div className="flex flex-col items-center justify-center h-10 w-12 rounded-lg bg-ink-100 dark:bg-ink-800 shrink-0">
                        <span className="text-xs font-bold text-ink-700 dark:text-ink-300">{appt.time}</span>
                      </div>
                      {appt.patientId ? (
                        <>
                          <Link to={`/patients/${appt.patientId}`}>
                            <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" className="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer" />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to={`/patients/${appt.patientId}`} className="text-sm font-medium text-ink-800 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block">
                              {appt.patientName}
                            </Link>
                            <p className="text-xs text-ink-400 truncate mt-0.5">{appt.doctorName}</p>
                            <div className="mt-1.5 flex">
                              <StatusBadge status={appt.status} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{appt.patientName}</p>
                            <p className="text-xs text-ink-400 truncate mt-0.5">{appt.doctorName}</p>
                            <div className="mt-1.5 flex">
                              <StatusBadge status={appt.status} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <BookAppointmentModal open={bookOpen} onClose={() => setBookOpen(false)} onSuccess={load} />
      <ConfirmDialog
        open={!!cancelAppt}
        onClose={() => setCancelAppt(null)}
        onConfirm={handleCancel}
        loading={canceling}
        title="Cancel Appointment"
        message={`Cancel ${cancelAppt?.patientName}'s appointment with ${cancelAppt?.doctorName}?`}
        confirmText="Cancel Appointment"
      />

      {/* Detail modal */}
      <Modal
        open={!!detailAppt}
        onClose={() => setDetailAppt(null)}
        title="Appointment Details"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setDetailAppt(null)}>Close</Button>
            {detailAppt?.status === 'scheduled' && (
              <Button variant="danger" onClick={() => { setCancelAppt(detailAppt); setDetailAppt(null); }} leftIcon={<XCircle className="h-4 w-4" />}>Cancel Appointment</Button>
            )}
          </>
        }
      >
        {detailAppt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {detailAppt.patientId ? (
                <>
                  <Link to={`/patients/${detailAppt.patientId}`} onClick={() => setDetailAppt(null)}>
                    <Avatar src={detailAppt.patientAvatar} name={detailAppt.patientName} size="lg" className="hover:ring-4 hover:ring-primary-500/25 transition-all cursor-pointer" />
                  </Link>
                  <div>
                    <Link to={`/patients/${detailAppt.patientId}`} onClick={() => setDetailAppt(null)} className="font-semibold text-ink-900 dark:text-ink-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors block">
                      {detailAppt.patientName}
                    </Link>
                    <p className="text-sm text-ink-500">{detailAppt.doctorName}</p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar src={detailAppt.patientAvatar} name={detailAppt.patientName} size="lg" />
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-ink-100">{detailAppt.patientName}</p>
                    <p className="text-sm text-ink-500">{detailAppt.doctorName}</p>
                  </div>
                </>
              )}
              <StatusBadge status={detailAppt.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">Date</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{formatDate(detailAppt.date)}</p></div>
              <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">Time</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{detailAppt.time} ({detailAppt.durationMin}m)</p></div>
              <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">Department</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{detailAppt.department}</p></div>
              <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">Room</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{detailAppt.room}</p></div>
              <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">Type</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200 capitalize">{detailAppt.type}</p></div>
              <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">ID</p><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{detailAppt.id}</p></div>
            </div>
            {detailAppt.reason && <div className="card-base rounded-lg p-3"><p className="text-xs text-ink-400">Reason</p><p className="text-sm text-ink-700 dark:text-ink-300">{detailAppt.reason}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
