import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope, CalendarDays, Users, Clock,
  Mail, Phone, MapPin, Award, DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardBody, Avatar, StatusBadge, Badge, Button } from '../../components/ui';
import { CalendarWidget } from '../../components/CalendarWidget';
import { StatCard } from '../../components/StatCard';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useAsync } from '../../hooks';
import { formatDate } from '../../utils';
import { SkeletonCard } from '../../components/ui';
import { useNavigate, Link } from 'react-router-dom';
import type { Doctor } from '../../types';


export function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(true);

  const { data: appointmentsData } = useAsync(
    () => api.getAppointments({ pageSize: 100, doctorId: user?.doctorId }),
    [user?.doctorId]
  );

  useEffect(() => {
    if (!user?.doctorId) {
      setDoctorLoading(false);
      return;
    }
    const loadDoctor = () => {
      api.getDoctor(user.doctorId!)
        .then(setDoctor)
        .catch(() => setDoctor(null))
        .finally(() => setDoctorLoading(false));
    };

    loadDoctor();

    const channel = supabase
      .channel(`doctor-dashboard-${user.doctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        () => {
          loadDoctor();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.doctorId]);

  const apptData = appointmentsData?.items ?? [];
  const todayAppts = apptData.filter(
    (a) => new Date(a.date).toDateString() === new Date().toDateString()
  );
  const upcomingAppts = apptData
    .filter((a) => a.status === 'scheduled' && new Date(a.date) >= new Date())
    .slice(0, 5);

  const calendarEvents = apptData.slice(0, 20).map((a) => ({
    date: a.date,
    label: `${a.time} — ${a.patientName}`,
    color: a.status === 'completed' ? '#22c55e' : a.status === 'cancelled' ? '#ef4444' : '#2563eb',
  }));

  const firstName = user?.name.split(' ')[0] ?? 'Doctor';
  const today = formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-sm text-ink-500 dark:text-ink-400">{today}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
            Welcome back, <span className="gradient-text">Dr. {firstName}</span>
          </h1>
          <p className="mt-1.5 text-ink-500 dark:text-ink-400">Here's your schedule and patient overview for today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" leftIcon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/my-schedule')}>
            My Schedule
          </Button>
          <Button size="md" leftIcon={<Users className="h-4 w-4" />} onClick={() => navigate('/my-patients')}>
            My Patients
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard index={0} label="Today's Appointments" value={todayAppts.length} icon={<CalendarDays className="h-5 w-5" />} accent="primary" />
        <StatCard index={1} label="Patients Treated" value={doctor?.patientsTreated ?? 0} loading={doctorLoading} icon={<Users className="h-5 w-5" />} accent="accent" />
        <StatCard index={2} label="Experience" value={doctor?.experienceYears ?? 0} suffix=" yrs" loading={doctorLoading} icon={<Award className="h-5 w-5" />} accent="warning" />
        <StatCard index={3} label="Consultation Fee" value={doctor?.fee ?? 0} prefix="Rs. " loading={doctorLoading} icon={<DollarSign className="h-5 w-5" />} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Profile Card */}
        <div className="space-y-6">
          {doctorLoading ? (
            <SkeletonCard className="h-80" />
          ) : doctor ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardBody className="pt-0">
                  <div className="h-20 gradient-brand rounded-t-xl -mx-5 -mt-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid opacity-20" />
                  </div>
                  <div className="flex flex-col items-center -mt-10">
                    <Avatar src={doctor.avatar} name={`${doctor.firstName} ${doctor.lastName}`} size="xl" ring className="ring-4 ring-white dark:ring-ink-900" />
                    <h2 className="mt-3 text-lg font-bold text-ink-900 dark:text-white">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h2>
                    <p className="text-sm text-ink-500 dark:text-ink-400">{doctor.specialty}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="primary">{doctor.department}</Badge>
                      <StatusBadge status={doctor.status} />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-400 shrink-0">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">Qualification</p>
                        <p className="font-medium text-ink-800 dark:text-ink-200">{doctor.qualification}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">Phone</p>
                        <p className="font-medium text-ink-800 dark:text-ink-200">{doctor.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">Email</p>
                        <p className="font-medium text-ink-800 dark:text-ink-200 truncate">{doctor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-400 shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">Room</p>
                        <p className="font-medium text-ink-800 dark:text-ink-200">{doctor.room}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <Stethoscope className="h-10 w-10 mx-auto text-ink-300 dark:text-ink-600 mb-3" />
                <p className="text-sm text-ink-500 dark:text-ink-400">Doctor profile not linked to your account.</p>
                <p className="text-xs text-ink-400 mt-1">Contact the administrator to link your profile.</p>
              </CardBody>
            </Card>
          )}

          {/* Calendar */}
          <CalendarWidget events={calendarEvents} />
        </div>

        {/* Today's Appointments + Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-500" /> Today's Appointments
              </CardTitle>
              <Badge variant="primary">{todayAppts.length} scheduled</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {todayAppts.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-ink-400">No appointments scheduled for today.</p>
                ) : (
                  todayAppts.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center h-12 w-14 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 shrink-0">
                        <span className="text-sm font-bold leading-none">{appt.time}</span>
                        <span className="text-[10px] mt-0.5">{appt.durationMin}m</span>
                      </div>
                      <Link to={`/patients/${appt.patientId}`}>
                        <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" className="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/patients/${appt.patientId}`} className="text-sm font-medium text-ink-800 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block">
                          {appt.patientName}
                        </Link>
                        <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.type} · {appt.department}</p>
                      </div>
                      <StatusBadge status={appt.status} pulse={appt.status === 'in-progress'} />
                    </motion.div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-accent-500" /> Upcoming Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-schedule')}>
                View All →
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {upcomingAppts.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-ink-400">No upcoming appointments.</p>
                ) : (
                  upcomingAppts.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center h-12 w-14 rounded-lg bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300 shrink-0">
                        <span className="text-[11px] font-semibold leading-none">{formatDate(appt.date, { month: 'short', day: 'numeric' })}</span>
                        <span className="text-xs font-bold mt-0.5">{appt.time}</span>
                      </div>
                      <Link to={`/patients/${appt.patientId}`}>
                        <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" className="hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/patients/${appt.patientId}`} className="text-sm font-medium text-ink-800 dark:text-ink-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block">
                          {appt.patientName}
                        </Link>
                        <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.reason}</p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </motion.div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
