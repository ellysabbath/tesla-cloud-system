import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import type { ApiCourse } from '../../api/api';

interface Props {
  course: ApiCourse;
  onClose: () => void;
}

const CoursePreviewModal: React.FC<Props> = ({ course, onClose }) => {
  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: course.currency || 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  const statusColor = (s: ApiCourse['status']) =>
    s === 'published'
      ? 'bg-green-100 text-green-700'
      : s === 'draft'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-200 text-gray-700';

  const field = (label: string, value: React.ReactNode) => (
    <div className="border-b border-gray-100 pb-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-900 break-words">
        {value || <span className="text-gray-400 italic">—</span>}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {course.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {course.category || 'Uncategorized'} •{' '}
              {course.duration || '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero strip */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor(
                  course.status
                )}`}
              >
                {course.status}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(course.price)}
              </span>
              <span className="text-xs text-gray-500">
                {course.practicals || 0} practicals
              </span>
            </div>
          </div>

          {/* Sections */}
          <div className="p-5 space-y-6">
            {/* Overview */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Overview
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description || 'No description provided.'}
              </p>
            </section>

            {course.fullDescription && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Full Description
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {course.fullDescription}
                </p>
              </section>
            )}

            {/* Details grid */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Instructor', course.instructor || course.instructor_name)}
                {field('Category', course.category)}
                {field('Duration', course.duration)}
                {field('Practicals', String(course.practicals || 0))}
                {field('Price', formatPrice(course.price))}
                {field('Currency', course.currency)}
              </div>
            </section>

            {/* Schedule */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Theory Days', course.theoryDays)}
                {field('Practical Days', course.practicalDays)}
                {field('Theory Exam', course.theoryExam)}
                {field('Practical Exam', course.practicalExam)}
              </div>
            </section>

            {/* What students will learn */}
            {course.whatWillLearn && course.whatWillLearn.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  What Students Will Learn
                </h3>
                <ul className="space-y-2">
                  {course.whatWillLearn.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Why learn */}
            {course.whyLearn && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Why Learn This Course
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {course.whyLearn}
                </p>
              </section>
            )}

            {/* Meta */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Meta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Course ID', <span className="font-mono text-xs">{course.id}</span>)}
                {field('Slug', <span className="font-mono text-xs">{course.slug}</span>)}
                {field(
                  'Created',
                  new Date(course.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                )}
                {field(
                  'Last Updated',
                  new Date(course.updated_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-t border-gray-200 bg-white shrink-0">
          <Button
            variant="secondary"
            fullWidth
            size="small"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CoursePreviewModal;