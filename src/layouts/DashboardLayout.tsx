import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useMediaQuery } from '../hooks';

const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -8, filter: 'blur(1px)' },
};

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="min-h-screen gradient-mesh">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <motion.div
        animate={{ paddingLeft: isDesktop ? (collapsed ? 72 : 260) : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}
