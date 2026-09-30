import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import { newsApi } from '../../api/api';
import type { ApiNews } from '../../api/api';

// ============================================================
// Types
// ============================================================
type CategoryFilter =
  | 'all'
  | 'course'
  | 'exam'
  | 'payment'
  | 'system'
  | 'general';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'course', label: 'Course' },
  { key: 'exam', label: 'Exam' },
  { key: 'payment', label: 'Payment' },
  { key: 'system', label: 'System' },
  { key: 'general', label: 'General' },
];

const categoryColors: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700',
  exam: 'bg-orange-100 text-orange-700',
  payment: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
  general: 'bg-green-100 text-green-700',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ============================================================
// Component
// ============================================================
const News: React.FC = () => {
  const [items, setItems] = useState<ApiNews[]>([]);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await newsApi.list({
        category: category === 'all' ? undefined : category,
      });
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data as ApiNews[]);
      } else {
        setItems([]);
        setError(res.message || 'Could not load news.');
      }
    } catch (err) {
      console.error('News load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: items.length,
      course: items.filter((x) => x.category === 'course').length,
      exam: items.filter((x) => x.category === 'exam').length,
      payment: items.filter((x) => x.category === 'payment').length,
      system: items.filter((x) => x.category === 'system').length,
      general: items.filter((x) => x.category === 'general').length,
    }),
    [items]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          News &amp; Updates
        </h1>
        <p className="text-gray-600">
          Announcements from Tesla Cloud Institute
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                category === c.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-black'
              }`}
            >
              {c.label}
              <span className="ml-2 text-[10px] text-gray-400">
                {counts[c.key]}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-64 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-1">No news yet.</p>
          <p className="text-sm text-gray-500">
            Check back soon for updates from the institute.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`p-6 ${
                item.pinned ? 'border-l-4 border-yellow-400' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {item.pinned && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Pinned
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    categoryColors[item.category] ||
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.category}
                </span>
                <span className="text-[11px] text-gray-400">
                  {formatDate(item.created_at)}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {item.title}
              </h2>

              {item.body && (
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {item.body}
                </p>
              )}

              {item.author_name && (
                <p className="text-[11px] text-gray-400 mt-3">
                  By {item.author_name}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;