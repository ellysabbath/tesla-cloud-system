import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CourseFormModal from './CourseFormModal';
import CoursePreviewModal from './CoursePreviewModal';
import { courseApi } from '../../api/api';
import type { ApiCourse, CoursePayload } from '../../api/api';

// ============================================================
// Types
// ============================================================
type StatusFilter = 'all' | 'published' | 'draft' | 'archived';
type SortKey = 'newest' | 'title' | 'price';

// ============================================================
// Icons
// ============================================================
const BookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ============================================================
// Component
// ============================================================
const AdminCourses: React.FC = () => {
  const navigate = useNavigate();

  // ---------- Filters ----------
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // ---------- Data ----------
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  // ---------- CRUD modals ----------
  const [editing, setEditing] = useState<{
    course: ApiCourse | null;
    isNew: boolean;
  } | null>(null);
  const [previewCourse, setPreviewCourse] = useState<ApiCourse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiCourse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================
  // Load
  // ============================================================
  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await courseApi.list({
        search: search.trim() || undefined,
        category: categoryFilter,
        status: statusFilter,
      });
      if (res.success && Array.isArray(res.data)) {
        setCourses(res.data as ApiCourse[]);
      } else {
        setCourses([]);
        setError(res.message || 'Could not load courses.');
      }
    } catch (err) {
      console.error('Load courses error:', err);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const flashMessage = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 2500);
  };

  // ============================================================
  // Categories
  // ============================================================
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [courses]);

  // ============================================================
  // Sorted list
  // ============================================================
  const sorted = useMemo(() => {
    const list = [...courses];
    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'price') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [courses, sortBy]);

  // ============================================================
  // Counts
  // ============================================================
  const counts = {
    all: courses.length,
    published: courses.filter((c) => c.status === 'published').length,
    draft: courses.filter((c) => c.status === 'draft').length,
    archived: courses.filter((c) => c.status === 'archived').length,
  };

  const formatPrice = (p: number | string) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(Number(p));

  // ============================================================
  // Handlers
  // ============================================================
  const handleCreateNew = () => setEditing({ course: null, isNew: true });

  const handleEdit = (course: ApiCourse) =>
    setEditing({ course, isNew: false });

  const handleSave = async (payload: CoursePayload) => {
    if (!editing) return;
    setIsSaving(true);
    try {
      if (editing.isNew) {
        const res = await courseApi.create(payload);
        if (res.success) {
          flashMessage('Course created successfully.');
          await load();
          setEditing(null);
        } else {
          flashMessage(res.message || 'Could not create course.');
        }
      } else if (editing.course) {
        const res = await courseApi.update(editing.course.id, payload);
        if (res.success) {
          flashMessage('Course updated successfully.');
          await load();
          setEditing(null);
        } else {
          flashMessage(res.message || 'Could not update course.');
        }
      }
    } catch (err) {
      console.error('Save course error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await courseApi.remove(confirmDelete.id);
      if (res.success) {
        flashMessage('Course deleted.');
        await load();
      } else {
        flashMessage(res.message || 'Could not delete course.');
      }
    } catch (err) {
      console.error('Delete course error:', err);
      flashMessage('Could not reach the server.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearch('');
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Flash */}
      {flash && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4" />
          {flash}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Courses</h1>
          <p className="text-gray-600">
            Create and manage every course offered by Tesla Cloud Institute.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Courses',
            value: counts.all,
            color: 'text-gray-900',
          },
          {
            label: 'Published',
            value: counts.published,
            color: 'text-green-600',
          },
          {
            label: 'Drafts',
            value: counts.draft,
            color: 'text-yellow-600',
          },
          {
            label: 'Archived',
            value: counts.archived,
            color: 'text-gray-500',
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'all' as const, label: 'All' },
                { key: 'published' as const, label: 'Published' },
                { key: 'draft' as const, label: 'Draft' },
                { key: 'archived' as const, label: 'Archived' },
              ]
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${
                    statusFilter === f.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }
                `}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${
                    statusFilter === f.key
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-2 lg:ml-auto lg:max-w-2xl">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All categories' : cat}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="newest">Newest first</option>
              <option value="title">By title</option>
              <option value="price">Highest price</option>
            </select>

            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </Card>
      )}

      {/* Table */}
      {isLoading ? (
        <Card className="p-12 text-center text-gray-400">
          Loading courses...
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <BookIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-1">
            {courses.length === 0
              ? 'No courses available.'
              : 'No courses match your filters.'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {courses.length === 0
              ? 'Create your first course to get started.'
              : 'Try a different filter or search term.'}
          </p>
          {courses.length === 0 ? (
            <Button onClick={handleCreateNew}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create your first course
            </Button>
          ) : (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Course</th>
                  <th className="text-left px-4 py-3">Instructor</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((course) => (
                  <tr
                    key={course.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    {/* Course */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                          <BookIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[260px]">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {course.category || '—'} •{' '}
                            {course.duration || '—'} • {course.practicals || 0}{' '}
                            practicals
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Instructor */}
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[180px]">
                      {course.instructor ||
                        course.instructor_name ||
                        '—'}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right text-gray-900 font-medium whitespace-nowrap">
                      {formatPrice(course.price)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          course.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : course.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setPreviewCourse(course)}
                        className="text-xs font-medium text-gray-600 hover:underline mr-3"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => navigate('/admin/exams')}
                        className="text-xs font-medium text-blue-600 hover:underline mr-3"
                      >
                        Exams
                      </button>
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-xs font-medium text-black hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(course)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              Showing <strong>{sorted.length}</strong> of{' '}
              <strong>{courses.length}</strong> course
              {courses.length !== 1 ? 's' : ''}
            </span>
            <span>
              Catalog value:{' '}
              <strong className="text-gray-700">
                {formatPrice(
                  sorted.reduce((sum, c) => sum + Number(c.price), 0)
                )}
              </strong>
            </span>
          </div>
        </Card>
      )}

      {/* ============================================================
          Preview modal (read-only)
      ============================================================ */}
      {previewCourse && (
        <CoursePreviewModal
          course={previewCourse}
          onClose={() => setPreviewCourse(null)}
        />
      )}

      {/* ============================================================
          Create / Edit modal
      ============================================================ */}
      {editing && (
        <CourseFormModal
          course={editing.course}
          isNew={editing.isNew}
          isSaving={isSaving}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {/* ============================================================
          Delete confirmation
      ============================================================ */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete course
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Permanently delete{' '}
              <strong>{confirmDelete.title}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                size="small"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded text-white text-sm font-medium bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;