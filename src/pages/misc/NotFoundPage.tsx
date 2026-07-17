import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../../components/ui';

const floatVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

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

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none" />

      {/* Decorative blobs */}
      <div className="fixed top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

      <motion.div
        className="relative z-10 text-center max-w-lg"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Floating 404 illustration */}
        <motion.div
          variants={floatVariants}
          initial="initial"
          animate="animate"
          className="relative mx-auto mb-8 w-fit"
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary-300/40 dark:border-primary-500/20 scale-110 animate-[spin_20s_linear_infinite]" />

          <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-white dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.3)]">
            {/* Inner icon */}
            <div className="flex flex-col items-center gap-1">
              <Compass className="h-14 w-14 text-primary-500" strokeWidth={1.5} />
              <span className="text-xs font-bold uppercase tracking-widest text-ink-400 dark:text-ink-500">Lost?</span>
            </div>
          </div>
        </motion.div>

        {/* 404 number */}
        <motion.div variants={itemVariants}>
          <p className="text-[100px] font-black leading-none bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent select-none">
            404
          </p>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="mt-2 text-2xl font-bold text-ink-900 dark:text-white"
        >
          Page Not Found
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="mt-3 text-ink-500 dark:text-ink-400 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved. Check the URL or head back to a safe place.
        </motion.p>

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
          Subhan Care HMS · Error 404
        </motion.p>
      </motion.div>
    </div>
  );
}
