import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { adminCertificates } from '../../data/adminData';

const AdminCertificates: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'issued' | 'pending' | 'revoked'>('all');

  const filtered =
    filter === 'all'
      ? adminCertificates
      : adminCertificates.filter((c) => c.status === filter);

  const statusColors = {
    issued: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    revoked: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Certificates</h1>
          <p className="text-gray-600">Issue and manage student certificates</p>
        </div>
        <Button>+ Issue Certificate</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'issued', 'pending', 'revoked'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${filter === s
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-black'
              }
            `}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((cert) => (
          <Card key={cert.id} className="p-6 border-l-4 border-black">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[cert.status]}`}
                >
                  {cert.status}
                </span>
                {cert.grade !== '—' && (
                  <p className="text-lg font-bold text-gray-900 mt-1">{cert.grade}</p>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{cert.studentName}</h3>
            <p className="text-xs text-gray-500 mb-3">{cert.studentUsername}</p>

            <p className="text-sm text-gray-700 mb-1">{cert.courseName}</p>
            {cert.serialNumber && (
              <p className="text-xs text-gray-500 mb-4">
                Serial: {cert.serialNumber} • Issued{' '}
                {new Date(cert.issuedAt).toLocaleDateString()}
              </p>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button size="small" variant="outline">Preview</Button>
              {cert.status === 'pending' ? (
                <Button size="small">Issue</Button>
              ) : (
                <Button size="small">Download</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminCertificates;