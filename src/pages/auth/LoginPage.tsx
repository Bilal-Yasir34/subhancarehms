import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

const ROLE_HOME: Record<UserRole, string> = {
  admin: '/dashboard',
  doctor: '/my-patients',
  general_staff: '/dashboard',
  receptionist: '/dashboard',
  patient: '/dashboard',
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { email: '', password: '', remember: true },
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const dest = from ?? ROLE_HOME[user.role] ?? '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">Welcome back</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">Sign in to access your dashboard</p>
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

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="hover:text-ink-600 dark:hover:text-ink-300 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" {...register('remember')} className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500 dark:border-ink-600 dark:bg-ink-800" />
            <span className="text-sm text-ink-600 dark:text-ink-400">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading} leftIcon={!loading && <LogIn className="h-4 w-4" />}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
    </AuthLayout>
  );
}
