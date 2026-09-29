import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { certificateApi } from '../../api/api';
import type { ApiCertificate } from '../../api/api';

// ============================================================
// Types
// ============================================================
type StatusFilter = 'all' | 'issued' | 'pending' | 'revoked';
type PublishedFilter = 'all' | 'published' | 'hidden';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'issued', label: 'Issued' },
  { key: 'pending', label: 'Pending' },
  { key: 'revoked', label: 'Revoked' },
];

const PUBLISHED_FILTERS: { key: PublishedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'hidden', label: 'Hidden' },
];

const statusColors: Record<string, string> = {
  issued: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  revoked: 'bg-red-100 text-red-700',
};

const formatDate = (d: string | null): string =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

const pickThumb = (cert: ApiCertificate): string | null =>
  cert.image_data_url || cert.image_watermarked_data_url || null;

const isCertPublished = (cert: ApiCertificate): boolean =>
  typeof cert.isPublished === 'boolean'
    ? cert.isPublished
    : Boolean(cert.is_published);

// ============================================================
// Component
// ============================================================
const AdminCertificates: React.FC = () => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [publishedFilter, setPublishedFilter] =
    useState<PublishedFilter>('all');
  const [search, setSearch] = useState('');
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await certificateApi.adminList({
        search: search.trim() || undefined,
        status: filter === 'all' ? undefined : filter,
        published:
          publishedFilter === 'all'
            ? undefined
            : publishedFilter === 'published'
            ? 'true'
            : 'false',
      });
      if (res.success && Array.isArray(res.data)) {
        setCerts(res.data as ApiCertificate[]);
      } else {
        setCerts([]);
        setError(res.message || 'Could not load certificates.');
      }
    } catch (err) {
      console.error('AdminCertificates load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [search, filter, publishedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...certs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        `${c.studentName} ${c.studentUsername} ${c.courseTitle} ${c.certificate_number} ${c.id}`
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [certs, search]);

  const counts = useMemo(
    () => ({
      all: certs.length,
      issued: certs.filter((c) => c.status === 'issued').length,
      pending: certs.filter((c) => c.status === 'pending').length,
      revoked: certs.filter((c) => c.status === 'revoked').length,
      published: certs.filter((c) => isCertPublished(c)).length,
      hidden: certs.filter((c) => !isCertPublished(c)).length,
    }),
    [certs]
  );

  const handleDownload = (cert: ApiCertificate) => {
    const dataUrl = cert.image_data_url;
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cert.certificate_number}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyId = async (cert: ApiCertificate) => {
    try {
      await navigator.clipboard.writeText(cert.id);
      setCopiedId(cert.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const handleTogglePublish = async (cert: ApiCertificate) => {
    const next = !isCertPublished(cert);
    setBusyId(cert.id);
    // Optimistic update
    setCerts((prev) =>
      prev.map((c) =>
        c.id === cert.id
          ? { ...c, is_published: next, isPublished: next, canDownload: next }
          : c
      )
    );
    try {
      const res = await certificateApi.adminSetPublished(cert.id, next);
      if (!res.success || !res.data) {
        // Revert on failure
        setCerts((prev) =>
          prev.map((c) =>
            c.id === cert.id
              ? {
                  ...c,
                  is_published: !next,
                  isPublished: !next,
                  canDownload: !next,
                }
              : c
          )
        );
        setError(res.message || 'Could not update certificate.');
      }
    } catch (err) {
      console.error('Toggle publish error:', err);
      setCerts((prev) =>
        prev.map((c) =>
          c.id === cert.id
            ? {
                ...c,
                is_published: !next,
                isPublished: !next,
                canDownload: !next,
              }
            : c
        )
      );
      setError('Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Certificates
        </h1>
        <p className="text-gray-600">
          Every certificate issued automatically on course enrollment. Hide
          or publish to control public verification.
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    filter === f.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }
                `}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${
                    filter === f.key
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 md:max-w-sm md:ml-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, course, serial, or UUID..."
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Published / Hidden filter row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1">
            Visibility
          </span>
          {PUBLISHED_FILTERS.map((f) => {
            const count =
              f.key === 'all'
                ? counts.all
                : f.key === 'published'
                ? counts.published
                : counts.hidden;
            return (
              <button
                key={f.key}
                onClick={() => setPublishedFilter(f.key)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${
                    publishedFilter === f.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }
                `}
              >
                {f.label}
                <span
                  className={`ml-2 ${
                    publishedFilter === f.key
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-12 text-center text-gray-400">
          Loading certificates...
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-1">
            {certs.length === 0
              ? 'No certificates yet.'
              : 'No certificates match your filters.'}
          </p>
          <p className="text-sm text-gray-500">
            {certs.length === 0
              ? 'Certificates appear automatically as candidates enroll in courses.'
              : 'Try a different filter or search term.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((cert) => {
            const thumb = pickThumb(cert);
            const detailUrl = `/admin/certificates/${cert.id}`;
            const published = isCertPublished(cert);
            const isBusy = busyId === cert.id;

            return (
              <Card
                key={cert.id}
                className={`p-6 border-l-4 ${
                  published ? 'border-black' : 'border-gray-300 opacity-90'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      published
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
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

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                        statusColors[cert.status] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cert.status}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {published ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">
                  {cert.studentName}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {cert.studentUsername}
                </p>

                <p className="text-sm text-gray-700 mb-1">
                  {cert.courseTitle}
                </p>
                <p className="text-xs text-gray-500 font-mono mb-3">
                  {cert.certificate_number} • {formatDate(cert.issued_at)}
                </p>

                {/* ---------- Thumbnail ---------- */}
                {thumb ? (
                  <Link
                    to={detailUrl}
                    className="block mb-4 group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={thumb}
                      alt={`Certificate ${cert.certificate_number}`}
                      className={`w-full h-auto block transition-opacity ${
                        published
                          ? 'group-hover:opacity-90'
                          : 'grayscale opacity-70 group-hover:opacity-90'
                      }`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full shadow">
                        Click to open
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="mb-4 h-40 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">
                      Image not available
                    </span>
                  </div>
                )}

                {/* ---------- Verification ID ---------- */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Verification ID (UUID)
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[11px] font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 truncate">
                      {cert.id}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyId(cert)}
                      className="text-[11px] text-gray-600 hover:text-black shrink-0"
                    >
                      {copiedId === cert.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* ---------- Actions ---------- */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <Link to={detailUrl}>
                    <Button size="small" variant="outline">
                      View
                    </Button>
                  </Link>
                  <Button
                    size="small"
                    onClick={() => handleDownload(cert)}
                    disabled={!cert.image_data_url}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant={published ? 'outline' : 'primary'}
                    onClick={() => handleTogglePublish(cert)}
                    disabled={isBusy}
                  >
                    {isBusy
                      ? 'Saving...'
                      : published
                      ? 'Hide'
                      : 'Publish'}
                  </Button>
                  <a
                    href={`/certificates/verify/${cert.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gray-600 hover:text-black self-center ml-1 underline"
                  >
                    Verify
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;