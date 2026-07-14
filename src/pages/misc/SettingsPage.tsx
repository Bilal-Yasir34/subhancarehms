import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Moon, Sun, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader, CardTitle, Input, Button, Avatar, Badge, Select } from '../../components/ui';
import { Tabs } from '../../components/Tabs';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { cn } from '../../utils';

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState('profile');

  // Profile form state
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
  }, [user]);

  const tabs = [
    { label: 'Profile', value: 'profile', icon: <User className="h-4 w-4" /> },
    { label: 'Notifications', value: 'notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Security', value: 'security', icon: <Shield className="h-4 w-4" /> },
    { label: 'Appearance', value: 'appearance', icon: <Palette className="h-4 w-4" /> },
  ];

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!email.trim()) { toast.error('Email cannot be empty'); return; }

    setSavingProfile(true);
    try {
      const nameChanged = name.trim() !== user.name;
      const phoneChanged = phone.trim() !== (user.phone ?? '');
      const emailChanged = email.trim() !== user.email;

      if (nameChanged || phoneChanged) {
        await api.updateStaffProfile(user.id, {
          full_name: name.trim(),
          phone: phone.trim() || undefined,
        });
      }

      if (emailChanged) {
        const { error } = await supabase.auth.updateUser({ email: email.trim() });
        if (error) throw error;
      }

      await refreshUser();

      if (emailChanged) {
        toast.success('Profile saved. Check your inbox to confirm your new email — it will take effect once confirmed.');
      } else {
        toast.success('Profile saved');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      // Re-authenticate with the current password before allowing a change
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-3">
            <Tabs variant="pills" value={tab} onChange={setTab} tabs={tabs} className="flex-col !bg-transparent p-0" />
          </CardBody>
        </Card>

        <div className="lg:col-span-3">
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
                    <Select label="Language" options={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'Urdu' }]} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} loading={savingProfile}>Save Changes</Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {tab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  {[
                    { label: 'New appointments', desc: 'Get notified when a new appointment is booked' },
                    { label: 'Patient admissions', desc: 'Alerts for new patient admissions' },
                    { label: 'Payment received', desc: 'Notifications for completed payments' },
                    { label: 'Lab results ready', desc: 'Alerts when lab results are available' },
                    { label: 'Weekly summary', desc: 'Digest of hospital activity every Monday' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800/60 last:border-0">
                      <div><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{item.label}</p><p className="text-xs text-ink-400">{item.desc}</p></div>
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

          {tab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader><CardTitle>Security</CardTitle></CardHeader>
                <CardBody className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Current Password" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <div />
                    <Input label="New Password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <Input label="Confirm Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-ink-100 dark:border-ink-800">
                    <Button onClick={handleUpdatePassword} loading={savingPassword}>Update Password</Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}

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
                      <div><p className="text-sm font-medium text-ink-800 dark:text-ink-200">Theme</p><p className="text-xs text-ink-400">Switch between light and dark mode</p></div>
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
