import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { paymentApi } from '../../api/api';
import type { ApiCourse } from '../../api/api';

// ============================================================
// Static Lipa Namba per payment method (demo values)
// ============================================================
const LIPA_NUMBAS: Record<'M-Pesa' | 'Tigo Pesa' | 'Airtel Money', string> = {
  'M-Pesa': '5100123',
  'Tigo Pesa': '4001234',
  'Airtel Money': '6002345',
};

type Method = 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money' | 'Bank';
const METHODS: Method[] = ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank'];

// ============================================================
// Icons
// ============================================================
const CloseIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const BankIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M3 10v11m18-11v11"
    />
  </svg>
);

// ============================================================
// Component
// ============================================================
interface PaymentModalProps {
  course: ApiCourse;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  course,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<Method>('M-Pesa');
  const [step, setStep] = useState<'method' | 'confirm' | 'done'>('method');

  const [phone, setPhone] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  const isMobileMoney = method !== 'Bank';

  const getLipaNamba = (): string => {
    if (method === 'Bank') return 'BANK-ACC-001';
    return LIPA_NUMBAS[method as keyof typeof LIPA_NUMBAS];
  };

  // ---------- Continue from method step ----------
  const handleContinue = () => {
    setError('');
    if (isMobileMoney && !phone.trim()) {
      setError('Please enter the phone number you paid from.');
      return;
    }
    if (!reference.trim()) {
      setError(
        method === 'Bank'
          ? 'Please enter the bank transaction reference.'
          : 'Please enter the payment reference number from your receipt.'
      );
      return;
    }
    setStep('confirm');
  };

  // ---------- Submit to backend ----------
  const handleSubmitPayment = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const res = await paymentApi.submit({
        courseId: course.id,
        method,
        reference: reference.trim().toUpperCase(),
        phonePaidFrom: isMobileMoney ? phone.trim() : undefined,
      });

      if (res.success) {
        setStep('done');
      } else {
        setError(res.message || 'Could not submit payment.');
        setStep('method');
      }
    } catch (err) {
      console.error('Submit payment error:', err);
      setError('Could not reach the server.');
      setStep('method');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-md w-full my-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {step === 'done' ? 'Payment Submitted' : 'Submit Payment Details'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {course.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ---------- STEP: method ---------- */}
        {step === 'method' && (
          <div className="p-5 space-y-5">
            <div className="text-center bg-gray-50 rounded-lg py-4">
              <p className="text-xs text-gray-500 mb-1">Amount to pay</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(course.price)}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Choose payment method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      method === m
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                {method === 'Bank' ? (
                  <BankIcon className="w-4 h-4 text-blue-700" />
                ) : (
                  <PhoneIcon className="w-4 h-4 text-blue-700" />
                )}
                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  {method === 'Bank' ? 'Bank Account' : 'Lipa Namba'}
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900 font-mono">
                {getLipaNamba()}
              </p>
              <p className="text-[11px] text-blue-800 mt-1">
                {method === 'Bank'
                  ? 'Transfer the course fee to this account, then enter the reference below.'
                  : `Send ${formatPrice(course.price)} to this Lipa Namba via ${method}, then enter the details below.`}
              </p>
            </div>

            {isMobileMoney && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number You Paid From
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {method === 'Bank'
                  ? 'Bank Reference Number'
                  : 'Payment Reference Number'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. MPX1234567"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-mono uppercase"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Enter the reference number shown in your{' '}
                {method === 'Bank'
                  ? 'bank slip'
                  : method + ' confirmation SMS'}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button fullWidth size="small" onClick={handleContinue}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ---------- STEP: confirm ---------- */}
        {step === 'confirm' && (
          <div className="p-5 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mb-3">
                <ClockIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Confirm your payment details
              </p>
              <p className="text-xs text-gray-500">
                The admin will review and approve this submission.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
              {[
                { label: 'Course', value: course.title },
                { label: 'Amount', value: formatPrice(course.price) },
                { label: 'Method', value: method },
                {
                  label: method === 'Bank' ? 'Account' : 'Lipa Namba',
                  value: getLipaNamba(),
                },
                ...(isMobileMoney ? [{ label: 'Phone', value: phone }] : []),
                { label: 'Reference', value: reference.toUpperCase() },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-gray-900 text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
                {error}
              </div>
            )}

            <p className="text-[11px] text-gray-500 text-center">
              Your submission will be sent to the admin. You will be enrolled
              once it is approved.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setStep('method')}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={handleSubmitPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </div>
          </div>
        )}

        {/* ---------- STEP: done ---------- */}
        {step === 'done' && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mb-4">
              <ClockIcon className="w-7 h-7" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-1">
              Payment submitted
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Your payment details have been sent for admin review.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Reference</span>
                <span className="text-xs font-mono font-bold text-gray-900">
                  {reference.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Amount</span>
                <span className="text-xs font-bold text-gray-900">
                  {formatPrice(course.price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className="text-xs font-bold text-yellow-700 uppercase">
                  Pending Approval
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 mb-5">
              You will see this course as Enrolled once the admin approves
              your payment.
            </p>

            <Button fullWidth onClick={onSuccess}>
              Got it
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentModal;