import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Stethoscope, CalendarDays, Plus, UserPlus,
  CalendarPlus, FilePlus, ArrowRight, Activity as ActivityIcon, TrendingUp,
  DollarSign, Settings, Boxes, AlertTriangle, Droplet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { Card, CardHeader, CardTitle, CardBody, Avatar, StatusBadge, Button, Badge } from '../../components/ui';
import { CalendarWidget } from '../../components/CalendarWidget';
import { RevenueChart, PatientFlowChart, DepartmentPie, AppointmentTypeChart } from './Charts';
import { api } from '../../services/api';
import { useAsync } from '../../hooks';
import { formatDate, timeAgo, cn } from '../../utils';
import { SkeletonCard } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { PatientDashboardPage } from '../patients/PatientDashboardPage';

const activityIcons: Record<string, { icon: typeof ActivityIcon; color: string; bg: string }> = {
  appointment: { icon: CalendarDays, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/15' },
  admission: { icon: UserPlus, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-500/15' },
  discharge: { icon: ArrowRight, color: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-50 dark:bg-secondary-500/15' },
  payment: { icon: DollarSign, color: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-50 dark:bg-secondary-500/15' },
  doctor: { icon: Stethoscope, color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/15' },
  lab: { icon: ActivityIcon, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-500/15' },
};

const quickActions = [
  { label: 'Register User', icon: UserPlus, path: '/register-user', color: 'primary' },
  { label: 'Book Appointment', icon: CalendarPlus, path: '/appointments', color: 'accent' },
  { label: 'New Invoice', icon: FilePlus, path: '/billing', color: 'secondary' },
  { label: 'Staff Directory', icon: Users, path: '/staff', color: 'warning' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: activitiesData } = useAsync(() => api.getActivities(), []);

  if (user?.role === 'patient') {
    return <PatientDashboardPage />;
  }

  // Load doctor's appointments (if logged-in user is a doctor)
  const { data: docAppointmentsData, loading: docLoading } = useAsync(
    () => user?.role === 'doctor' && user?.doctorId ? api.getAppointments({ pageSize: 500, doctorId: user.doctorId }) : Promise.resolve({ items: [], total: 0 }),
    [user?.doctorId, user?.role]
  );
  if (user?.role === 'doctor') {
    const docAppts = docAppointmentsData?.items ?? [];
    
    // Calculate Doctor Stats
    const uniquePatients = new Set(docAppts.map(a => a.patientId));
    const totalPatients = uniquePatients.size;
    const todayAppts = docAppts.filter(a => new Date(a.date).toDateString() === new Date().toDateString());
    const todayAppointments = todayAppts.length;
    const upcomingAppointments = docAppts.filter(a => a.status === 'scheduled' && new Date(a.date) > new Date()).length;
    const completedAppointments = docAppts.filter(a => a.status === 'completed').length;
    
    // Appointment Type distribution
    const typeCounts: Record<string, number> = { consultation: 0, 'follow-up': 0, checkup: 0, emergency: 0 };
    docAppts.forEach(a => {
      if (typeCounts[a.type] !== undefined) typeCounts[a.type]++;
    });
    const apptTypeData = [
      { name: 'Consultation', value: typeCounts['consultation'], color: '#2563eb' },
      { name: 'Follow-up', value: typeCounts['follow-up'], color: '#7c3aed' },
      { name: 'Checkup', value: typeCounts['checkup'], color: '#16a34a' },
      { name: 'Emergency', value: typeCounts['emergency'], color: '#dc2626' },
    ];
    
    // Weekly Patient Flow
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const flowCounts: Record<string, { booked: number; completed: number }> = {
      Mon: { booked: 0, completed: 0 },
      Tue: { booked: 0, completed: 0 },
      Wed: { booked: 0, completed: 0 },
      Thu: { booked: 0, completed: 0 },
      Fri: { booked: 0, completed: 0 },
      Sat: { booked: 0, completed: 0 },
      Sun: { booked: 0, completed: 0 },
    };
    docAppts.forEach(a => {
      const dayOfWeek = weekdayNames[new Date(a.date).getDay()];
      if (flowCounts[dayOfWeek] !== undefined) {
        flowCounts[dayOfWeek].booked++;
        if (a.status === 'completed') {
          flowCounts[dayOfWeek].completed++;
        }
      }
    });
    const flowData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      admitted: flowCounts[day].booked,
      discharged: flowCounts[day].completed
    }));
    
    const docQuickActions = [
      { label: 'My Patients', icon: Users, path: '/my-patients', color: 'primary' },
      { label: 'My Schedule', icon: CalendarDays, path: '/my-schedule', color: 'accent' },
      { label: 'Book Appointment', icon: Plus, path: '/appointments', color: 'secondary' },
      { label: 'Settings', icon: Settings, path: '/settings', color: 'warning' },
    ];
    
    const calendarEvents = docAppts.slice(0, 12).map((a) => ({
      date: a.date,
      label: `${a.time} — ${a.patientName}`,
      color: a.status === 'completed' ? '#22c55e' : a.status === 'cancelled' ? '#ef4444' : '#2563eb',
    }));
    
    const firstName = user?.name.split(' ')[0] ?? 'Doctor';
    const todayStr = formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' });
    
    return (
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-400">{todayStr}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
              Welcome back, <span className="gradient-text">Dr. {firstName}</span>
            </h1>
            <p className="mt-1.5 text-ink-500 dark:text-ink-400">Here's your schedule and patient metrics overview for today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" leftIcon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/my-schedule')}>
              My Schedule
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard index={0} label="My Patients" value={totalPatients} loading={docLoading} icon={<Users className="h-5 w-5" />} accent="primary" />
          <StatCard index={1} label="Today's Appointments" value={todayAppointments} loading={docLoading} icon={<CalendarDays className="h-5 w-5" />} accent="accent" />
          <StatCard index={2} label="Upcoming Scheduled" value={upcomingAppointments} loading={docLoading} icon={<CalendarDays className="h-5 w-5" />} accent="warning" />
          <StatCard index={3} label="Completed Consultations" value={completedAppointments} loading={docLoading} icon={<Stethoscope className="h-5 w-5" />} accent="success" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {docLoading ? <SkeletonCard className="h-[372px]" /> : <PatientFlowChart data={flowData} />}
          </div>
          <div>
            {docLoading ? <SkeletonCard className="h-[372px]" /> : <AppointmentTypeChart data={apptTypeData} />}
          </div>
        </div>

        {/* Quick Actions + Today's Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-3">
              {docQuickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(action.path)}
                  className={cn(
                    'group flex flex-col items-center gap-2 p-4 rounded-xl border border-ink-200/70 dark:border-ink-800',
                    'hover:border-primary-300 hover:shadow-soft transition-all',
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                    action.color === 'primary' && 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
                    action.color === 'accent' && 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
                    action.color === 'secondary' && 'bg-secondary-50 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400',
                    action.color === 'warning' && 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
                  )}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-ink-700 dark:text-ink-300 text-center">{action.label}</span>
                </motion.button>
              ))}
            </CardBody>
          </Card>

          {/* Today's Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Today's Appointments</CardTitle>
              <Link to="/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {todayAppts.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-ink-400">No appointments scheduled for today.</p>
                ) : (
                  todayAppts.slice(0, 5).map((appt, i) => (
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
                      <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{appt.patientName}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.type} · Room {appt.room}</p>
                      </div>
                      <StatusBadge status={appt.status} pulse={appt.status === 'in-progress'} />
                    </motion.div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Activity + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
            <CardBody className="p-0">
              <div className="px-5 py-4">
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
                  <div className="space-y-5">
                    {activitiesData?.map((act, i) => {
                      const cfg = activityIcons[act.type] ?? activityIcons.appointment;
                      return (
                        <motion.div
                          key={act.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="relative flex gap-4"
                        >
                          <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-ink-900', cfg.bg)}>
                            <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{act.title}</p>
                              <span className="text-xs text-ink-400 shrink-0">{timeAgo(act.time)}</span>
                            </div>
                            <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{act.description}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Avatar src={act.avatar} name={act.user} size="xs" />
                              <span className="text-xs text-ink-400">{act.user}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Calendar */}
          <CalendarWidget events={calendarEvents} />
        </div>
      </div>
    );
  }

  // Load general staff dashboard data
  const { data: staffInventory } = useAsync(
    () => user?.role === 'general_staff' ? api.getInventoryItems({ pageSize: 200 }) : Promise.resolve({ items: [], total: 0 }),
    [user?.role]
  );
  const { data: staffPharmacy } = useAsync(
    () => user?.role === 'general_staff' ? api.getPharmacyItems({ pageSize: 200 }) : Promise.resolve({ items: [], total: 0 }),
    [user?.role]
  );
  const { data: staffBlood } = useAsync(
    () => user?.role === 'general_staff' ? api.getBloodBankStock() : Promise.resolve([]),
    [user?.role]
  );

  if (user?.role === 'general_staff') {
    const invItems = staffInventory?.items ?? [];
    const pharmItems = staffPharmacy?.items ?? [];
    const bloodItems = staffBlood ?? [];

    const lowStockInv = invItems.filter(i => i.quantity <= i.reorderLevel);
    const lowStockPharm = pharmItems.filter(p => p.quantity <= p.reorderLevel);
    const lowStockBlood = bloodItems.filter(b => b.unitsAvailable < b.reorderLevel);

    const totalBloodUnits = bloodItems.reduce((sum, b) => sum + b.unitsAvailable, 0);

    const allLowStock = [
      ...lowStockInv.map(i => ({ name: i.name, type: 'Inventory', qty: i.quantity, limit: i.reorderLevel, link: '/inventory' })),
      ...lowStockPharm.map(p => ({ name: p.name, type: 'Pharmacy', qty: p.quantity, limit: p.reorderLevel, link: '/pharmacy' })),
      ...lowStockBlood.map(b => ({ name: `Type ${b.bloodType}`, type: 'Blood Bank', qty: b.unitsAvailable, limit: b.reorderLevel, link: '/blood-bank' }))
    ];

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
              Welcome, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p className="mt-1.5 text-ink-500 dark:text-ink-400">Staff Portal: Manage hospital resources and supply chain.</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">Inventory Items</p>
                <p className="text-2xl font-bold text-ink-950 dark:text-white mt-0.5">{staffInventory?.total ?? 0}</p>
                <p className="text-xs text-ink-400 mt-0.5">{lowStockInv.length} low stock alerts</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 shrink-0">
                <ActivityIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">Medications (Pharmacy)</p>
                <p className="text-2xl font-bold text-ink-950 dark:text-white mt-0.5">{staffPharmacy?.total ?? 0}</p>
                <p className="text-xs text-ink-400 mt-0.5">{lowStockPharm.length} low stock alerts</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400 shrink-0">
                <Droplet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">Blood Bank stock</p>
                <p className="text-2xl font-bold text-ink-950 dark:text-white mt-0.5">{totalBloodUnits} units</p>
                <p className="text-xs text-ink-400 mt-0.5">{lowStockBlood.length} critical blood types</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">Total Reorder Alerts</p>
                <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-0.5">{allLowStock.length}</p>
                <p className="text-xs text-ink-400 mt-0.5">Supply action needed</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Low Stock & Reorder Alerts
              </CardTitle>
              <Badge variant="danger">{allLowStock.length} items</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {allLowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-ink-400">All supplies are adequately stocked!</p>
              ) : (
                <div className="divide-y divide-ink-100 dark:divide-ink-800/60 max-h-[350px] overflow-y-auto">
                  {allLowStock.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 truncate">{item.name}</p>
                        <p className="text-xs text-ink-400">{item.type}</p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-4">
                        <div>
                          <p className="text-xs text-ink-400">Current Qty</p>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{item.qty} / {item.limit}</p>
                        </div>
                        <Link to={item.link} className="text-xs font-semibold text-primary-600 hover:underline">
                          Restock →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Manager</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <Link to="/inventory" className="flex items-center justify-between p-4 rounded-xl border border-ink-100 hover:border-primary-500/35 hover:bg-primary-500/5 dark:border-ink-800 dark:hover:border-primary-500/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <Boxes className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">General Inventory</p>
                    <p className="text-xs text-ink-400">Consumables & tools</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/pharmacy" className="flex items-center justify-between p-4 rounded-xl border border-ink-100 hover:border-accent-500/35 hover:bg-accent-500/5 dark:border-ink-800 dark:hover:border-accent-500/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400">
                    <ActivityIcon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">Pharmacy</p>
                    <p className="text-xs text-ink-400">Medications & dispensaries</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/blood-bank" className="flex items-center justify-between p-4 rounded-xl border border-ink-100 hover:border-warning-500/35 hover:bg-warning-500/5 dark:border-ink-800 dark:hover:border-warning-500/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400">
                    <Droplet className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">Blood Bank</p>
                    <p className="text-xs text-ink-400">Manage donors & categories</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-warning-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const { data: statsData, loading: statsLoading } = useAsync(() => api.getDashboardStats(), []);
  const { data: revenueData, loading: revLoading } = useAsync(() => api.getRevenueData(), []);
  const { data: flowData, loading: flowLoading } = useAsync(() => api.getPatientFlowData(), []);
  const { data: deptData, loading: deptLoading } = useAsync(() => api.getDepartmentDistribution(), []);
  const { data: appointmentsData } = useAsync(() => api.getAppointments({ pageSize: 100 }), []);
  const { data: apptTypeData } = useAsync(() => api.getAppointmentTypeData(), []);

  const apptData = appointmentsData?.items ?? [];
  const todayAppts = apptData.filter((a) => new Date(a.date).toDateString() === new Date().toDateString()).slice(0, 5);

  const calendarEvents = apptData.slice(0, 12).map((a) => ({
    date: a.date,
    label: `${a.time} — ${a.patientName}`,
    color: a.status === 'completed' ? '#22c55e' : a.status === 'cancelled' ? '#ef4444' : '#2563eb',
  }));

  const firstName = user?.name.split(' ')[0] ?? 'there';
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
            Welcome back, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="mt-1.5 text-ink-500 dark:text-ink-400">Here's what's happening at Subhan Care Clinic today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" leftIcon={<CalendarDays className="h-4 w-4" />} onClick={() => navigate('/appointments')}>
            View Schedule
          </Button>
          <Button size="md" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => navigate('/register-user')}>
            Register User
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard index={0} label="Total Patients" value={statsData?.totalPatients ?? 0} loading={statsLoading} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard index={1} label="Active Doctors" value={statsData?.activeDoctors ?? 0} loading={statsLoading} icon={<Stethoscope className="h-5 w-5" />} accent="accent" />
        <StatCard index={2} label="Today's Appointments" value={statsData?.todayAppointments ?? 0} loading={statsLoading} icon={<CalendarDays className="h-5 w-5" />} accent="warning" />
        <StatCard index={3} label="Monthly Revenue" value={statsData?.monthlyRevenue ?? 0} prefix="Rs. " loading={statsLoading} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {revLoading || !revenueData ? <SkeletonCard className="h-[372px]" /> : <RevenueChart data={revenueData} />}
        </div>
        <div>
          {deptLoading || !deptData ? <SkeletonCard className="h-[372px]" /> : <DepartmentPie data={deptData} />}
        </div>
      </div>

      {/* Quick actions + Today's appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(action.path)}
                className={cn(
                  'group flex flex-col items-center gap-2 p-4 rounded-xl border border-ink-200/70 dark:border-ink-800',
                  'hover:border-primary-300 hover:shadow-soft transition-all',
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                  action.color === 'primary' && 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
                  action.color === 'accent' && 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
                  action.color === 'secondary' && 'bg-secondary-50 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400',
                  action.color === 'warning' && 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
                )}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-ink-700 dark:text-ink-300 text-center">{action.label}</span>
              </motion.button>
            ))}
          </CardBody>
        </Card>

        {/* Today's appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Today's Appointments</CardTitle>
            <Link to="/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
                    <Avatar src={appt.patientAvatar} name={appt.patientName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{appt.patientName}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{appt.doctorName} · {appt.department}</p>
                    </div>
                    <StatusBadge status={appt.status} pulse={appt.status === 'in-progress'} />
                  </motion.div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {flowLoading || !flowData ? <SkeletonCard className="h-[372px]" /> : <PatientFlowChart data={flowData} />}
        </div>
        <div>
          {apptTypeData ? <AppointmentTypeChart data={apptTypeData} /> : <SkeletonCard className="h-[372px]" />}
        </div>
      </div>

      {/* Activity + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
          <CardBody className="p-0">
            <div className="px-5 py-4">
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200 dark:bg-ink-800" />
                <div className="space-y-5">
                  {activitiesData?.map((act, i) => {
                    const cfg = activityIcons[act.type] ?? activityIcons.appointment;
                    return (
                      <motion.div
                        key={act.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative flex gap-4"
                      >
                        <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-ink-900', cfg.bg)}>
                          <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{act.title}</p>
                            <span className="text-xs text-ink-400 shrink-0">{timeAgo(act.time)}</span>
                          </div>
                          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{act.description}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Avatar src={act.avatar} name={act.user} size="xs" />
                            <span className="text-xs text-ink-400">{act.user}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Calendar */}
        <CalendarWidget events={calendarEvents} />
      </div>
    </div>
  );
}
