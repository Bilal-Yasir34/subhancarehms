import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Sun, Moon, Menu, ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useOnClickOutside } from '../hooks';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import type { Notification } from '../types';
import { Breadcrumb } from './Breadcrumb';
import { Avatar, Badge } from './ui';
import { timeAgo, cn, formatDate } from '../utils';
import { NAV_ITEMS } from '../constants';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ type: string; label: string; sublabel: string; path: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useOnClickOutside<HTMLDivElement>(() => setResultsOpen(false));

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const query = search.trim();
      const results: typeof searchResults = [];

      try {
        if (user?.role === 'admin') {
          // 1. Search Patients
          const patientsRes = await api.getPatients({ search: query, pageSize: 5 });
          patientsRes.items.forEach(p => {
            results.push({
              type: 'Patient',
              label: `${p.firstName} ${p.lastName}`,
              sublabel: `MRN: ${p.mrn} · ${p.department}`,
              path: `/patients/${p.id}`,
            });
          });

          // 2. Search Doctors
          const doctorsRes = await api.getDoctors({ search: query, pageSize: 5 });
          doctorsRes.items.forEach(d => {
            results.push({
              type: 'Doctor',
              label: `Dr. ${d.firstName} ${d.lastName}`,
              sublabel: `${d.specialty} · Room ${d.room}`,
              path: `/doctors`,
            });
          });

          // 3. Search Invoices
          const invoicesRes = await api.getInvoices({ search: query, pageSize: 5 });
          invoicesRes.items.forEach(inv => {
            results.push({
              type: 'Invoice',
              label: inv.invoiceNumber,
              sublabel: `${inv.patientName} · Rs. ${inv.total}`,
              path: `/billing/${inv.id}`,
            });
          });
        } 
        else if (user?.role === 'doctor') {
          // 1. Search appointments
          const apptsRes = await api.getAppointments({ search: query, doctorId: user.doctorId, pageSize: 5 });
          apptsRes.items.forEach(a => {
            results.push({
              type: 'Appointment',
              label: a.patientName,
              sublabel: `${formatDate(a.date)} at ${a.time} · ${a.type}`,
              path: `/appointments`,
            });
          });

          // 2. Search patients associated with doctor
          const patientsRes = await api.getPatients({ search: query, pageSize: 100 });
          const apptsAll = await api.getAppointments({ doctorId: user.doctorId, pageSize: 200 });
          const myPatientIds = new Set(apptsAll.items.map(a => a.patientId));
          patientsRes.items.filter(p => myPatientIds.has(p.id)).slice(0, 5).forEach(p => {
            results.push({
              type: 'My Patient',
              label: `${p.firstName} ${p.lastName}`,
              sublabel: `MRN: ${p.mrn} · ${p.phone}`,
              path: `/patients/${p.id}`,
            });
          });
        }
        else if (user?.role === 'general_staff') {
          // 1. Search Inventory Items
          const inventoryRes = await api.getInventoryItems({ search: query, pageSize: 5 });
          inventoryRes.items.forEach(i => {
            results.push({
              type: 'Inventory',
              label: i.name,
              sublabel: `${i.category} · Qty: ${i.quantity}`,
              path: `/inventory`,
            });
          });

          // 2. Search Pharmacy Items
          const pharmacyRes = await api.getPharmacyItems({ search: query, pageSize: 5 });
          pharmacyRes.items.forEach(p => {
            results.push({
              type: 'Pharmacy',
              label: p.name,
              sublabel: `${p.category} · Qty: ${p.quantity}`,
              path: `/pharmacy`,
            });
          });

          // 3. Search Blood Bank Stock
          const bloodRes = await api.getBloodBankStock();
          bloodRes.filter(b => b.bloodType.toLowerCase().includes(query.toLowerCase())).forEach(b => {
            results.push({
              type: 'Blood Bank',
              label: `Type ${b.bloodType}`,
              sublabel: `Units Available: ${b.unitsAvailable}`,
              path: `/blood-bank`,
            });
          });
        }
        else if (user?.role === 'patient') {
          // 1. Search appointments
          const apptsRes = await api.getAppointments({ search: query, patientId: user.patientId, pageSize: 5 });
          apptsRes.items.forEach(a => {
            results.push({
              type: 'Appointment',
              label: `Dr. ${a.doctorName}`,
              sublabel: `${formatDate(a.date)} at ${a.time} · ${a.type}`,
              path: `/dashboard`,
            });
          });

          // 2. Search invoices
          const invoicesRes = await api.getInvoices({ search: query, patientId: user.patientId, pageSize: 5 });
          invoicesRes.items.forEach(inv => {
            results.push({
              type: 'Invoice',
              label: inv.invoiceNumber,
              sublabel: `Issued: ${formatDate(inv.date)} · Rs. ${inv.total}`,
              path: `/billing/${inv.id}`,
            });
          });
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearchResults(results);
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, user]);
  const notifRef = useOnClickOutside<HTMLDivElement>(() => setNotifOpen(false));
  const profileRef = useOnClickOutside<HTMLDivElement>(() => setProfileOpen(false));

  const loadNotifications = () => {
    api.getNotifications().then(setNotifications).catch(() => {});
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to new notifications in real-time
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;

  const currentNav = NAV_ITEMS.find((n) => location.pathname.startsWith(n.path));
  const crumbs = [{ label: 'Home', path: '/dashboard' }, { label: currentNav?.label ?? 'Dashboard' }];

  useEffect(() => {
    if (notifOpen && unread > 0) {
      api.markNotificationsRead()
        .then(() => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        })
        .catch(console.error);
    }
  }, [notifOpen, unread]);

  const getSearchPlaceholder = () => {
    switch (user?.role) {
      case 'admin':
        return 'Search patients, doctors, staff, invoices…';
      case 'doctor':
        return 'Search my patients, appointments…';
      case 'general_staff':
        return 'Search inventory, pharmacy, blood bank…';
      case 'patient':
        return 'Search appointments, medical history, invoices…';
      default:
        return 'Search…';
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-30 glass border-b border-ink-200/70 dark:border-ink-800">
      <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
        <motion.button
          onClick={onMenuClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="lg:hidden p-2 rounded-xl text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </motion.button>

        <div className="hidden sm:block">
          <Breadcrumb items={crumbs} />
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md ml-auto sm:ml-6" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            value={search}
            onFocus={() => setResultsOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setResultsOpen(true);
            }}
            placeholder={getSearchPlaceholder()}
            className="input-base pl-10 h-10 bg-ink-50/80 dark:bg-ink-800/50 rounded-xl"
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 rounded-md border border-ink-200 dark:border-ink-700 px-1.5 py-0.5 text-[10px] font-medium text-ink-400">⌘K</kbd>

          <AnimatePresence>
            {resultsOpen && search.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-full mt-2 glass-strong rounded-xl shadow-float max-h-96 overflow-y-auto z-50 divide-y divide-ink-100 dark:divide-ink-800"
              >
                {searchLoading ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-4 w-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-ink-400">Searching…</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="p-4 text-center text-sm text-ink-400">No results for "{search}"</p>
                ) : (
                  searchResults.map((res, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => {
                        navigate(res.path);
                        setSearch('');
                        setResultsOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">{res.label}</span>
                        <Badge variant="neutral" size="sm" className="text-[10px]">{res.type}</Badge>
                      </div>
                      <span className="text-xs text-ink-500 dark:text-ink-400 truncate">{res.sublabel}</span>
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0">
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="p-2.5 rounded-xl text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 transition-colors"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === 'light' ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                  <Sun className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
                  <Moon className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>


          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button
              onClick={() => setNotifOpen((o) => !o)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="relative p-2.5 rounded-xl text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 transition-colors"
              aria-label="Notifications"
            >
              <motion.div
                animate={unread > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}
              >
                <Bell className="h-5 w-5" />
              </motion.div>
              <AnimatePresence>
                {unread > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-danger-500 text-white text-[10px] font-bold ring-2 ring-white dark:ring-ink-900 animate-pulse-ring"
                  >
                    {unread}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-strong rounded-2xl shadow-float overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-ink-200/70 dark:border-ink-800">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink-900 dark:text-ink-100">Notifications</p>
                      <AnimatePresence>
                        {unread > 0 && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500 }}>
                            <Badge variant="danger" size="sm">{unread} new</Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.clearNotifications();
                            setNotifications([]);
                            toast.success('Notifications cleared');
                          } catch {
                            toast.error('Failed to clear notifications');
                          }
                        }}
                        className="text-xs font-medium text-ink-400 hover:text-danger-500 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center"
                      >
                        <Bell className="h-8 w-8 text-ink-300 dark:text-ink-600 mx-auto mb-2" />
                        <p className="text-sm text-ink-400">You're all caught up!</p>
                      </motion.div>
                    ) : (
                      notifications.map((n, i) => (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={async () => {
                            if (!n.read) {
                              try {
                                await api.markNotificationRead(n.id);
                                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                          className={cn('flex gap-3 px-4 py-3.5 border-b border-ink-100 dark:border-ink-800/50 hover:bg-ink-50 dark:hover:bg-ink-800/40 transition-colors cursor-pointer', !n.read && 'bg-primary-50/50 dark:bg-primary-500/5')}
                        >
                          <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', n.type === 'error' ? 'bg-danger-500' : n.type === 'warning' ? 'bg-warning-500' : n.type === 'success' ? 'bg-secondary-500' : 'bg-primary-500')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">{n.title}</p>
                            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[11px] text-ink-400 mt-1.5">{timeAgo(n.time)}</p>
                          </div>
                          {!n.read && <div className="h-2 w-2 rounded-full bg-primary-500 shrink-0 mt-1.5 animate-pulse" />}
                        </motion.div>
                      ))
                    )}
                  </div>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59,130,246,0.06)' }}
                    onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                    className="w-full py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 transition-colors border-t border-ink-100 dark:border-ink-800"
                  >
                    View all notifications →
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              onClick={() => setProfileOpen((o) => !o)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              aria-label="Profile menu"
            >
              <Avatar src={user?.avatar} name={user?.name ?? ''} size="sm" ring />
              <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                <ChevronDown className="hidden sm:block h-4 w-4 text-ink-400" />
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="absolute right-0 top-full mt-2 w-60 glass-strong rounded-2xl shadow-float overflow-hidden"
                >
                  <div className="px-4 py-4 border-b border-ink-200/70 dark:border-ink-800">
                    <p className="text-sm font-bold text-ink-900 dark:text-ink-100 truncate">{user?.name}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate mt-0.5">{user?.email}</p>
                    <Badge variant="primary" size="sm" className="mt-2 capitalize">{user?.role?.replace('_', ' ')}</Badge>
                  </div>
                  <div className="py-1.5">
                    {[
                      { to: '/settings?tab=profile', icon: UserIcon, label: 'My Profile' },
                      { to: '/settings?tab=appearance', icon: Settings, label: 'Settings' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          to={item.to}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-ink-400" /> {item.label}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
