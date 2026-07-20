import { useState, useEffect } from 'react';
import { Pill, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Textarea, Select } from '../../components/ui';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Patient, InventoryItem } from '../../types';

interface SuggestMedicineModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: Patient;
}

export function SuggestMedicineModal({ open, onClose, onSuccess, patient }: SuggestMedicineModalProps) {
  const { user } = useAuth();
  const [pharmacyItems, setPharmacyItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [selectedMedId, setSelectedMedId] = useState('');
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingItems(true);
      api.getPharmacyItems({ pageSize: 500 })
        .then((res) => {
          setPharmacyItems(res.items);
          if (res.items.length > 0) {
            setSelectedMedId(res.items[0].id);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load pharmacy medications');
        })
        .finally(() => setLoadingItems(false));
    }
  }, [open]);

  const selectedMed = pharmacyItems.find((m) => m.id === selectedMedId);

  const handleSubmit = async () => {
    if (!selectedMed) {
      toast.error('Please select a medicine from the pharmacy inventory');
      return;
    }
    if (!dosage.trim()) {
      toast.error('Please specify the dosage / frequency');
      return;
    }

    const doctorName = user?.name ? `Dr. ${user.name.replace(/^Dr\.\s*/i, '')}` : 'Attending Doctor';

    setSubmitting(true);
    try {
      await api.createPrescription({
        patientId: patient.id,
        doctorId: user?.doctorId ?? user?.id,
        doctorName: doctorName,
        medicationId: selectedMed.id,
        medicationName: selectedMed.name,
        dosage: dosage.trim(),
        duration: duration.trim() || undefined,
        instructions: instructions.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(`Prescription for ${selectedMed.name} sent to ${patient.firstName}`);
      // Reset form
      setDosage('');
      setDuration('');
      setInstructions('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Suggest Medicine for ${patient.firstName} ${patient.lastName}`} size="lg">
      <div className="space-y-4">
        {/* Pharmacy Medicine Selection */}
        <div>
          <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1.5 flex items-center justify-between">
            <span>Select Medicine from Pharmacy <span className="text-danger-500">*</span></span>
            {selectedMed && (
              <span className={`text-[11px] font-medium ${selectedMed.quantity <= selectedMed.reorderLevel ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                Stock: {selectedMed.quantity} {selectedMed.unit} available
              </span>
            )}
          </label>
          {loadingItems ? (
            <div className="h-10 bg-ink-100 dark:bg-ink-800 rounded-lg animate-pulse" />
          ) : pharmacyItems.length === 0 ? (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>No medications available in the pharmacy inventory. Please contact pharmacy staff.</span>
            </div>
          ) : (
            <Select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              disabled={submitting}
              options={pharmacyItems.map((med) => ({
                value: med.id,
                label: `${med.name} (${med.unit}) — In Stock: ${med.quantity}`,
              }))}
            />
          )}
        </div>

        {/* Selected medicine preview details */}
        {selectedMed && (
          <div className="p-3 rounded-xl bg-primary-50/60 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-xs text-ink-700 dark:text-ink-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-primary-600 dark:text-primary-400 shrink-0" />
              <span><strong className="font-semibold text-ink-900 dark:text-white">{selectedMed.name}</strong> • Category: {selectedMed.category} {selectedMed.supplier ? `• ${selectedMed.supplier}` : ''}</span>
            </div>
            <span className="font-mono text-[11px] bg-white dark:bg-ink-800 px-2 py-0.5 rounded border border-ink-200 dark:border-ink-700">{selectedMed.sku}</span>
          </div>
        )}

        {/* Dosage & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Dosage & Frequency *"
            placeholder="e.g. 1 tablet twice daily after meals"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            required
          />
          <Input
            label="Duration"
            placeholder="e.g. 5 days / 2 weeks"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        {/* Special Instructions */}
        <Input
          label="Special Instructions"
          placeholder="e.g. Take with warm water, finish full course"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        {/* Important Notes / Necessary Info */}
        <Textarea
          label="Important Notes & Necessary Info"
          placeholder="Enter precautions, dietary warnings, or important patient notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100 dark:border-ink-800">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={pharmacyItems.length === 0}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            Suggest Prescription
          </Button>
        </div>
      </div>
    </Modal>
  );
}
