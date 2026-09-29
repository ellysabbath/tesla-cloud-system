import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { paymentApi } from '../../api/api';
import type { ApiPayment } from '../../api/api';

// ============================================================
// Types
// ============================================================
type StatusFilter = 'all' | ApiPayment['status'];
type MethodFilter = 'all' | ApiPayment['method'];

// ============================================================
// Icons
// ============================================================
const WalletIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const BankIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M3 10v11m18-11v11" />
  </svg>
);

// ============================================================
// Confirm modal state
// ============================================================
interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => Promise<void> | void;
}

// ============================================================
// Component
// ============================================================
const Payments: React.FC = () => {
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [search, setSearch] = useState('');
  const [flash, setFlash] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail modal
  const [reviewing, setReviewing] = useState<ApiPayment | null>(null);
  const [isActing, setIsActing] = useState(false);

  // Confirm modal
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await paymentApi.adminList();
      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data as ApiPayment[]);
      } else {
        setPayments([]);
        setError(res.message || 'Could not load payments.');
      }
    } catch (err) {
      console.error('Payments load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  };

  // ============================================================
  // Helpers
  // ============================================================
  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  const formatDateTime = (d: string | null | undefined) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const statusPill: Record<
    ApiPayment['status'],
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    paid: {
      label: 'Paid',
      cls: 'bg-green-100 text-green-700',
      icon: <CheckCircleIcon className="w-3 h-3" />,
    },
    pending: {
      label: 'Pending',
      cls: 'bg-yellow-100 text-yellow-700',
      icon: <ClockIcon className="w-3 h-3" />,
    },
    failed: {
      label: 'Failed',
      cls: 'bg-red-100 text-red-700',
      icon: <XCircleIcon className="w-3 h-3" />,
    },
    refunded: {
      label: 'Refunded',
      cls: 'bg-gray-200 text-gray-700',
      icon: <RefreshIcon className="w-3 h-3" />,
    },
  };

  const methodIcon = (method: string): React.ReactNode => {
    if (method === 'Bank') return <BankIcon className="w-3.5 h-3.5 text-gray-600" />;
    if (method === 'M-Pesa') return <PhoneIcon className="w-3.5 h-3.5 text-green-600" />;
    if (method === 'Tigo Pesa') return <PhoneIcon className="w-3.5 h-3.5 text-blue-600" />;
    if (method === 'Airtel Money') return <PhoneIcon className="w-3.5 h-3.5 text-red-600" />;
    return null;
  };

  // ============================================================
  // Filter
  // ============================================================
  const filtered = useMemo(() => {
    let list = [...payments];

    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (methodFilter !== 'all') list = list.filter((p) => p.method === methodFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        `${p.studentName} ${p.studentUsername} ${p.courseTitle} ${p.reference}`
          .toLowerCase()
          .includes(q)
      );
    }

    list.sort((a, b) => {
      const at = a.submittedAt || '';
      const bt = b.submittedAt || '';
      return bt.localeCompare(at);
    });

    return list;
  }, [payments, statusFilter, methodFilter, search]);

  // ============================================================
  // Stats
  // ============================================================
  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'paid');
    const pending = payments.filter((p) => p.status === 'pending');
    const failed = payments.filter((p) => p.status === 'failed');
    const refunded = payments.filter((p) => p.status === 'refunded');

    const totalRevenue = paid.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      total: payments.length,
      totalRevenue,
      paidCount: paid.length,
      pendingCount: pending.length,
      pendingValue: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      failedCount: failed.length,
      refundedCount: refunded.length,
    };
  }, [payments]);

  const counts = {
    all: payments.length,
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    refunded: payments.filter((p) => p.status === 'refunded').length,
  };

  // ============================================================
  // Actions
  // ============================================================
  const doMarkPaid = async (payment: ApiPayment) => {
    setIsActing(true);
    try {
      const res = await paymentApi.markPaid(payment.id);
      if (res.success) {
        showFlash(res.message || `Payment ${payment.reference} confirmed.`);
        await load();
        if (reviewing?.id === payment.id) setReviewing(null);
      } else {
        showFlash(res.message || 'Could not confirm payment.');
      }
    } catch (err) {
      console.error('Mark paid error:', err);
      showFlash('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doMarkFailed = async (payment: ApiPayment) => {
    setIsActing(true);
    try {
      const res = await paymentApi.markFailed(payment.id);
      if (res.success) {
        showFlash(res.message || `Payment ${payment.reference} marked failed.`);
        await load();
        if (reviewing?.id === payment.id) setReviewing(null);
      } else {
        showFlash(res.message || 'Could not mark failed.');
      }
    } catch (err) {
      console.error('Mark failed error:', err);
      showFlash('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doRefund = async (payment: ApiPayment) => {
    setIsActing(true);
    try {
      const res = await paymentApi.refund(payment.id);
      if (res.success) {
        showFlash(res.message || `Payment ${payment.reference} refunded.`);
        await load();
        if (reviewing?.id === payment.id) setReviewing(null);
      } else {
        showFlash(res.message || 'Could not refund.');
      }
    } catch (err) {
      console.error('Refund error:', err);
      showFlash('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  const doDelete = async (payment: ApiPayment) => {
    setIsActing(true);
    try {
      const res = await paymentApi.remove(payment.id);
      if (res.success) {
        showFlash('Payment deleted.');
        await load();
        if (reviewing?.id === payment.id) setReviewing(null);
      } else {
        showFlash(res.message || 'Could not delete.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showFlash('Could not reach the server.');
    } finally {
      setIsActing(false);
    }
  };

  // ---------- Ask helpers ----------
  const askMarkPaid = (payment: ApiPayment) => {
    setConfirmState({
      title: 'Confirm payment',
      message: `Mark payment ${payment.reference} as paid? This will enroll ${payment.studentName} in "${payment.courseTitle}".`,
      confirmLabel: 'Confirm & Enroll',
      confirmClass: 'bg-green-600 hover:bg-green-700',
      onConfirm: () => doMarkPaid(payment),
    });
  };

  const askMarkFailed = (payment: ApiPayment) => {
    setConfirmState({
      title: 'Mark as failed',
      message: `Mark payment ${payment.reference} as failed? ${payment.studentName} will need to submit again.`,
      confirmLabel: 'Mark Failed',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => doMarkFailed(payment),
    });
  };

  const askRefund = (payment: ApiPayment) => {
    setConfirmState({
      title: 'Refund payment',
      message: `Refund payment ${payment.reference}? The user's enrollment will be marked as dropped.`,
      confirmLabel: 'Refund',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      onConfirm: () => doRefund(payment),
    });
  };

  const askDelete = (payment: ApiPayment) => {
    setConfirmState({
      title: 'Delete payment',
      message: `Permanently delete payment ${payment.reference}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => doDelete(payment),
    });
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    setIsConfirming(true);
    try {
      await confirmState.onConfirm();
    } finally {
      setIsConfirming(false);
      setConfirmState(null);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {flash && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4" />
          {flash}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payments</h1>
          <p className="text-gray-600">
            Track enrollment payments and confirm transactions.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <WalletIcon className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500">Total Collected</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(stats.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.paidCount} paid transaction{stats.paidCount !== 1 ? 's' : ''}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <ClockIcon className="w-4 h-4 text-yellow-500" />
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {formatPrice(stats.pendingValue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.pendingCount} awaiting confirmation
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <XCircleIcon className="w-4 h-4 text-red-500" />
            <p className="text-sm text-gray-500">Failed</p>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {stats.failedCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">Failed transactions</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <RefreshIcon className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-500">Refunded</p>
          </div>
          <p className="text-2xl font-bold text-gray-700">
            {stats.refundedCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">Refunded transactions</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'all' as const, label: 'All' },
                { key: 'paid' as const, label: 'Paid' },
                { key: 'pending' as const, label: 'Pending' },
                { key: 'failed' as const, label: 'Failed' },
                { key: 'refunded' as const, label: 'Refunded' },
              ]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    statusFilter === f.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }
                `}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${
                    statusFilter === f.key ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-2 lg:ml-auto lg:max-w-xl">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as MethodFilter)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">All methods</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Tigo Pesa">Tigo Pesa</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="Bank">Bank</option>
            </select>

            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, course, or reference..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Table */}
      {isLoading ? (
        <Card className="p-12 text-center text-gray-400">
          Loading payments...
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-1">
            {payments.length === 0
              ? 'No payments recorded yet.'
              : 'No payments match your filters.'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {payments.length === 0
              ? 'Payments will appear here as students enroll in courses.'
              : 'Try a different filter or search term.'}
          </p>
          {payments.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setMethodFilter('all');
                setSearch('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Course</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-left px-4 py-3">Submitted</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const pill = statusPill[p.status];
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                            {p.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {p.studentName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {p.studentUsername}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700 truncate max-w-[220px]">
                        {p.courseTitle}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatPrice(p.amount)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          {methodIcon(p.method)}
                          {p.method}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {p.reference || '—'}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {formatDateTime(p.submittedAt)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${pill.cls}`}
                        >
                          {pill.icon}
                          {pill.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setReviewing(p)}
                          className="text-xs font-medium text-black hover:underline mr-3"
                        >
                          View
                        </button>
                        {p.status === 'pending' && (
                          <button
                            onClick={() => askMarkPaid(p)}
                            disabled={isActing}
                            className="text-xs font-medium text-green-600 hover:underline mr-3 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        {p.status === 'paid' && (
                          <button
                            onClick={() => askRefund(p)}
                            disabled={isActing}
                            className="text-xs font-medium text-orange-600 hover:underline mr-3 disabled:opacity-50"
                          >
                            Refund
                          </button>
                        )}
                        {(p.status === 'failed' ||
                          p.status === 'refunded') && (
                          <button
                            onClick={() => askDelete(p)}
                            disabled={isActing}
                            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              Showing <strong>{filtered.length}</strong> of{' '}
              <strong>{payments.length}</strong> payment
              {payments.length !== 1 ? 's' : ''}
            </span>
            <span>
              Filtered total:{' '}
              <strong className="text-gray-700">
                {formatPrice(
                  filtered
                    .filter((p) => p.status === 'paid')
                    .reduce((sum, p) => sum + Number(p.amount), 0)
                )}
              </strong>
            </span>
          </div>
        </Card>
      )}

      {/* ============================================================
          DETAIL MODAL
      ============================================================ */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-lg w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Payment Details
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  {reviewing.reference || '(no reference)'}
                </p>
              </div>
              <button
                onClick={() => setReviewing(null)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              className={`px-5 py-6 text-center text-white ${
                reviewing.status === 'paid'
                  ? 'bg-green-600'
                  : reviewing.status === 'pending'
                  ? 'bg-yellow-600'
                  : reviewing.status === 'failed'
                  ? 'bg-red-600'
                  : 'bg-gray-600'
              }`}
            >
              <p className="text-3xl font-bold">
                {formatPrice(reviewing.amount)}
              </p>
              <p className="text-xs uppercase tracking-widest mt-1 opacity-90">
                {reviewing.status}
              </p>
            </div>

            <div className="p-5 space-y-3">
              {[
                { label: 'Student', value: reviewing.studentName },
                { label: 'Username', value: reviewing.studentUsername },
                { label: 'Course', value: reviewing.courseTitle },
                { label: 'Amount', value: formatPrice(reviewing.amount) },
                { label: 'Method', value: reviewing.method },
                { label: 'Phone', value: reviewing.phone_paid_from || '—' },
                { label: 'Reference', value: reviewing.reference || '—' },
                { label: 'Submitted', value: formatDateTime(reviewing.submittedAt) },
                { label: 'Paid At', value: formatDateTime(reviewing.paid_at) },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                >
                  <span className="text-xs text-gray-500">{r.label}</span>
                  <span className="text-sm font-medium text-gray-900 text-right break-words">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-t border-gray-200">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setReviewing(null)}
              >
                Close
              </Button>
              {reviewing.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    fullWidth
                    size="small"
                    onClick={() => askMarkFailed(reviewing)}
                    disabled={isActing}
                  >
                    Mark Failed
                  </Button>
                  <Button
                    fullWidth
                    size="small"
                    onClick={() => askMarkPaid(reviewing)}
                    disabled={isActing}
                  >
                    Confirm & Enroll
                  </Button>
                </>
              )}
              {reviewing.status === 'paid' && (
                <Button
                  variant="outline"
                  fullWidth
                  size="small"
                  onClick={() => askRefund(reviewing)}
                  disabled={isActing}
                >
                  Refund
                </Button>
              )}
              {(reviewing.status === 'failed' ||
                reviewing.status === 'refunded') && (
                <Button
                  variant="danger"
                  fullWidth
                  size="small"
                  onClick={() => askDelete(reviewing)}
                  disabled={isActing}
                >
                  Delete
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================
          CONFIRM MODAL
      ============================================================ */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmState.title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{confirmState.message}</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setConfirmState(null)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className={`flex-1 px-4 py-2 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 ${confirmState.confirmClass}`}
              >
                {isConfirming ? 'Working...' : confirmState.confirmLabel}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Payments;