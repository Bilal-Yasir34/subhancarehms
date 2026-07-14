import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input, Button } from '../../components/ui';
import { supabase } from '../../services/supabase';

interface ForgotForm {
  email: string;
}

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400 transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      {sent ? (
        <div className="text-center py-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-50 dark:bg-secondary-500/15 text-secondary-600 dark:text-secondary-400">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Check your email</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">We've sent a password reset link to your email. Please click the link to reset your password.</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Forgot password?</h1>
            <p className="mt-2 text-ink-500 dark:text-ink-400">No worries — enter your email and we'll send a reset link.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@subhancare.med"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={!loading && <ArrowRight className="h-4 w-4" />}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
