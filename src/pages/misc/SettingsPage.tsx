import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Palette, Moon, Sun, Mail, Eye, EyeOff, Lock, CheckCircle2, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, Input, Button, Avatar, Badge, Select } from '../../components/ui';
import { Tabs } from '../../components/Tabs';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { cn } from '../../utils';

export function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'profile';
  const [tab, setTab] = useState(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Profile form state
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [doctorStatus, setDoctorStatus] = useState<string>('available');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Account deletion state
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    if (user?.role === 'doctor' && user?.doctorId) {
      const loadDoc = () => {
        api.getDoctor(user.doctorId!)
          .then((doc) => { if (doc) setDoctorStatus(doc.status); })
          .catch(() => {});
      };
      loadDoc();
      channel = supabase
        .channel('doctor-settings-status')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, () => loadDoc())
        .subscribe();
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  const tabs = [
    { label: 'Profile',       value: 'profile',       icon: <User className="h-4 w-4" /> },
    { label: 'Notifications', value: 'notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Security',      value: 'security',      icon: <Shield className="h-4 w-4" /> },
    { label: 'Appearance',    value: 'appearance',    icon: <Palette className="h-4 w-4" /> },
  ];

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!email.trim()) { toast.error('Email cannot be empty'); return; }
    setSavingProfile(true);
    try {
      const nameChanged  = name.trim()  !== user.name;
      const phoneChanged = phone.trim() !== (user.phone ?? '');
      const emailChanged = email.trim() !== user.email;
      if (nameChanged || phoneChanged) {
        await api.updateStaffProfile(user.id, { full_name: name.trim(), phone: phone.trim() || undefined });
      }
      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() });
        if (error) throw error;
      }
      if (user.role === 'doctor' && user.doctorId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await api.updateDoctor(user.doctorId, { status: doctorStatus as any });
      }
      await refreshUser();
      toast.success(emailChanged
        ? 'Profile saved. Check your inbox to confirm your new email — it will take effect once confirmed.'
        : 'Profile saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = useCallback(async () => {
    if (!user) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields'); return;
    }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (currentPassword === newPassword) { toast.error('New password must be different from your current password'); return; }

    setSavingPassword(true);
    try {
      // Verify current password using an isolated client so that signInWithPassword
      // does NOT trigger onAuthStateChange on the main client.
      const { createClient } = await import('@supabase/supabase-js');
      const verifyClient = createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
      );
      const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) { toast.error('Current password is incorrect'); return; }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password updated successfully! Use your new password next time you log in.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  }, [user, currentPassword, newPassword, confirmPassword]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    if (deleteConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast.error('Email address does not match. Please type your email exactly.'); return;
    }
    setDeletingAccount(true);
    try {
      // Delete the staff_profile row (cascades to linked doctor/patient records
      // and targeted notifications via the existing deleteStaffProfile logic).
      await api.deleteStaffProfile(user.id);
      await logout();
      toast.success('Your account and all associated data have been permanently deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account. Please contact an administrator.');
      setDeletingAccount(false);
    }
  }, [user, deleteConfirmEmail, logout]);

  // Password strength helpers
  const pwChecks = [
    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
    { label: 'Contains a number',     ok: /\d/.test(newPassword) },
    { label: 'Contains a letter',     ok: /[a-zA-Z]/.test(newPassword) },
    { label: 'Passwords match',       ok: newPassword.length > 0 && newPassword === confirmPassword },
  ];
  const pwStrength      = pwChecks.filter((c) => c.ok).length;
  const pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', 'bg-danger-500', 'bg-warning-500', 'bg-secondary-400', 'bg-secondary-500'][pwStrength];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-3">
            <Tabs variant="pills" value={tab} onChange={handleTabChange} tabs={tabs} className="flex-col !bg-transparent p-0" />
          </CardBody>
        </Card>

        <div className="lg:col-span-3">
          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
                <CardBody className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Avatar src={user?.avatar} name={user?.name ?? ''} size="xl" ring />
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-ink-100">{user?.name}</p>
                      <p className="text-sm text-ink-500">{user?.email}</p>
                      <Badge variant="primary" className="mt-2 capitalize">{user?.role}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="h-4 w-4" />} />
                    <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
                    {user?.role === 'doctor' && (
                      <Select
                        label="Activity Status"
                        value={doctorStatus}
                        onChange={(e) => setDoctorStatus(e.target.value)}
                        options={[
                          { value: 'available', label: 'Available' },
                          { value: 'busy',      label: 'Busy' },
                          { value: 'off-duty',  label: 'Off Duty' },
                          { value: 'on-leave',  label: 'On Leave' },
                        ]}
                      />
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} loading={savingProfile}>Save Changes</Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* ── Notifications Tab ── */}
          {tab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  {[
                    { label: 'New appointments',   desc: 'Get notified when a new appointment is booked' },
                    { label: 'Patient admissions', desc: 'Alerts for new patient admissions' },
                    { label: 'Payment received',   desc: 'Notifications for completed payments' },
                    { label: 'Lab results ready',  desc: 'Alerts when lab results are available' },
                    { label: 'Weekly summary',     desc: 'Digest of hospital activity every Monday' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800/60 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{item.label}</p>
                        <p className="text-xs text-ink-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-ink-200 dark:bg-ink-700 peer-focus:ring-2 peer-focus:ring-primary-500/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* ── Security Tab ── */}
          {tab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Change password card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary-500" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-5">
                  {/* Current password */}
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="h-px bg-ink-100 dark:bg-ink-800" />

                  {/* New + confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors" tabIndex={-1}>
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        label="Confirm New Password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Strength bar + requirements */}
                  <AnimatePresence>
                    {newPassword.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-ink-500 dark:text-ink-400">Password strength</span>
                            <span className={cn('font-semibold', pwStrength <= 1 ? 'text-danger-500' : pwStrength === 2 ? 'text-warning-500' : 'text-secondary-500')}>{pwStrengthLabel}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300', i < pwStrength ? pwStrengthColor : 'bg-ink-200 dark:bg-ink-700')} />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {pwChecks.map((c) => (
                            <div key={c.label} className="flex items-center gap-2 text-xs">
                              {c.ok
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-secondary-500 shrink-0" />
                                : <XCircle className="h-3.5 w-3.5 text-ink-300 dark:text-ink-600 shrink-0" />}
                              <span className={c.ok ? 'text-secondary-600 dark:text-secondary-400' : 'text-ink-400 dark:text-ink-500'}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-end pt-2 border-t border-ink-100 dark:border-ink-800">
                    <Button onClick={handleUpdatePassword} loading={savingPassword} disabled={savingPassword || pwStrength < 3} leftIcon={<Lock className="h-4 w-4" />}>
                      Update Password
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* ── Danger Zone: Account Deletion ── */}
              <Card className="border border-danger-200 dark:border-danger-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Delete My Account</p>
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
                      Permanently deletes your account and all associated personal data (profile, linked doctor or patient record, notifications).
                      This action <strong>cannot be undone</strong>.
                    </p>
                  </div>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => { setDeleteConfirmEmail(''); setShowDeleteConfirm(true); }}
                      className="border-danger-300 text-danger-600 hover:bg-danger-50 dark:border-danger-700 dark:text-danger-400 dark:hover:bg-danger-900/20"
                    >
                      Delete My Account
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-4 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800/50"
                    >
                      <p className="text-sm text-danger-700 dark:text-danger-400">
                        To confirm, type your email address: <strong>{user?.email}</strong>
                      </p>
                      <Input
                        label="Confirm Email"
                        type="email"
                        placeholder={user?.email}
                        value={deleteConfirmEmail}
                        onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      />
                      <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmEmail(''); }} disabled={deletingAccount}>
                          Cancel
                        </Button>
                        <Button
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          loading={deletingAccount}
                          onClick={handleDeleteAccount}
                          className="bg-danger-600 hover:bg-danger-700 text-white border-transparent"
                          disabled={deleteConfirmEmail.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()}
                        >
                          {deletingAccount ? 'Deleting…' : 'Permanently Delete Account'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* ── Appearance Tab ── */}
          {tab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-500">
                        {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Theme</p>
                        <p className="text-xs text-ink-400">Switch between light and dark mode</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={cn('relative inline-flex h-7 w-12 items-center rounded-full transition-colors', theme === 'dark' ? 'bg-primary-600' : 'bg-ink-200')}
                    >
                      <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white transition-transform', theme === 'dark' ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
