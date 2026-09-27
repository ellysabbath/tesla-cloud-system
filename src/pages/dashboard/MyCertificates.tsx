import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { mockCertificates } from '../../data/mockData';

const MyCertificates: React.FC = () => {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Certificates</h1>
        <p className="text-gray-600">Certificates you've earned</p>
      </div>

      {mockCertificates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">You haven't earned any certificates yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockCertificates.map((cert) => (
            <Card key={cert.id} className="p-6 border-l-4 border-black">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900">{cert.grade}</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {cert.courseName}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Issued: {formatDate(cert.issuedDate)}
              </p>
              <Button variant="outline" size="small">
                Download Certificate
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;