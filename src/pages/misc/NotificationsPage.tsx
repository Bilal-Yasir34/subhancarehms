import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Trash2, Send, ChevronDown, Users, User as UserIcon,
  Info, AlertTriangle, CheckCircle2, XCircle, X, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Card, CardBody, CardHeader, CardTitle,
  Badge, SkeletonCard, EmptyState, Button, Input, Avatar,
} from '../../components/ui';
import { api } from '../../services/api';
import type { Notification, StaffProfile, UserRole } from '../../types';
import { timeAgo, cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: {
  value: Notification['type'];
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  { value: 'info',    label: 'Info',    icon: <Info className="h-3.5 w-3.5" />,          activeClass: 'border-primary-400 bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' },
  { value: 'success', label: 'Success', icon: <CheckCircle2 className="h-3.5 w-3.5" />,  activeClass: 'border-secondary-400 bg-secondary-50 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-300' },
  { value: 'warning', label: 'Warning', icon: <AlertTriangle className="h-3.5 w-3.5" />, activeClass: 'border-warning-400 bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-300' },
  { value: 'error',   label: 'Error',   icon: <XCircle className="h-3.5 w-3.5" />,       activeClass: 'border-danger-400 bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-300' },
];

const DOT_COLOR: Record<Notification['type'], string> = {
  info:    'bg-primary-500',
  success: 'bg-secondary-500',
  warning: 'bg-warning-500',
  error:   'bg-danger-500',
};

const ROLE_BADGE: Record<UserRole, { label: string; variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger' }> = {
  admin:         { label: 'Admin',         variant: 'danger' },
  doctor:        { label: 'Doctor',        variant: 'primary' },
  general_staff: { label: 'General Staff', variant: 'success' },
  receptionist:  { label: 'Receptionist',  variant: 'warning' },
  patient:       { label: 'Patient',       variant: 'neutral' },
};

// ─── UserSearchDropdown ────────────────────────────────────────────────────────

interface UserSearchDropdownProps {
  staffList: StaffProfile[];
  value: StaffProfile | null;
  onChange: (s: StaffProfile | null) => void;
}

function UserSearchDropdown({ staffList, value, onChange }: UserSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = staffList.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  const rb = value ? ROLE_BADGE[value.role] : null;

  return (
    <div className="relative w-full" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150',
          'bg-white/60 dark:bg-ink-900/60 backdrop-blur-sm',
          open
            ? 'border-primary-500 shadow-[0_0_0_3px_rgba(59,130,246,0.18)]'
            : 'border-ink-200 dark:border-ink-700 hover:border-primary-400/70',
        )}
      >
        {value ? (
          <span className="flex items-center gap-2.5 min-w-0">
            <Avatar name={value.fullName} src={value.avatar} size="xs" className="h-7 w-7 ring-1 ring-ink-200 dark:ring-ink-700" />
            <span className="font-medium text-ink-800 dark:text-ink-200 truncate">{value.fullName}</span>
            {rb && <Badge variant={rb.variant} size="sm" className="capitalize shrink-0">{rb.label}</Badge>}
          </span>
        ) : (
          <span className="text-ink-400 dark:text-ink-500">Select a recipient…</span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-ink-400 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl shadow-float',
              // glassmorphism
              'bg-white/85 dark:bg-ink-900/80 backdrop-blur-2xl',
              'border border-white/70 dark:border-white/10',
            )}
          >
            {/* Search field */}
            <div className="p-3 border-b border-ink-100/80 dark:border-ink-800/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, role, or department…"
                  className={cn(
                    'w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all',
                    'bg-ink-50/80 dark:bg-ink-800/60 text-ink-800 dark:text-ink-200',
                    'placeholder:text-ink-400 dark:placeholder:text-ink-500',
                    'border border-ink-200/80 dark:border-ink-700/80',
                    'focus:border-primary-400 focus:bg-white dark:focus:bg-ink-800 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]',
                  )}
                />
              </div>
            </div>

            {/* User list */}
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <UserIcon className="h-8 w-8 text-ink-300 dark:text-ink-600" />
                  <p className="text-sm text-ink-400 dark:text-ink-500">No users match your search</p>
                </div>
              ) : (
                filtered.map((s) => {
                  const rb = ROLE_BADGE[s.role];
                  const isSelected = value?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { onChange(s); setOpen(false); setQuery(''); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'bg-primary-50/80 dark:bg-primary-500/10'
                          : 'hover:bg-ink-50/70 dark:hover:bg-ink-800/50',
                      )}
                    >
                      {/* Avatar */}
                      <Avatar name={s.fullName} src={s.avatar} size="sm" className="h-9 w-9 ring-2 ring-white dark:ring-ink-800" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 truncate">{s.fullName}</p>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-ink-400 dark:text-ink-500 truncate mt-0.5">
                          {s.department ? `${s.department}` : 'No department'}
                          {s.email ? ` · ${s.email}` : ''}
                        </p>
                      </div>

                      {/* Role badge */}
                      <Badge variant={rb.variant} size="sm" className="shrink-0 capitalize">
                        {rb.label}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer count */}
            <div className="px-4 py-2 border-t border-ink-100/80 dark:border-ink-800/60 text-xs text-ink-400 dark:text-ink-500">
              {filtered.length} of {staffList.length} users
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SendNotificationPanel ────────────────────────────────────────────────────

interface SendPanelProps {
  onSent: () => void;
}

function SendNotificationPanel({ onSent }: SendPanelProps) {
  const [audience, setAudience] = useState<'broadcast' | 'individual'>('broadcast');
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<StaffProfile | null>(null);
  const [notifType, setNotifType] = useState<Notification['type']>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setStaffLoading(true);
    api.getStaffProfiles()
      .then(setStaffList)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setStaffLoading(false));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!message.trim()) { toast.error('Message is required'); return; }
    if (audience === 'individual' && !selectedUser) { toast.error('Please select a recipient'); return; }

    setSending(true);
    try {
      await api.sendNotification({
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        targetType: audience,
        targetUserId: audience === 'individual' ? selectedUser!.id : undefined,
      });
      toast.success(
        audience === 'broadcast'
          ? 'Notification broadcast to all staff & doctors'
          : `Notification sent to ${selectedUser!.fullName}`,
      );
      setTitle('');
      setMessage('');
      setSelectedUser(null);
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary-200/60 dark:border-primary-700/30 overflow-visible">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-500/15">
            <Send className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span>Send Notification</span>
        </CardTitle>
      </CardHeader>
      <CardBody className="overflow-visible">
        <form onSubmit={handleSend} className="space-y-5">

          {/* Audience selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2.5">
              Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: 'broadcast' as const,
                  label: 'All Staff & Doctors',
                  sub: 'Admins, doctors, and general staff',
                  icon: <Users className="h-4 w-4" />,
                },
                {
                  value: 'individual' as const,
                  label: 'Individual User',
                  sub: 'Target any specific user or patient',
                  icon: <UserIcon className="h-4 w-4" />,
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setAudience(opt.value); setSelectedUser(null); }}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150',
                    audience === opt.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-sm shadow-primary-200 dark:shadow-primary-900'
                      : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
                  )}
                >
                  <div className={cn(
                    'mt-0.5 shrink-0 p-1.5 rounded-lg',
                    audience === opt.value
                      ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-400',
                  )}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', audience === opt.value ? 'text-primary-700 dark:text-primary-300' : 'text-ink-700 dark:text-ink-300')}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{opt.sub}</p>
                  </div>
                  {audience === opt.value && (
                    <div className="shrink-0 h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User picker — only for individual */}
          <AnimatePresence>
            {audience === 'individual' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-visible"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1 overflow-visible">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">
                      Recipient
                    </label>
                    {staffLoading ? (
                      <div className="h-12 rounded-xl bg-ink-100 dark:bg-ink-800 animate-pulse" />
                    ) : (
                      <UserSearchDropdown
                        staffList={staffList}
                        value={selectedUser}
                        onChange={setSelectedUser}
                      />
                    )}
                  </div>
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="mb-0.5 p-2.5 rounded-xl text-ink-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 border border-ink-200 dark:border-ink-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNotifType(t.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all duration-100',
                      notifType === t.value
                        ? t.activeClass
                        : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:border-ink-300 dark:hover:border-ink-600',
                    )}
                  >
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="sm:col-span-2">
              <Input
                label="Title"
                placeholder="e.g. System Maintenance Tonight"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write your notification message here…"
              required
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-sm transition-all duration-150 resize-none outline-none',
                'bg-white dark:bg-ink-900 text-ink-800 dark:text-ink-200',
                'placeholder:text-ink-400 dark:placeholder:text-ink-500',
                'border-ink-200 dark:border-ink-700',
                'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={sending}
              leftIcon={<Send className="h-4 w-4" />}
              className="min-w-40"
            >
              {sending
                ? 'Sending…'
                : audience === 'broadcast'
                  ? 'Broadcast Notification'
                  : `Send to ${selectedUser?.fullName ?? 'User'}`}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

    // Subscribe to new notifications in real-time
    const channel = supabase
      .channel('notifications-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          api.getNotifications().then(setNotifications).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (unread === 0) return;
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      await api.clearNotifications();
      setNotifications([]);
      toast.success('Notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleItemClick = async (n: Notification) => {
    if (n.read) return;
    try {
      await api.markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
      );
    } catch {
      // Silently ignore — non-critical UI update
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {isAdmin
              ? 'Broadcast alerts or send direct messages to any user'
              : 'Your alerts and messages from the system'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && <Badge variant="danger">{unread} unread</Badge>}
          {notifications.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Check className="h-4 w-4" />}
                onClick={handleMarkAllRead}
                disabled={unread === 0}
              >
                Mark all as read
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Admin compose panel */}
      {isAdmin && <SendNotificationPanel onSent={load} />}

      {/* Section divider */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">
            {notifications.length > 0
              ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
              : 'Inbox'}
          </p>
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
        </div>
      )}

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title="No notifications"
              description={
                isAdmin
                  ? 'No notifications yet. Use the panel above to send one.'
                  : "You're all caught up!"
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.025 }}
                onClick={() => handleItemClick(n)}
                className={cn(
                  'flex gap-3 px-5 py-4 border-b border-ink-100 dark:border-ink-800/50 last:border-0',
                  'cursor-pointer hover:bg-ink-50/60 dark:hover:bg-ink-800/25 transition-colors',
                  !n.read && 'bg-primary-50/40 dark:bg-primary-500/5',
                )}
              >
                {/* Type dot */}
                <div className={cn('mt-2 h-2 w-2 rounded-full shrink-0', DOT_COLOR[n.type])} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 leading-snug">
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      {n.targetType === 'individual' && (
                        <Badge variant="neutral" size="sm" className="text-[10px] gap-0.5">
                          <UserIcon className="h-2.5 w-2.5" />Direct
                        </Badge>
                      )}
                      {n.targetType === 'broadcast' && isAdmin && (
                        <Badge variant="primary" size="sm" className="text-[10px] gap-0.5">
                          <Users className="h-2.5 w-2.5" />Broadcast
                        </Badge>
                      )}
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary-500 ring-2 ring-primary-200 dark:ring-primary-900" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">{n.message}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-500 mt-1.5">{timeAgo(n.time)}</p>
                </div>
              </motion.div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
