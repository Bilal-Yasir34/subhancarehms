import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { LogOut, ChevronLeft, X } from 'lucide-react';
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

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role ?? 'general_staff'));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-ink-200/70 dark:border-ink-800 shrink-0',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <motion.div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 overflow-hidden shadow-sm"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.08 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/logo.png" className="h-full w-full object-contain" alt="Subhan Care Logo" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="font-bold text-ink-900 dark:text-white leading-none">Subhan Care</p>
                <p className="text-[10px] text-ink-400 dark:text-ink-500 font-medium tracking-widest uppercase">HMS</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="hidden lg:flex p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 no-scrollbar">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-400 dark:text-ink-600"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        <motion.ul
          className="space-y-0.5"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {navItems.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <motion.li key={item.path} variants={itemVariants}>
                <NavLink
                  to={item.path}
                  onClick={onMobileClose}
                  className={({ isActive }) => cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 shadow-sm'
                      : 'text-ink-600 hover:bg-ink-100/80 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800/70 dark:hover:text-ink-200',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator pill */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-pill"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary-600 dark:bg-primary-400"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            exit={{ scaleY: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className={cn('shrink-0', isActive && 'text-primary-600 dark:text-primary-400')}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </motion.div>

                      {/* Label */}
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Active dot when collapsed */}
                      {collapsed && isActive && (
                        <motion.div
                          layoutId="sidebar-dot"
                          className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary-500"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.li>
            );
          })}
        </motion.ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-ink-200/70 dark:border-ink-800 p-2.5 shrink-0">
        {!collapsed ? (
          <motion.div
            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
            whileHover={{ x: 2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Avatar src={user?.avatar} name={user?.name ?? ''} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 truncate">{user?.name}</p>
              <p className="text-xs text-ink-400 dark:text-ink-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-full flex justify-center p-2.5 rounded-xl text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        )}

        {collapsed && (
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            className="hidden lg:flex w-full mt-2 justify-center p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </motion.button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 glass border-r border-ink-200/70 dark:border-ink-800 overflow-hidden"
      >
        {content}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
              className="absolute left-0 top-0 bottom-0 w-72 glass-strong border-r border-ink-200 dark:border-ink-800 shadow-2xl"
            >
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-4 p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 z-10"
                aria-label="Close menu"
              >
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
