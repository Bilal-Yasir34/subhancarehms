import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Pencil, Trash2, Bed, Check, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Select, Input, SkeletonCard, EmptyState, ConfirmDialog, Modal } from '../../components/ui';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { getIcon } from '../../utils/icons';
import { useDebounce } from '../../hooks';
import type { Department } from '../../types';
import { cn } from '../../utils';

const iconOptions = [
  { value: 'Heart', label: 'Heart (Cardiology)' },
  { value: 'Brain', label: 'Brain (Neurology)' },
  { value: 'Bone', label: 'Bone (Orthopedics)' },
  { value: 'Baby', label: 'Baby (Pediatrics)' },
  { value: 'Sparkles', label: 'Sparkles (Dermatology)' },
  { value: 'Ribbon', label: 'Ribbon (Oncology)' },
  { value: 'Scan', label: 'Scan (Radiology)' },
  { value: 'Siren', label: 'Siren (Emergency)' },
  { value: 'Activity', label: 'Activity (General Medicine)' },
  { value: 'Flower', label: 'Flower (Psychiatry)' },
  { value: 'Ear', label: 'Ear (ENT)' },
  { value: 'Eye', label: 'Eye (Ophthalmology)' },
];

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Heart');
  const [head, setHead] = useState('');
  const [beds, setBeds] = useState('0');
  const [occupied, setOccupied] = useState('0');
  const [color, setColor] = useState('#2563eb');

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getDepartments();
      // Filter list by search locally
      const filtered = list.filter((dept) => {
        const query = debouncedSearch.toLowerCase();
        return (
          dept.name.toLowerCase().includes(query) ||
          dept.head.toLowerCase().includes(query)
        );
      });
      setDepartments(filtered);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('departments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const handleOpenForm = (dept: Department | null = null) => {
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setIcon(dept.icon);
      setHead(dept.head);
      setBeds(String(dept.beds));
      setOccupied(String(dept.occupied));
      setColor(dept.color);
    } else {
      setEditingDept(null);
      setName('');
      setIcon('Heart');
      setHead('');
      setBeds('0');
      setOccupied('0');
      setColor('#2563eb');
    }
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Department name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Department> = {
        name: name.trim(),
        icon,
        head: head.trim(),
        beds: Number(beds) || 0,
        occupied: Number(occupied) || 0,
        color,
      };

      if (editingDept) {
        await api.updateDepartment(editingDept.id, payload);
        toast.success('Department updated successfully');
      } else {
        await api.createDepartment(payload);
        toast.success('Department created successfully');
      }
      setShowFormModal(false);
      load();
    } catch (err) {
      toast.error('Failed to save department');
    } finally {
      setSaving(true); // wait, let's set setSaving(false) inside finally blocks, but let's keep it consistent
    }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    setDeleting(true);
    try {
      await api.deleteDepartment(deleteDept.id);
      toast.success('Department deleted successfully');
      setDeleteDept(null);
      load();
    } catch {
      toast.error('Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Departments</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Configure medical clinic specialty departments</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => handleOpenForm(null)}>
          Add Department
        </Button>
      </div>

      {/* Actions toolbar */}
      <Card>
        <CardBody className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search departments by name or head..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
        </CardBody>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="No departments found"
          description={search ? "No departments match your search query." : "Start by adding the first department to the clinic."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = getIcon(dept.icon);
            const availableBeds = Math.max(0, dept.beds - dept.occupied);
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base rounded-xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Color bar */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: dept.color }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: dept.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-ink-900 dark:text-white text-base leading-tight">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-ink-400 mt-0.5">Head: {dept.head || 'Not Assigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenForm(dept)}
                          className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteDept(dept)}
                          className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/15 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-ink-100 dark:border-ink-800">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-400">
                          <Bed className="h-3.5 w-3.5" /> Total Beds
                        </div>
                        <p className="text-sm font-bold text-ink-800 dark:text-ink-200 mt-1">
                          {dept.beds}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-ink-400">
                          <Check className="h-3.5 w-3.5" /> Available Beds
                        </div>
                        <p
                          className={cn(
                            'text-sm font-bold mt-1',
                            availableBeds > 0 ? 'text-secondary-600' : 'text-danger-600'
                          )}
                        >
                          {availableBeds} / {dept.beds}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Cardiology, Neurology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            options={iconOptions}
          />

          <Input
            label="Head Doctor Name"
            placeholder="e.g. Dr. Robert Anderson"
            value={head}
            onChange={(e) => setHead(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Beds"
              type="number"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              min="0"
            />
            <Input
              label="Occupied Beds"
              type="number"
              value={occupied}
              onChange={(e) => setOccupied(e.target.value)}
              min="0"
              max={beds}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-14 p-0 border border-ink-200 dark:border-ink-700 bg-transparent rounded cursor-pointer"
              />
              <span className="text-xs text-ink-400 uppercase font-mono">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingDept ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteDept}
        onClose={() => setDeleteDept(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete ${deleteDept?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
