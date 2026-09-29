import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { certificateApi } from '../../api/api';
import type { ApiCertificate } from '../../api/api';

// ============================================================
// Helpers
// ============================================================
const formatDate = (d: string | null): string =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

/**
 * Pick the image the candidate should see first:
 *  - If the backend already decided a display image, use it.
 *  - Otherwise, fall back to the clean or watermarked version.
 */
const pickDisplayImage = (cert: ApiCertificate): string | null =>
  cert.displayImageDataUrl ||
  cert.watermarkedImageDataUrl ||
  cert.image_watermarked_data_url ||
  cert.cleanImageDataUrl ||
  cert.image_data_url ||
  null;

/**
 * A certificate is considered published when either the frontend
 * camelCase flag or the raw backend snake_case flag is truthy.
 * Defaults to `true` only when the field is entirely missing, so
 * older API responses keep working.
 */
const isCertPublished = (cert: ApiCertificate): boolean => {
  if (typeof cert.isPublished === 'boolean') return cert.isPublished;
  if (typeof cert.is_published === 'boolean') return cert.is_published;
  return true;
};

// ============================================================
// Component
// ============================================================
const MyCertificates: React.FC = () => {
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await certificateApi.mine();
      if (res.success && Array.isArray(res.data)) {
        // Show only certificates the admin has published.
        const published = (res.data as ApiCertificate[]).filter(
          isCertPublished
        );
        setCerts(published);
      } else {
        setCerts([]);
        setError(res.message || 'Could not load certificates.');
      }
    } catch (err) {
      console.error('MyCertificates load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = (cert: ApiCertificate) => {
    const url = cert.cleanImageDataUrl || cert.image_data_url;
    if (!cert.canDownload || !url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certificate_number}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          My Certificates
        </h1>
        <p className="text-gray-600">
          One certificate for every course you are enrolled in.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-gray-200 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24 mb-4" />
              <div className="h-40 bg-gray-100 rounded" />
            </Card>
          ))}
        </div>
      ) : certs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-1">
            You have no certificates yet.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Certificates appear automatically once you enroll in a
            course.
          </p>
          <Link to="/my-courses">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((cert) => {
            const displaySrc = pickDisplayImage(cert);

            return (
              <Card key={cert.id} className="p-6 border-l-4 border-black">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>

                  {cert.watermarked ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      Preview
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Issued
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {cert.courseTitle}
                </h3>
                <p className="text-xs text-gray-500 mb-1 font-mono">
                  {cert.certificate_number}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Issued: {formatDate(cert.issued_at)}
                </p>

                {/* ---------- Certificate thumbnail ---------- */}
                {displaySrc ? (
                  <Link
                    to={`/my-certificates/${cert.id}`}
                    className="block mb-4 group"
                  >
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={displaySrc}
                        alt={`Certificate ${cert.certificate_number}`}
                        className="w-full h-auto block group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />

                      {/* Watermark ribbon for preview certificates */}
                      {cert.watermarked && (
                        <div className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full shadow">
                          Preview
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full shadow">
                          Click to open
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="mb-4 h-40 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">
                      Certificate image not available
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Link to={`/my-certificates/${cert.id}`}>
                    <Button variant="outline" size="small">
                      View
                    </Button>
                  </Link>
                  {cert.canDownload && (
                    <Button
                      size="small"
                      onClick={() => handleDownload(cert)}
                    >
                      Download PNG
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;