import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Badge, SkeletonCard, EmptyState, Button } from '../../components/ui';
import { api } from '../../services/api';
import type { Notification } from '../../types';
import { timeAgo, cn } from '../../utils';

export function NotificationsPage() {
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
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (unread === 0) return;
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleItemClick = async (n: Notification) => {
    if (n.read) return;
    try {
      await api.markNotificationRead(n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">All recent activity and alerts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && <Badge variant="danger" className="mr-2">{unread} unread</Badge>}
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" description="You're all caught up." />
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
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => handleItemClick(n)}
                className={cn(
                  'flex gap-3 px-5 py-4 border-b border-ink-100 dark:border-ink-800/50 last:border-0 cursor-pointer hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors',
                  !n.read && 'bg-primary-50/40 dark:bg-primary-500/5',
                )}
              >
                <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', n.type === 'error' ? 'bg-danger-500' : n.type === 'warning' ? 'bg-warning-500' : n.type === 'success' ? 'bg-secondary-500' : 'bg-primary-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{n.title}</p>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-ink-400 mt-1.5">{timeAgo(n.time)}</p>
                </div>
              </motion.div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
