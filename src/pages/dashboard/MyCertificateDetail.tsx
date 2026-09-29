import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { certificateApi } from '../../api/api';
import type { ApiCertificate } from '../../api/api';

const MyCertificateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cert, setCert] = useState<ApiCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) {
      navigate('/my-certificates');
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
      console.error('Certificate detail load error:', err);
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
    const dataUrl =
      cert.cleanImageDataUrl || cert.image_data_url || '';
    if (!dataUrl) return;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cert.certificate_number}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

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
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">
            {error || 'Certificate not found.'}
          </p>
          <Link to="/my-certificates">
            <Button>Back to Certificates</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const cleanSrc =
    cert.cleanImageDataUrl ||
    cert.image_data_url ||
    '';

  const watermarkedSrc =
    cert.watermarkedImageDataUrl ||
    cert.image_watermarked_data_url ||
    '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {cert.courseTitle}
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-0.5">
            {cert.certificate_number}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/my-certificates">
            <Button variant="secondary" size="small">
              Back
            </Button>
          </Link>
          {cert.canDownload && cleanSrc && (
            <Button size="small" onClick={handleDownload}>
              Download Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Enrolled notice */}
      {cert.canDownload && (
        <Card className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm">
          You are enrolled in this course. Your certificate is issued and
          ready to download.
        </Card>
      )}

      {/* Clean certificate — the real one */}
      {cleanSrc && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Your Certificate
            </h2>
            {cert.canDownload && (
              <button
                onClick={handleDownload}
                className="text-xs text-blue-600 hover:underline"
              >
                Download PNG
              </button>
            )}
          </div>
          <img
            src={cleanSrc}
            alt={`Certificate ${cert.certificate_number}`}
            className="w-full h-auto rounded shadow-sm"
          />
        </Card>
      )}

      {/* Watermarked preview — always shown so the user knows the
          difference, and can verify the design. */}
      {watermarkedSrc && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Watermarked Preview
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Preview
            </span>
          </div>
          <img
            src={watermarkedSrc}
            alt={`Watermarked preview`}
            className="w-full h-auto rounded shadow-sm"
          />
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Certificate Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Certificate Number</p>
            <p className="font-mono text-gray-900">
              {cert.certificate_number}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Verification ID</p>
            <p className="font-mono text-gray-900 break-all text-xs">
              {cert.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Issued</p>
            <p className="text-gray-900">
              {new Date(cert.issued_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Student</p>
            <p className="text-gray-900">{cert.studentName}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">Course</p>
            <p className="text-gray-900">{cert.courseTitle}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500">Verify online</p>
            <a
              href={`/certificates/verify/${cert.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-xs break-all font-mono"
            >
              /certificates/verify/{cert.id}
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MyCertificateDetail;