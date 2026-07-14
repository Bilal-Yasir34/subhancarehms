import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, Boxes } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Input, Select, Badge, Modal, ConfirmDialog, EmptyState, SkeletonCard, Pagination } from '../../components/ui';
import { api } from '../../services/api';
import { useAsync } from '../../hooks';
import { formatCurrency } from '../../utils';
import { INVENTORY_CATEGORIES } from '../../constants';
import type { InventoryItem } from '../../types';

const UNITS = ['units', 'tablets', 'capsules', 'boxes', 'kits', 'rolls', 'cylinders', 'sheets', 'bottles'];

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, reload } = useAsync(
    () => api.getInventoryItems({ page, pageSize: 8, search, category, excludeCategory: 'Medication' }),
    [page, search, category],
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const lowStockItems = useMemo(() => items.filter((i) => i.quantity <= i.reorderLevel), [items]);

  const handleSave = async (formData: Partial<InventoryItem>) => {
    setSaving(true);
    try {
      if (editing) {
        await api.updateInventoryItem(editing.id, formData);
        toast.success('Item updated');
      } else {
        await api.createInventoryItem(formData);
        toast.success('Item added');
      }
      setModalOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteInventoryItem(deleteTarget.id);
      toast.success('Item deleted');
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Inventory</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage general supplies, equipment, and lab reagents</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10">
            <CardBody className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">{lowStockItems.length}</span> item{lowStockItems.length > 1 ? 's' : ''} below reorder level: {lowStockItems.map((i) => i.name).join(', ')}
              </p>
            </CardBody>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Search by name, SKU, or supplier…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<Search className="h-4 w-4" />}
              className="flex-1"
            />
            <Select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              options={[{ value: 'all', label: 'All Categories' }, ...INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))]}
              className="sm:w-48"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-16" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={<Boxes className="h-10 w-10" />} title="No items found" description="Add inventory items or adjust your search filters." />
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-ink-400 border-b border-ink-100 dark:border-ink-800">
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">SKU</th>
                      <th className="px-4 py-3 font-semibold text-right">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50 dark:divide-ink-800/60">
                    {items.map((item, i) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 shrink-0">
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-ink-900 dark:text-ink-100">{item.name}</p>
                              <p className="text-xs text-ink-400">{item.supplier ?? '—'}{item.location ? ` · ${item.location}` : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-600 dark:text-ink-300">{item.category}</td>
                        <td className="px-4 py-3 text-ink-500 dark:text-ink-400 font-mono text-xs">{item.sku}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-ink-900 dark:text-ink-100">{item.quantity}</span>
                          <span className="text-xs text-ink-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-ink-100">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3">
                          {item.quantity <= item.reorderLevel ? (
                            <Badge variant="warning">Low Stock</Badge>
                          ) : item.quantity <= item.reorderLevel * 2 ? (
                            <Badge variant="accent">Moderate</Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditing(item); setModalOpen(true); }}
                              className="p-1.5 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 8 && (
                <div className="mt-4 flex justify-center">
                  <Pagination page={page} total={total} pageSize={8} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {modalOpen && (
        <InventoryFormModal
          item={editing}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function InventoryFormModal({ item, saving, onSave, onClose }: {
  item: InventoryItem | null;
  saving: boolean;
  onSave: (data: Partial<InventoryItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    category: item?.category ?? INVENTORY_CATEGORIES[0],
    sku: item?.sku ?? '',
    quantity: item?.quantity ?? 0,
    unit: item?.unit ?? UNITS[0],
    reorderLevel: item?.reorderLevel ?? 10,
    unitPrice: item?.unitPrice ?? 0,
    supplier: item?.supplier ?? '',
    location: item?.location ?? '',
    expiryDate: item?.expiryDate ?? '',
  });

  const update = (key: keyof typeof form, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) return;
    onSave({
      ...form,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      unitPrice: Number(form.unitPrice),
      expiryDate: form.expiryDate || undefined,
      supplier: form.supplier || undefined,
      location: form.location || undefined,
    });
  };

  return (
    <Modal open onClose={onClose} title={item ? 'Edit Item' : 'Add Inventory Item'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Item Name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          <Input label="SKU" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
          <Select label="Category" value={form.category} onChange={(e) => update('category', e.target.value)} options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Select label="Unit" value={form.unit} onChange={(e) => update('unit', e.target.value)} options={UNITS.map((u) => ({ value: u, label: u }))} />
          <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} required />
          <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={(e) => update('reorderLevel', e.target.value)} required />
          <Input label="Unit Price (Rs.)" type="number" value={form.unitPrice} onChange={(e) => update('unitPrice', e.target.value)} required />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} />
          <Input label="Supplier" value={form.supplier} onChange={(e) => update('supplier', e.target.value)} />
          <Input label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{item ? 'Save Changes' : 'Add Item'}</Button>
        </div>
      </form>
    </Modal>
  );
}
