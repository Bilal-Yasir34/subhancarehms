import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui';

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

const shieldVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.06, 1],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none" />

      {/* Decorative blobs */}
      <div className="fixed top-1/3 right-1/3 h-80 w-80 rounded-full bg-danger-500/[0.08] blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 left-1/3 h-80 w-80 rounded-full bg-warning-500/[0.08] blur-3xl pointer-events-none" />

      <motion.div
        className="relative z-10 text-center max-w-lg"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Animated shield icon */}
        <motion.div
          variants={shieldVariants}
          initial="initial"
          animate="animate"
          className="mx-auto mb-8 flex h-44 w-44 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/15 border border-danger-200/60 dark:border-danger-500/20 shadow-[0_20px_60px_-20px_rgba(239,68,68,0.25)]"
        >
          <ShieldOff className="h-20 w-20 text-danger-500" strokeWidth={1.2} />
        </motion.div>

        {/* 403 number */}
        <motion.div variants={itemVariants}>
          <p className="text-[100px] font-black leading-none bg-gradient-to-br from-danger-600 via-danger-500 to-warning-500 bg-clip-text text-transparent select-none">
            403
          </p>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="mt-2 text-2xl font-bold text-ink-900 dark:text-white"
        >
          Access Denied
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="mt-3 text-ink-500 dark:text-ink-400 leading-relaxed"
        >
          You don't have permission to access this page. If you believe this is a mistake, please contact your system administrator.
        </motion.p>

        {/* Role hint banner */}
        <motion.div
          variants={itemVariants}
          className="mt-6 mx-auto max-w-xs rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 px-4 py-3"
        >
          <p className="text-xs text-danger-700 dark:text-danger-300 font-medium">
            Your current role does not have access to this section.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            leftIcon={<Home className="h-4 w-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          variants={itemVariants}
          className="mt-10 text-xs text-ink-300 dark:text-ink-600"
        >
          Subhan Care HMS · Error 403
        </motion.p>
      </motion.div>
    </div>
  );
}
