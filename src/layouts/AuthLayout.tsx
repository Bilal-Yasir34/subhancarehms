import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Stethoscope } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../constants';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-ink-50 dark:bg-ink-950">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600">
        <div className="absolute inset-0 bg-grid opacity-20" />
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-32 left-16 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
              <img src="/logo.png" className="h-full w-full object-contain" alt="Subhan Care Logo" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{APP_NAME}</p>
              <p className="text-xs text-white/70 mt-1 tracking-wide">{APP_TAGLINE.toUpperCase()}</p>
            </div>
          </div>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl xl:text-5xl font-bold leading-tight"
            >
              The future of hospital management, today.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-5 text-lg text-white/80 leading-relaxed"
            >
              Unified patient care, appointments, billing, and analytics — all in one beautifully crafted platform.
            </motion.p>

            <div className="mt-10 space-y-4">
              {[
                { icon: ShieldCheck, text: 'HIPAA-compliant security & role-based access' },
                { icon: Activity, text: 'Real-time patient monitoring & activity feeds' },
                { icon: Stethoscope, text: 'Streamlined workflows for doctors & staff' },
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <feat.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm text-white/90">{feat.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/60">© 2026 Subhan Care Clinic. All rights reserved.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
            <img src="/logo.png" className="h-full w-full object-contain" alt="Subhan Care Logo" />
          </div>
          <p className="font-bold text-ink-900 dark:text-white">{APP_NAME}</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
