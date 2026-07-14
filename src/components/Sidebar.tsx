import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, X, HeartPulse } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { getIcon } from '../utils/icons';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import { Avatar } from './ui';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-ink-200/70 dark:border-ink-800 shrink-0', collapsed ? 'justify-center' : 'justify-between')}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-sm shadow-primary-600/30">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-ink-900 dark:text-white leading-none">Subhan Care</p>
              <p className="text-[10px] text-ink-400 dark:text-ink-500 font-medium tracking-wide">CLINIC</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggle} className="hidden lg:flex p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Collapse sidebar">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
        {!collapsed && <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-600">Menu</p>}
        <ul className="space-y-1">
          {NAV_ITEMS.filter((item) => item.roles.includes(user?.role ?? 'general_staff')).map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      collapsed && 'justify-center',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                        : 'text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800/60',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary-600 dark:bg-primary-500" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                      )}
                      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary-600 dark:text-primary-400')} />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-ink-200/70 dark:border-ink-800 p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar src={user?.avatar} name={user?.name ?? ''} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{user?.name}</p>
              <p className="text-xs text-ink-400 dark:text-ink-500 capitalize truncate">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center p-2.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        )}
        {collapsed && (
          <button onClick={onToggle} className="hidden lg:flex w-full mt-2 justify-center p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Expand sidebar">
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: 'spring', stiffness: 360, damping: 38 }}
        className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 glass border-r border-ink-200/70 dark:border-ink-800 overflow-hidden"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onMobileClose} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 38 }}
              className="absolute left-0 top-0 bottom-0 w-72 glass-strong border-r border-ink-200 dark:border-ink-800"
            >
              <button onClick={onMobileClose} className="absolute right-3 top-4 p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 z-10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
