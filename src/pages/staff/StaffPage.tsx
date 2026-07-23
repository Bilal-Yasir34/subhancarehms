import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, UserCog, Edit2, Power, Mail, Phone, Trash2, Key, Eye, Copy, CheckCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Input, Select, Badge, Modal, Avatar, SkeletonCard, EmptyState, ConfirmDialog } from '../../components/ui';
import { api } from '../../services/api';
import { useAsync } from '../../hooks';
import { ROLES, DEPARTMENTS } from '../../constants';
import { formatDate } from '../../utils';
import type { UserRole, StaffProfile, Doctor } from '../../types';

export function StaffPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<StaffProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState<StaffProfile | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const { data: staff, loading, reload } = useAsync(() => api.getStaffProfiles(), []);

  const filtered = (staff ?? []).filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      await api.updateStaffProfile(toggleTarget.id, { active: !toggleTarget.active });
      toast.success(toggleTarget.active ? 'User deactivated' : 'User activated');
      setToggleTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleOpenViewModal = async (member: StaffProfile) => {
    setViewTarget(member);
    setResetToken(null);
    setTokenCopied(false);
  };

  const handleGenerateResetToken = async () => {
    if (!viewTarget || generatingToken) return;
    setGeneratingToken(true);
    setTokenCopied(false);
    try {
      const token = await api.generateResetToken(viewTarget.id);
      setResetToken(token);
      toast.success('Reset token generated — valid for 15 minutes.');
    } catch {
      toast.error('Failed to generate reset token.');
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (!resetToken) return;
    navigator.clipboard.writeText(resetToken).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 3000);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteStaffProfile(deleteTarget.id);
      toast.success('Staff member deleted successfully');
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Staff Management</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Register users and assign roles</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          Add Staff Member
        </Button>
      </div>

      <Card>
        <CardBody className="p-4 sm:p-5">
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="mb-4 max-w-sm"
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-40" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<UserCog className="h-10 w-10" />} title="No staff found" description="Register new staff members to get started." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="h-full">
                    <CardBody className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar src={member.avatar} name={member.fullName} size="lg" ring />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-ink-900 dark:text-ink-100">{member.fullName}</p>
                              <button
                                onClick={() => handleOpenViewModal(member)}
                                className="p-1 rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 transition-colors"
                                aria-label="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-ink-400 capitalize">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant={member.active ? 'success' : 'danger'}>
                          {member.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        {member.department && (
                          <p className="text-ink-500 dark:text-ink-400">
                            <span className="text-ink-400">Dept:</span> {member.department}
                          </p>
                        )}
                        {member.phone && (
                          <p className="text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> {member.phone}
                          </p>
                        )}
                        <p className="text-ink-400 text-xs">Joined {formatDate(member.createdAt)}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                          onClick={() => { setEditTarget(member); setModalOpen(true); }}
                        >
                          Edit
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Power className="h-3.5 w-3.5" />}
                            onClick={() => setToggleTarget(member)}
                            className={member.active ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}
                          >
                            {member.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => setDeleteTarget(member)}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {modalOpen && (
        <StaffFormModal
          staff={editTarget}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              if (editTarget) {
                await api.updateStaffProfile(editTarget.id, {
                  role: data.role,
                  department: data.department,
                  full_name: data.fullName,
                  phone: data.phone,
                });
                toast.success('Staff member updated');
              } else {
                if (data.createPortal) {
                  await api.createStaffUser(data.email, data.password, data.fullName, data.role, data.doctorId, data.department);
                } else {
                  await api.createStaffWithoutPortal(data.fullName, data.role, data.department, data.phone);
                }
                toast.success('Staff member registered');
              }
              setModalOpen(false);
              setEditTarget(null);
              reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to save');
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
        />
      )}

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.active ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${toggleTarget?.active ? 'deactivate' : 'activate'} "${toggleTarget?.fullName}"?`}
        confirmText={toggleTarget?.active ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.active ? 'danger' : 'primary'}
        onConfirm={handleToggleActive}
        onClose={() => setToggleTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${deleteTarget?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {viewTarget && (
        <Modal
          open={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title="Staff Details"
          size="md"
          footer={<Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-ink-100 dark:border-ink-800">
              <Avatar src={viewTarget.avatar} name={viewTarget.fullName} size="xl" ring />
              <div>
                <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">{viewTarget.fullName}</h3>
                <p className="text-sm text-ink-500 capitalize">{viewTarget.role?.replace('_', ' ')}</p>
                <Badge variant={viewTarget.active ? 'success' : 'danger'} className="mt-2">
                  {viewTarget.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-ink-50 dark:bg-ink-950/40 rounded-xl space-y-1">
                <p className="text-xs font-medium text-ink-400">Email Address</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200 break-all">{viewTarget.email}</p>
              </div>
              <div className="p-3 bg-ink-50 dark:bg-ink-950/40 rounded-xl space-y-1">
                <p className="text-xs font-medium text-ink-400">Phone Number</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200">{viewTarget.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-ink-50 dark:bg-ink-950/40 rounded-xl space-y-1">
                <p className="text-xs font-medium text-ink-400">Department</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200">{viewTarget.department || 'N/A'}</p>
              </div>
              <div className="p-3 bg-ink-50 dark:bg-ink-950/40 rounded-xl space-y-1">
                <p className="text-xs font-medium text-ink-400">Date Joined</p>
                <p className="font-semibold text-ink-800 dark:text-ink-200">{formatDate(viewTarget.createdAt)}</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl col-span-1 sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Password Reset Token</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${generatingToken ? 'animate-spin' : ''}`} />}
                    onClick={handleGenerateResetToken}
                    loading={generatingToken}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  >
                    {resetToken ? 'Regenerate' : 'Generate Token'}
                  </Button>
                </div>

                {resetToken ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-white dark:bg-ink-900 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2 text-amber-800 dark:text-amber-300 break-all select-all">
                        {resetToken}
                      </code>
                      <button
                        onClick={handleCopyToken}
                        className="shrink-0 p-2 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-white dark:bg-ink-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                        aria-label="Copy token"
                      >
                        {tokenCopied ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      ⏱ Expires in 15 minutes · Single-use · Share this with the staff member securely.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Click "Generate Token" to create a secure one-time reset link for this staff member.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface StaffFormData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  doctorId?: string;
  phone: string;
  createPortal?: boolean;
}

function StaffFormModal({ staff, saving, onSave, onClose }: {
  staff: StaffProfile | null;
  saving: boolean;
  onSave: (data: StaffFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<StaffFormData>({
    fullName: staff?.fullName ?? '',
    email: '',
    password: '',
    role: staff?.role ?? 'general_staff',
    department: staff?.department ?? DEPARTMENTS[0],
    doctorId: staff?.doctorId ?? undefined,
    phone: staff?.phone ?? '',
    createPortal: true,
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>(DEPARTMENTS);

  useEffect(() => {
    api.getDoctors({ pageSize: 100 })
      .then((res) => setDoctors(res.items))
      .catch(() => console.warn('Failed to load doctors list'));

    api.getDepartments().then((list) => {
      if (list.length > 0) {
        const names = list.map(d => d.name);
        setDepartmentsList(names);
        if (!names.includes(form.department)) {
          setForm(f => ({ ...f, department: names[0] }));
        }
      }
    }).catch(() => console.warn('Failed to load departments list'));
  }, []);

  const update = (key: keyof StaffFormData, value: StaffFormData[keyof StaffFormData]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    if (!staff && form.createPortal && (!form.email.trim() || !form.password.trim())) return;
    onSave(form);
  };

  return (
    <Modal open onClose={onClose} title={staff ? 'Edit Staff Member' : 'Register New Staff'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full Name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
        
        {!staff && (
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="createPortal"
              checked={form.createPortal}
              onChange={(e) => update('createPortal', e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500 dark:border-ink-600 dark:bg-ink-800"
            />
            <label htmlFor="createPortal" className="text-sm font-medium text-ink-700 dark:text-ink-300 cursor-pointer select-none">
              Create portal access (allow this user to login)
            </label>
          </div>
        )}

        {!staff && form.createPortal && (
          <>
            <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} leftIcon={<Mail className="h-4 w-4" />} required />
            <Input label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Allot user login password" required />
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => update('role', e.target.value as UserRole)}
            options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
          />
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            options={departmentsList.map((d) => ({ value: d, label: d }))}
          />
        </div>

        {form.role === 'doctor' && (
          <Select
            label="Link to Doctor Profile"
            value={form.doctorId || ''}
            onChange={(e) => update('doctorId', e.target.value || undefined)}
            options={[
              { value: '', label: 'Select doctor...' },
              ...doctors.map(d => ({ value: d.id, label: `Dr. ${d.firstName} ${d.lastName} (${d.specialty})` }))
            ]}
          />
        )}

        <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} leftIcon={<Phone className="h-4 w-4" />} placeholder="+92 300 0000000" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{staff ? 'Save Changes' : 'Register'}</Button>
        </div>
      </form>
    </Modal>
  );
}
