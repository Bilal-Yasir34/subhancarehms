import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, ReceiptText, Filter, Eye, Trash2, DollarSign, TrendingUp,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Select, Avatar, StatusBadge, Pagination, SkeletonCard, EmptyState, ConfirmDialog, Modal, Badge } from '../../components/ui';
import { SearchBox } from '../../components/SearchBox';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDebounce, useAsync } from '../../hooks';
import type { Invoice, InvoiceItem, Patient } from '../../types';
import { formatCurrency, formatDate, cn, randomId } from '../../utils';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const itemCatalog = [
  { description: 'Consultation Fee', category: 'Consultation', unitPrice: 150 },
  { description: 'Blood Test (CBC)', category: 'Laboratory', unitPrice: 85 },
  { description: 'X-Ray Chest', category: 'Radiology', unitPrice: 180 },
  { description: 'Room Charges (per day)', category: 'Room', unitPrice: 350 },
  { description: 'Physiotherapy Session', category: 'Therapy', unitPrice: 120 },
  { description: 'Medication - IV', category: 'Pharmacy', unitPrice: 95 },
];

export function BillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create invoice form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    api.getPatients({ pageSize: 100 }).then((r) => setPatients(r.items)).catch(() => {});
  }, []);

  // Stats
  const { data: allInvoices } = useAsync(async () => {
    const params: Parameters<typeof api.getInvoices>[0] = { pageSize: 1000 };
    if (user?.role === 'patient' && user.patientId) {
      params.patientId = user.patientId;
    }
    const res = await api.getInvoices(params);
    return res.items;
  }, [user]);

  const stats = (() => {
    const list = allInvoices ?? [];
    if (user?.role === 'patient') {
      const myInvoices = list;
      const totalRev = myInvoices.reduce((s, i) => s + i.total, 0);
      const outstanding = myInvoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amountPaid), 0);
      const overdue = myInvoices.filter((i) => i.status === 'overdue').length;
      const paid = myInvoices.filter((i) => i.status === 'paid').length;
      return { totalRev, outstanding, overdue, paid };
    }
    const totalRev = list.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amountPaid, 0);
    const outstanding = list.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.total - i.amountPaid), 0);
    const overdue = list.filter((i) => i.status === 'overdue').length;
    const paid = list.filter((i) => i.status === 'paid').length;
    return { totalRev, outstanding, overdue, paid };
  })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.getInvoices>[0] = { page, search: debouncedSearch, status };
      if (user?.role === 'patient' && user.patientId) {
        params.patientId = user.patientId;
      }
      const res = await api.getInvoices(params);
      setInvoices(res.items);
      setTotal(res.total);
    } catch {
      // Do not log the raw error — Supabase errors may contain query context
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, user]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteInvoice) return;
    setDeleting(true);
    try {
      await api.deleteInvoice(deleteInvoice.id);
      toast.success('Invoice deleted');
      setDeleteInvoice(null);
      load();
    } catch {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const addItem = (cat: typeof itemCatalog[0]) => {
    setItems((prev) => [...prev, { id: randomId('item'), description: cat.description, category: cat.category, quantity: 1, unitPrice: cat.unitPrice }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const total2 = subtotal - discount;

  const handleCreate = async () => {
    const patient = patients.find((p) => p.id === selectedPatient);
    if (!patient || items.length === 0) { toast.error('Select patient and add at least one item'); return; }
    setCreating(true);
    try {
      await api.createInvoice({
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientAvatar: patient.avatar,
        items, discount,
      });
      toast.success('Invoice created');
      setCreateOpen(false);
      setSelectedPatient(''); setItems([]); setDiscount(0);
      load();
    } catch {
      toast.error('Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const statCards = [
    { label: user?.role === 'patient' ? 'Total Billed' : 'Total Revenue', value: stats.totalRev, icon: <DollarSign className="h-5 w-5" />, color: 'text-secondary-600 bg-secondary-50 dark:bg-secondary-500/15 dark:text-secondary-400', prefix: 'Rs. ' },
    { label: user?.role === 'patient' ? 'Outstanding Balance' : 'Outstanding', value: stats.outstanding, icon: <TrendingUp className="h-5 w-5" />, color: 'text-warning-600 bg-warning-50 dark:bg-warning-500/15 dark:text-warning-400', prefix: 'Rs. ' },
    { label: user?.role === 'patient' ? 'Overdue Bills' : 'Overdue', value: stats.overdue, icon: <AlertCircle className="h-5 w-5" />, color: 'text-danger-600 bg-danger-50 dark:bg-danger-500/15 dark:text-danger-400' },
    { label: user?.role === 'patient' ? 'Paid Bills' : 'Paid Invoices', value: stats.paid, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-primary-600 bg-primary-50 dark:bg-primary-500/15 dark:text-primary-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Billing</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{total} invoices</p>
        </div>
        {(user?.role !== 'patient') && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Generate Invoice</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{s.label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-ink-900 dark:text-ink-100">{s.prefix}{s.value.toLocaleString()}</p>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.color)}>{s.icon}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBox value={search} onChange={setSearch} placeholder="Search by invoice number or patient…" className="flex-1" />
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
          </div>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <Select label="Status" options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
            </motion.div>
          )}
        </CardBody>
      </Card>

      {/* Invoice list */}
      {loading ? (
        <Card><CardBody className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</CardBody></Card>
      ) : invoices.length === 0 ? (
        <Card><EmptyState icon={<ReceiptText className="h-8 w-8" />} title="No invoices found" description="Try adjusting filters or generate a new invoice." action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Generate Invoice</Button>} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/40 border-b border-ink-200 dark:border-ink-800">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Invoice</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Patient</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300 hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300 hidden lg:table-cell">Due Date</th>
                  <th className="text-right px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-ink-600 dark:text-ink-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
                {invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-ink-50/60 dark:hover:bg-ink-800/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link to={`/billing/${inv.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={inv.patientAvatar} name={inv.patientName} size="xs" />
                        <span className="text-ink-700 dark:text-ink-300 truncate">{inv.patientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-ink-500">{formatDate(inv.date)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-ink-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink-800 dark:text-ink-200">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/billing/${inv.id}`} className="p-1.5 rounded-lg text-ink-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/15 transition-colors" aria-label="View"><Eye className="h-4 w-4" /></Link>
                        {(user?.role !== 'patient') && <button onClick={() => setDeleteInvoice(inv)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && total > 0 && <Pagination page={page} pageSize={8} total={total} onPageChange={setPage} />}

      {/* Create Invoice Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Generate Invoice"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create Invoice</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select
            label="Select Patient"
            placeholder="Choose a patient…"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            options={patients.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName} — ${p.mrn}` }))}
          />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-700 dark:text-ink-300">Invoice Items</label>
              <div className="flex flex-wrap gap-1.5">
                {itemCatalog.map((cat) => (
                  <button key={cat.description} onClick={() => addItem(cat)} className="text-xs px-2.5 py-1 rounded-lg border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:border-primary-300 hover:text-primary-600 transition-colors">
                    + {cat.description}
                  </button>
                ))}
              </div>
            </div>
            {items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-ink-200 dark:border-ink-700 p-8 text-center text-sm text-ink-400">
                No items added. Click the buttons above to add services.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg bg-ink-50 dark:bg-ink-800/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{item.description}</p>
                      <Badge variant="neutral" size="sm" className="mt-0.5">{item.category}</Badge>
                    </div>
                    <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))} className="w-16 h-9 text-center rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm" />
                    <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))} className="w-24 h-9 text-center rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm" />
                    <span className="w-24 text-right text-sm font-medium text-ink-800 dark:text-ink-200">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-medium text-ink-800 dark:text-ink-200">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Discount</span>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} className="w-24 h-8 text-right rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm" />
                </div>
                <div className="border-t border-ink-200 dark:border-ink-800 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-ink-900 dark:text-ink-100">Total</span>
                  <span className="text-xl font-bold text-ink-900 dark:text-ink-100">{formatCurrency(total2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Invoice"
        message={`Delete ${deleteInvoice?.invoiceNumber}? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
