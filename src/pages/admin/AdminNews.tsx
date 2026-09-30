import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { newsApi } from '../../api/api';
import type { ApiNews, NewsPayload } from '../../api/api';

// ============================================================
// Types
// ============================================================
type CategoryFilter = 'all' | 'course' | 'exam' | 'payment' | 'system' | 'general';
type StatusFilter = 'all' | 'published' | 'hidden';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'course', label: 'Course' },
  { key: 'exam', label: 'Exam' },
  { key: 'payment', label: 'Payment' },
  { key: 'system', label: 'System' },
  { key: 'general', label: 'General' },
];

const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'hidden', label: 'Hidden' },
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
    month: 'short',
    day: 'numeric',
  });

const emptyForm = (): NewsPayload => ({
  title: '',
  body: '',
  category: 'general',
  is_published: true,
  pinned: false,
});

// ============================================================
// Component
// ============================================================
const AdminNews: React.FC = () => {
  const [items, setItems] = useState<ApiNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsPayload>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await newsApi.adminList({
        search: search.trim() || undefined,
        category: category === 'all' ? undefined : category,
        status: statusFilter,
      });
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data as ApiNews[]);
      } else {
        setItems([]);
        setError(res.message || 'Could not load news.');
      }
    } catch (err) {
      console.error('AdminNews load error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // Handlers
  // ============================================================
  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: ApiNews) => {
    setForm({
      title: item.title,
      body: item.body ?? '',
      category: item.category,
      is_published: item.is_published,
      pinned: item.pinned,
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      setError('Title is required.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload: NewsPayload = {
        title: form.title.trim(),
        body: form.body?.trim() || '',
        category: form.category || 'general',
        is_published: form.is_published ?? true,
        pinned: form.pinned ?? false,
      };

      const res = editingId
        ? await newsApi.adminUpdate(editingId, payload)
        : await newsApi.adminCreate(payload);

      if (res.success) {
        resetForm();
        await load();
      } else {
        setError(res.message || 'Could not save news.');
      }
    } catch (err) {
      console.error('Save news error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublished = async (item: ApiNews) => {
    setBusyId(item.id);
    const next = !item.is_published;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, is_published: next } : x))
    );
    try {
      const res = await newsApi.adminUpdate(item.id, { is_published: next });
      if (!res.success) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, is_published: !next } : x
          )
        );
        setError(res.message || 'Could not update news.');
      }
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, is_published: !next } : x))
      );
      setError('Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePinned = async (item: ApiNews) => {
    setBusyId(item.id);
    const next = !item.pinned;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, pinned: next } : x))
    );
    try {
      const res = await newsApi.adminUpdate(item.id, { pinned: next });
      if (!res.success) {
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, pinned: !next } : x))
        );
        setError(res.message || 'Could not update news.');
      }
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, pinned: !next } : x))
      );
      setError('Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: ApiNews) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setBusyId(item.id);
    try {
      const res = await newsApi.adminDelete(item.id);
      if (res.success) {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      } else {
        setError(res.message || 'Could not delete news.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusyId(null);
    }
  };

  // ============================================================
  // Derived
  // ============================================================
  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((x) => x.is_published).length,
      hidden: items.filter((x) => !x.is_published).length,
    }),
    [items]
  );

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            News &amp; Updates
          </h1>
          <p className="text-gray-600">
            Publish announcements for students across the platform.
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              setForm(emptyForm());
              setEditingId(null);
              setShowForm(true);
            }
          }}
        >
          {showForm && !editingId ? 'Cancel' : '+ New Update'}
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* ---------- Form ---------- */}
      {showForm && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Update' : 'New Update'}
          </h2>

          <div className="space-y-4">
            <Input
              label="Title"
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. New Java Full Stack course now open"
            />

            <div>
              <label className="block text-sm font-medium mb-1">
                Body
              </label>
              <textarea
                value={form.body ?? ''}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="Write the announcement…"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={form.category ?? 'general'}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
                >
                  <option value="general">General</option>
                  <option value="course">Course</option>
                  <option value="exam">Exam</option>
                  <option value="payment">Payment</option>
                  <option value="system">System</option>
                </select>
              </div>

              <label className="flex items-center gap-2 mt-7 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published ?? true}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Published</span>
              </label>

              <label className="flex items-center gap-2 mt-7 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned ?? false}
                  onChange={(e) =>
                    setForm({ ...form, pinned: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Pin to top</span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : editingId ? 'Save Changes' : 'Publish'}
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ---------- Filters ---------- */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-black'
              }`}
            >
              {s.label}
              <span className="ml-2 text-[10px] text-gray-400">
                {counts[s.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  category === c.key
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="md:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news…"
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </Card>

      {/* ---------- List ---------- */}
      {isLoading ? (
        <Card className="p-12 text-center text-gray-400">
          Loading news…
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-1">No news yet.</p>
          <p className="text-sm text-gray-500">
            Click “+ New Update” to publish your first announcement.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {item.is_published ? 'Published' : 'Hidden'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  {item.body && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.body}
                    </p>
                  )}
                  {item.author_name && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      By {item.author_name}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                    disabled={busyId === item.id}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleTogglePinned(item)}
                    disabled={busyId === item.id}
                  >
                    {item.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button
                    size="small"
                    variant={item.is_published ? 'outline' : 'primary'}
                    onClick={() => handleTogglePublished(item)}
                    disabled={busyId === item.id}
                  >
                    {item.is_published ? 'Hide' : 'Publish'}
                  </Button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={busyId === item.id}
                    className="text-xs font-medium text-red-600 hover:underline self-center md:self-end"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNews;