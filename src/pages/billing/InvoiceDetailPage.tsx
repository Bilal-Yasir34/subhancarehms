import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Printer, CreditCard, DollarSign,
  CheckCircle2, Clock, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, Button, Avatar, StatusBadge, Skeleton, EmptyState, Modal, Select, Badge } from '../../components/ui';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Invoice, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'online', label: 'Online Transfer' },
];

export function InvoiceDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getInvoice(id).then((inv) => { setInvoice(inv); setLoading(false); });
  }, [id]);

  const handlePrint = () => window.print();

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      await api.markInvoicePaid(invoice.id, payMethod);
      toast.success('Payment recorded successfully');
      setPayOpen(false);
      api.getInvoice(invoice.id).then(setInvoice);
    } catch {
      toast.error('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-96" /></div>;
  }

  if (!invoice) {
    return <Card><EmptyState title="Invoice not found" description="This invoice may have been removed." action={<Button onClick={() => navigate('/billing')}>Back to Billing</Button>} /></Card>;
  }

  if (user?.role === 'patient' && invoice.patientId !== user.patientId) {
    return <Card><EmptyState title="Access Denied" description="You do not have permission to view this invoice." action={<Button onClick={() => navigate('/billing')}>Back to Billing</Button>} /></Card>;
  }

  const balance = invoice.total - invoice.amountPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 no-print">
        <Link to="/billing" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrint}>Print</Button>
          {invoice.status !== 'paid' && user?.role !== 'patient' && (
            <Button size="sm" leftIcon={<CreditCard className="h-4 w-4" />} onClick={() => setPayOpen(true)}>Record Payment</Button>
          )}
        </div>
      </div>

      {/* Invoice document */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="print-area overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-8 text-white">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                  <img src="/logo.png" className="h-full w-full object-contain" alt="Subhan Care Logo" />
                </div>
                <div>
                  <p className="text-xl font-bold">Subhan Care Clinic</p>
                  <p className="text-xs text-white/70 mt-0.5">contact@subhancare.med · +92 300 100-2000</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tracking-tight">INVOICE</p>
                <p className="text-sm text-white/80 mt-1">{invoice.invoiceNumber}</p>
                <div className="mt-2">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            </div>
          </div>

          <CardBody className="p-8">
            {/* Bill To + Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Bill To</p>
                <div className="flex items-center gap-3">
                  <Avatar src={invoice.patientAvatar} name={invoice.patientName} size="md" />
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-ink-100">{invoice.patientName}</p>
                    <p className="text-sm text-ink-500">Patient ID: {invoice.patientId}</p>
                  </div>
                </div>
              </div>
              <div className="sm:text-right space-y-1.5">
                <div className="flex sm:justify-end items-center gap-2 text-sm"><span className="text-ink-400">Issued:</span><span className="font-medium text-ink-700 dark:text-ink-300">{formatDate(invoice.date)}</span></div>
                <div className="flex sm:justify-end items-center gap-2 text-sm"><span className="text-ink-400">Due:</span><span className="font-medium text-ink-700 dark:text-ink-300">{formatDate(invoice.dueDate)}</span></div>
                {invoice.paymentMethod && (
                  <div className="flex sm:justify-end items-center gap-2 text-sm"><span className="text-ink-400">Method:</span><span className="font-medium text-ink-700 dark:text-ink-300 capitalize">{invoice.paymentMethod}</span></div>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 dark:bg-ink-800/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-ink-600 dark:text-ink-300">Description</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-600 dark:text-ink-300 hidden sm:table-cell">Category</th>
                    <th className="text-center px-4 py-3 font-semibold text-ink-600 dark:text-ink-300">Qty</th>
                    <th className="text-right px-4 py-3 font-semibold text-ink-600 dark:text-ink-300">Unit Price</th>
                    <th className="text-right px-4 py-3 font-semibold text-ink-600 dark:text-ink-300">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800/60">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-ink-50/40 dark:hover:bg-ink-800/30">
                      <td className="px-4 py-3 font-medium text-ink-800 dark:text-ink-200">{item.description}</td>
                      <td className="px-4 py-3 text-ink-500 hidden sm:table-cell"><Badge variant="neutral" size="sm">{item.category}</Badge></td>
                      <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-ink-600 dark:text-ink-400">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink-800 dark:text-ink-200">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-ink-500">Subtotal</span><span className="font-medium text-ink-800 dark:text-ink-200">{formatCurrency(invoice.subtotal)}</span></div>
                {invoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-ink-500">Discount</span><span className="font-medium text-secondary-600">-{formatCurrency(invoice.discount)}</span></div>}
                <div className="border-t border-ink-200 dark:border-ink-800 pt-2.5 flex justify-between items-center">
                  <span className="font-semibold text-ink-900 dark:text-ink-100">Total</span>
                  <span className="text-xl font-bold text-ink-900 dark:text-ink-100">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-sm"><span className="text-secondary-600">Amount Paid</span><span className="font-medium text-secondary-600">{formatCurrency(invoice.amountPaid)}</span></div>
                {balance > 0 && (
                  <div className="flex justify-between text-sm bg-warning-50 dark:bg-warning-500/10 -mx-2 px-2 py-1.5 rounded"><span className="font-medium text-warning-700 dark:text-warning-400">Balance Due</span><span className="font-bold text-warning-700 dark:text-warning-400">{formatCurrency(balance)}</span></div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-8 pt-6 border-t border-ink-200 dark:border-ink-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">Notes</p>
                <p className="text-sm text-ink-500">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-ink-200 dark:border-ink-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Building2 className="h-4 w-4" /> Subhan Care Clinic · Tax ID: 47-1234567
              </div>
              {invoice.status === 'paid' ? (
                <div className="flex items-center gap-2 text-secondary-600"><CheckCircle2 className="h-5 w-5" /><span className="font-medium">PAID IN FULL</span></div>
              ) : (
                <div className="flex items-center gap-2 text-warning-600"><Clock className="h-5 w-5" /><span className="font-medium">PAYMENT DUE</span></div>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record Payment"
        description={`${invoice.invoiceNumber} · Balance: ${formatCurrency(balance)}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={handlePay} loading={paying} leftIcon={!paying && <DollarSign className="h-4 w-4" />}>Confirm Payment</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="card-base rounded-xl p-5 text-center">
            <p className="text-xs text-ink-400">Amount Due</p>
            <p className="text-3xl font-bold text-ink-900 dark:text-ink-100 mt-1">{formatCurrency(balance)}</p>
          </div>
          <Select label="Payment Method" value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} options={paymentMethods} />
        </div>
      </Modal>
    </div>
  );
}
