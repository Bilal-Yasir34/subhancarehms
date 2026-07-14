import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, AlertTriangle, Minus, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Input, Badge, Modal, SkeletonCard, EmptyState } from '../../components/ui';
import { api } from '../../services/api';
import { useAsync } from '../../hooks';
import type { BloodBankStock } from '../../types';

export function BloodBankPage() {
  const { data, loading, reload } = useAsync(() => api.getBloodBankStock(), []);
  const [editing, setEditing] = useState<BloodBankStock | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const stock = useMemo(() => data ?? [], [data]);
  const lowStock = useMemo(() => stock.filter((s) => s.unitsAvailable <= s.reorderLevel), [stock]);
  const totalUnits = useMemo(() => stock.reduce((sum, s) => sum + s.unitsAvailable, 0), [stock]);

  const adjust = async (item: BloodBankStock, delta: number) => {
    const next = Math.max(0, item.unitsAvailable + delta);
    setPendingId(item.id);
    try {
      await api.updateBloodBankStock(item.id, { unitsAvailable: next });
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setPendingId(null);
    }
  };

  const handleSave = async (form: { unitsAvailable: number; reorderLevel: number; location: string }) => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.updateBloodBankStock(editing.id, {
        unitsAvailable: form.unitsAvailable,
        reorderLevel: form.reorderLevel,
        location: form.location || undefined,
      });
      toast.success(`${editing.bloodType} stock updated`);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Blood Bank</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Track and update available blood unit stock by type</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-ink-200/70 dark:border-ink-800 bg-white/60 dark:bg-ink-900/40 px-4 py-2.5">
          <Droplets className="h-4 w-4 text-red-500" />
          <span className="text-sm text-ink-500 dark:text-ink-400">Total units:</span>
          <span className="text-sm font-semibold text-ink-900 dark:text-white">{totalUnits}</span>
        </div>
      </div>

      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10">
            <CardBody className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">{lowStock.length}</span> blood type{lowStock.length > 1 ? 's are' : ' is'} at or below reorder level: {lowStock.map((s) => s.bloodType).join(', ')}
              </p>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} className="h-40" />)}
        </div>
      ) : stock.length === 0 ? (
        <EmptyState icon={<Droplets className="h-10 w-10" />} title="No blood bank records" description="Blood type records will appear here once set up." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stock.map((item, i) => {
            const isLow = item.unitsAvailable <= item.reorderLevel;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="h-full">
                  <CardBody className="flex flex-col gap-4 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 shrink-0">
                          <Droplets className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-ink-900 dark:text-white leading-none">{item.bloodType}</p>
                          {item.location && <p className="text-xs text-ink-400 mt-1">{item.location}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditing(item)}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                        aria-label={`Edit ${item.bloodType} stock`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <p className="text-3xl font-bold text-ink-900 dark:text-white">{item.unitsAvailable}</p>
                      <p className="text-xs text-ink-400">units available · reorder at {item.reorderLevel}</p>
                    </div>

                    {isLow ? <Badge variant="warning">Low Stock</Badge> : <Badge variant="success">In Stock</Badge>}

                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => adjust(item, -1)}
                        disabled={pendingId === item.id || item.unitsAvailable === 0}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-ink-200 dark:border-ink-700 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" /> Unit
                      </button>
                      <button
                        onClick={() => adjust(item, 1)}
                        disabled={pendingId === item.id}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-ink-200 dark:border-ink-700 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" /> Unit
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {editing && (
        <BloodBankFormModal
          item={editing}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function BloodBankFormModal({ item, saving, onSave, onClose }: {
  item: BloodBankStock;
  saving: boolean;
  onSave: (data: { unitsAvailable: number; reorderLevel: number; location: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    unitsAvailable: item.unitsAvailable,
    reorderLevel: item.reorderLevel,
    location: item.location ?? '',
  });

  const update = (key: keyof typeof form, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      unitsAvailable: Number(form.unitsAvailable),
      reorderLevel: Number(form.reorderLevel),
      location: form.location,
    });
  };

  return (
    <Modal open onClose={onClose} title={`Update ${item.bloodType} Stock`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Units Available" type="number" min={0} value={form.unitsAvailable} onChange={(e) => update('unitsAvailable', e.target.value)} required />
        <Input label="Reorder Level" type="number" min={0} value={form.reorderLevel} onChange={(e) => update('reorderLevel', e.target.value)} required />
        <Input label="Storage Location" placeholder="e.g. Fridge 2, Shelf B" value={form.location} onChange={(e) => update('location', e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
