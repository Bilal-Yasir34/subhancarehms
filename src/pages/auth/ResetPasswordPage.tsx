import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input, Button } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { cn } from '../../utils';

interface ResetForm {
  password: string;
  confirm: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();

  const password = watch('password');

  const strength = (() => {
    const p = password ?? '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-ink-300', 'bg-danger-500', 'bg-warning-500', 'bg-accent-500', 'bg-secondary-500'];

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      setDone(true);
      toast.success('Password reset successfully');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
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
          <p className="mt-2 text-ink-500 dark:text-ink-400">Your password has been reset. Redirecting to login…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400 transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Set new password</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">Create a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < strength ? strengthColors[strength] : 'bg-ink-200 dark:bg-ink-700')} />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-400">{strengthLabels[strength]}</p>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Please confirm your password',
            validate: (v) => v === password || 'Passwords do not match',
          })}
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {loading ? 'Resetting…' : 'Reset Password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
