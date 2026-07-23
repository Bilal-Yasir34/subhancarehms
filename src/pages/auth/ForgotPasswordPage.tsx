import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input, Button } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { cn } from '../../utils';

import { otpRateLimiter, passwordResetRateLimiter } from '../../utils/rateLimiter';
import { getSanitizedErrorMessage } from '../../utils/errorHandler';

interface Step1Form {
  email: string;
  code: string;
}

interface Step2Form {
  password: string;
  confirm: string;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  
  // Stored state from Step 1
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // Forms
  const { register: reg1, handleSubmit: sub1, formState: { errors: err1 } } = useForm<Step1Form>();
  const { register: reg2, handleSubmit: sub2, watch: watch2, formState: { errors: err2 } } = useForm<Step2Form>();

  const passwordVal = watch2('password');

  const passwordStrength = (() => {
    const p = passwordVal ?? '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-ink-300', 'bg-danger-500', 'bg-warning-500', 'bg-accent-500', 'bg-secondary-500'];

  // Submit Step 1: Verify Code
  const onVerifyCode = async (data: Step1Form) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const rateCheck = otpRateLimiter.check(trimmedEmail);
    if (!rateCheck.allowed) {
      toast.error(`Too many verification attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`);
      return;
    }

    setLoading(true);
    try {
      const { data: isValid, error } = await supabase.rpc('verify_reset_token', {
        p_email: trimmedEmail,
        p_token: data.code.trim(),
      });

      if (error) throw error;

      if (!isValid) {
        otpRateLimiter.increment(trimmedEmail);
        toast.error('Invalid email address or expired reset token.');
        return;
      }

      otpRateLimiter.reset(trimmedEmail);
      setEmail(trimmedEmail);
      setCode(data.code.trim());
      setStep(2);
      toast.success('Reset token verified.');
    } catch (err) {
      otpRateLimiter.increment(trimmedEmail);
      toast.error(getSanitizedErrorMessage(err, 'Verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2: Set New Password
  const onResetPassword = async (data: Step2Form) => {
    const rateCheck = passwordResetRateLimiter.check(email);
    if (!rateCheck.allowed) {
      toast.error(`Too many password reset attempts. Please wait ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minutes before trying again.`);
      return;
    }

    setLoading(true);
    try {
      const { data: success, error } = await supabase.rpc('reset_password_with_token', {
        p_email: email,
        p_token: code,
        p_new_password: data.password,
      });

      if (error) throw error;

      if (!success) {
        passwordResetRateLimiter.increment(email);
        toast.error('Failed to reset password. The token may have expired or already been used.');
        return;
      }

      passwordResetRateLimiter.reset(email);
      setDone(true);
      toast.success('Password updated successfully');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      passwordResetRateLimiter.increment(email);
      toast.error(getSanitizedErrorMessage(err, 'Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-50 dark:bg-secondary-500/15 text-secondary-600 dark:text-secondary-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Password updated</h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400 text-sm">Your password has been reset. Redirecting to login…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400 transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      {step === 1 ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Forgot password?</h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 leading-relaxed">
              Ask your system administrator for a password reset token.
            </p>
          </div>

          <form onSubmit={sub1(onVerifyCode)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@subhancare.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={err1.email?.message}
              {...reg1('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />

            <Input
              label="Reset Token"
              type="text"
              placeholder="Paste 64-character token"
              leftIcon={<Key className="h-4 w-4" />}
              error={err1.code?.message}
              {...reg1('code', {
                required: 'Reset token is required',
                minLength: { value: 16, message: 'Invalid token format' },
              })}
            />

            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={!loading && <ArrowRight className="h-4 w-4" />}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Set new password</h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Create a strong password for your account</p>
          </div>

          <form onSubmit={sub2(onResetPassword)} className="space-y-5">
            <div>
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="hover:text-ink-600 dark:hover:text-ink-300 transition-colors" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={err2.password?.message}
                {...reg2('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'At least 8 characters' },
                })}
              />
              {passwordVal && (
                <div className="mt-2">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < passwordStrength ? strengthColors[passwordStrength] : 'bg-ink-200 dark:bg-ink-700')} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-400">{strengthLabels[passwordStrength]}</p>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              error={err2.confirm?.message}
              {...reg2('confirm', {
                required: 'Please confirm your password',
                validate: (v) => v === passwordVal || 'Passwords do not match',
              })}
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
