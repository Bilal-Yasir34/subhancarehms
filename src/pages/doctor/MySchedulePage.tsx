import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock, MapPin } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle, Avatar, StatusBadge, SkeletonCard, EmptyState } from '../../components/ui';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks';
import { formatDate } from '../../utils';
import type { AppointmentStatus, Appointment } from '../../types';

export function MySchedulePage() {
  const { user } = useAuth();

  const { data: apptData, loading } = useAsync(
    () => api.getAppointments({ pageSize: 100, doctorId: user?.doctorId }),
    [user?.doctorId],
  );

  const appointments = (apptData?.items ?? []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const today = appointments.filter((a) => new Date(a.date).toDateString() === new Date().toDateString());
  const upcoming = appointments.filter((a) => new Date(a.date) > new Date() && new Date(a.date).toDateString() !== new Date().toDateString()).slice(0, 10);
  const past = appointments.filter((a) => new Date(a.date) < new Date()).slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">My Schedule</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Your appointments overview</p>
      </div>

      <ScheduleSection title="Today's Appointments" icon={<CalendarClock className="h-5 w-5" />} appointments={today} loading={loading} emptyMessage="No appointments scheduled for today." />

      <ScheduleSection title="Upcoming" icon={<Clock className="h-5 w-5" />} appointments={upcoming} loading={loading} emptyMessage="No upcoming appointments." />

      <ScheduleSection title="Recent" icon={<Clock className="h-5 w-5" />} appointments={past} loading={loading} emptyMessage="No recent appointments." />
    </div>
  );
}

function ScheduleSection({ title, icon, appointments, loading, emptyMessage }: {
  title: string;
  icon: React.ReactNode;
  appointments: Appointment[];
  loading: boolean;
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            {icon}
            {title}
            <span className="text-sm font-normal text-ink-400">({appointments.length})</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} className="h-16" />)}
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-8 w-8" />} title={emptyMessage} />
        ) : (
          <div className="space-y-2">
            {appointments.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-xl border border-ink-100 dark:border-ink-800 p-3 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors"
              >
                <Link to={`/patients/${appt.patientId}`}>
                  <Avatar src={appt.patientAvatar} name={appt.patientName} size="md" className="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/patients/${appt.patientId}`} className="font-medium text-ink-900 dark:text-ink-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block">
                    {appt.patientName}
                  </Link>
                  <p className="text-xs text-ink-400 truncate">{appt.reason} · {appt.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{appt.time}</p>
                  <p className="text-xs text-ink-400">{formatDate(appt.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={appt.status as AppointmentStatus} />
                  <p className="text-xs text-ink-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {appt.room}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
