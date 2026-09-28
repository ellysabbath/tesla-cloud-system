import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  getCertificateById,
  type GeneratedCertificate,
} from '../../data/certificatesData';
import {
  ElishaSignature,
  ProgramDirectorSignature,
} from '../../components/certificate/Signatures';

// ============================================================
// Icons
// ============================================================
const GraduationCapIcon: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10',
}) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10L12 5 2 10l10 5 10-5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10v6" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PrintIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zM7 9V5a2 2 0 012-2h6a2 2 0 012 2v4" />
  </svg>
);

// ============================================================
// Certificate page
// ============================================================
const Certificate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cert, setCert] = useState<GeneratedCertificate | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    const found = getCertificateById(id);
    if (!found) {
      setNotFound(true);
      return;
    }
    setCert(found);
  }, [id]);

  // ---------- Not found ----------
  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Certificate not found
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            This certificate does not exist or has been removed.
          </p>
          <Button onClick={() => navigate('/my-certificates')}>
            Back to My Certificates
          </Button>
        </Card>
      </div>
    );
  }

  if (!cert) return null;

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const verifyUrl = `https://teslacloud.ac.tz/verify/${cert.certificateNumber}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    verifyUrl
  )}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ---------- Top bar ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <Button size="small" onClick={() => window.print()}>
          <PrintIcon className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      {/* ============================================================
          CERTIFICATE
      ============================================================ */}
      <div
        className="certificate-wrapper bg-white rounded-lg shadow-xl overflow-hidden"
        style={{ fontFamily: "'Bell MT', 'Times New Roman', serif" }}
      >
        {/* Outer dark-teal frame */}
        <div className="p-4 md:p-6" style={{ backgroundColor: '#0f3d3e' }}>
          {/* Gold border */}
          <div className="p-1 md:p-1.5" style={{ backgroundColor: '#c9a227' }}>
            {/* Cream inner background */}
            <div
              className="relative px-6 md:px-12 py-10 md:py-14"
              style={{ backgroundColor: '#eef4ee' }}
            >
              <CornerOrnaments />

              {/* LOGO — graduation cap */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                  style={{
                    border: '2px solid #c9a227',
                    backgroundColor: '#ffffff',
                    color: '#0f3d3e',
                  }}
                >
                  <GraduationCapIcon className="w-10 h-10 md:w-12 md:h-12" />
                </div>
              </div>

              {/* INSTITUTE NAME */}
              <h1
                className="text-center text-3xl md:text-5xl font-bold tracking-wide"
                style={{ color: '#6b1245' }}
              >
                Tesla Cloud Institute
              </h1>

              {/* Divider */}
              <div className="flex justify-center my-5">
                <div
                  className="w-2/3 md:w-1/2 h-px"
                  style={{ backgroundColor: '#0f3d3e', opacity: 0.6 }}
                />
              </div>

              {/* TITLE */}
              <h2
                className="text-center text-2xl md:text-3xl mb-10"
                style={{ color: '#0f3d3e' }}
              >
                Course Completion Certificate
              </h2>

              {/* BODY */}
              <div className="text-center mb-8">
                <p className="text-base md:text-lg" style={{ color: '#1c1c1c' }}>
                  This is to certify that
                </p>

                <p
                  className="text-3xl md:text-4xl my-4"
                  style={{ color: '#0f3d3e' }}
                >
                  {cert.studentName}
                </p>

                <p
                  className="text-sm md:text-base max-w-3xl mx-auto leading-relaxed"
                  style={{ color: '#1c1c1c' }}
                >
                  has successfully completed all requirements and passed the
                  examination for
                </p>

                <p
                  className="text-xl md:text-2xl mt-3 mb-3 font-semibold"
                  style={{ color: '#6b1245' }}
                >
                  {cert.courseName}
                </p>

                <p
                  className="text-sm md:text-base max-w-3xl mx-auto leading-relaxed"
                  style={{ color: '#1c1c1c' }}
                >
                  demonstrating competence and practical understanding of the
                  subject matter, and is hereby awarded this certificate.
                </p>
              </div>

              {/* ISSUED DATE */}
              <p className="text-center text-base md:text-lg mb-12" style={{ color: '#1c1c1c' }}>
                Issued on <strong style={{ color: '#0f3d3e' }}>{issuedDate}</strong>
              </p>

              {/* SIGNATURES + SEAL */}
              <div className="grid grid-cols-3 items-end gap-4 mb-14">
                {/* Left — Founder */}
                <div className="text-center">
                  <ElishaSignature className="w-full max-w-[200px] h-16 mx-auto" />
                  <div
                    className="w-full h-px mt-1 mb-2"
                    style={{ backgroundColor: '#0f3d3e', opacity: 0.7 }}
                  />
                  <p className="text-sm md:text-base font-semibold" style={{ color: '#1c1c1c' }}>
                    Elisha Sabbath Mwananjela
                  </p>
                  <p className="text-xs md:text-sm" style={{ color: '#1c1c1c' }}>
                    Founder & Executive Director
                  </p>
                </div>

                {/* Center seal */}
                <div className="flex justify-center">
                  <SealBadge />
                </div>

                {/* Right — Program Director */}
                <div className="text-center">
                  <ProgramDirectorSignature className="w-full max-w-[200px] h-16 mx-auto" />
                  <div
                    className="w-full h-px mt-1 mb-2"
                    style={{ backgroundColor: '#0f3d3e', opacity: 0.7 }}
                  />
                  <p className="text-sm md:text-base font-semibold" style={{ color: '#1c1c1c' }}>
                    Program Director
                  </p>
                  <p className="text-xs md:text-sm" style={{ color: '#1c1c1c' }}>
                    Tesla Cloud Institute
                  </p>
                </div>
              </div>

              {/* FOOTER: CERT # + QR */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm md:text-base" style={{ color: '#1c1c1c' }}>
                    Certificate No.{' '}
                    <strong style={{ color: '#6b1245' }}>
                      {cert.certificateNumber}
                    </strong>
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#1c1c1c' }}>
                    Grade: <strong>{cert.grade}</strong> • Verify at
                    teslacloud.ac.tz
                  </p>
                </div>

                <div
                  className="p-1 bg-white rounded"
                  style={{ border: '2px solid #1c1c1c' }}
                >
                  <img
                    src={qrUrl}
                    alt="Certificate verification QR code"
                    className="w-20 h-20 md:w-24 md:h-24"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .certificate-wrapper {
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// Corner ornaments
// ============================================================
const CornerOrnaments: React.FC = () => {
  const corner = (rotate: number) => {
    const positions: React.CSSProperties =
      rotate === 0
        ? { top: 8, left: 8 }
        : rotate === 90
        ? { top: 8, right: 8 }
        : rotate === 180
        ? { bottom: 8, right: 8 }
        : { bottom: 8, left: 8 };

    return (
      <svg
        key={rotate}
        className="absolute w-8 h-8 md:w-12 md:h-12"
        viewBox="0 0 50 50"
        fill="none"
        stroke="#c9a227"
        strokeWidth="2"
        style={{ transform: `rotate(${rotate}deg)`, ...positions }}
      >
        <path d="M5 20 L5 5 L20 5" strokeLinecap="square" />
        <path d="M10 20 L10 10 L20 10" strokeLinecap="square" />
        <circle cx="5" cy="5" r="1.5" fill="#c9a227" />
        <circle cx="20" cy="5" r="1" fill="#c9a227" />
        <circle cx="5" cy="20" r="1" fill="#c9a227" />
      </svg>
    );
  };

  return (
    <>
      {corner(0)}
      {corner(90)}
      {corner(180)}
      {corner(270)}
    </>
  );
};

// ============================================================
// Gold seal
// ============================================================
const SealBadge: React.FC = () => (
  <div
    className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center"
    style={{
      background:
        'radial-gradient(circle at 40% 40%, #ffd970 0%, #e0a72c 60%, #b47c15 100%)',
      border: '3px solid #b47c15',
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    }}
  >
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="#8c5a0c" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="42" stroke="#8c5a0c" strokeWidth="0.8" strokeDasharray="2 2" />
    </svg>
    <span
      className="text-sm md:text-base font-bold tracking-widest"
      style={{ color: '#5b3a05' }}
    >
      TCI
    </span>
  </div>
);

export default Certificate;