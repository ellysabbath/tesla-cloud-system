import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { certificateApi } from '../../api/api';
import type { ApiCertificate } from '../../api/api';

// ============================================================
// Helpers
// ============================================================
const formatDateTime = (d: string | null): string =>
  d
    ? new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

// ============================================================
// Component
// ============================================================
const AdminCertificateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cert, setCert] = useState<ApiCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      navigate('/admin/certificates');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await certificateApi.get(id);
      if (res.success && res.data) {
        setCert(res.data as ApiCertificate);
      } else {
        setError(res.message || 'Could not load certificate.');
      }
    } catch (err) {
      console.error('AdminCertificateDetail load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = () => {
    if (!cert) return;
    const dataUrl = cert.image_data_url;
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cert.certificate_number}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyId = async () => {
    if (!cert) return;
    try {
      await navigator.clipboard.writeText(cert.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  // ============================================================
  // Loading / errors
  // ============================================================
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="p-12 text-center text-gray-400">
          Loading certificate...
        </Card>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">
            {error || 'Certificate not found.'}
          </p>
          <Link to="/admin/certificates">
            <Button>Back to Certificates</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const displaySrc =
    cert.image_data_url || cert.image_watermarked_data_url || '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <Link
            to="/admin/certificates"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mb-1"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Certificates
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {cert.studentName}
          </h1>
          <p className="text-sm text-gray-500 font-mono">
            {cert.certificate_number}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            onClick={handleDownload}
            disabled={!cert.image_data_url}
          >
            Download PNG
          </Button>
        </div>
      </div>

      {/* ---------- Certificate image ---------- */}
      <Card className="p-4 bg-gray-100">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={`Certificate ${cert.certificate_number}`}
            className="w-full h-auto rounded shadow-sm"
          />
        ) : (
          <div className="p-12 text-center text-gray-400">
            Certificate image not available.
          </div>
        )}
      </Card>

      {/* ---------- Metadata ---------- */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Certificate Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Student</p>
            <p className="text-gray-900">{cert.studentName}</p>
            <p className="text-xs text-gray-500">
              {cert.studentUsername}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Course</p>
            <p className="text-gray-900">{cert.courseTitle}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Issued</p>
            <p className="text-gray-900">
              {formatDateTime(cert.issued_at)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-gray-900 capitalize">{cert.status}</p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">
              Verification ID (UUID)
            </p>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-xs font-mono break-all text-gray-800 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                {cert.id}
              </code>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-xs text-gray-600 hover:text-black underline shrink-0"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminCertificateDetail;