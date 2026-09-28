import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { ApiCourse, CoursePayload } from '../../api/api';

interface CourseFormModalProps {
  course: ApiCourse | null;
  isNew: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (payload: CoursePayload) => void | Promise<void>;
}

const emptyForm: CoursePayload = {
  title: '',
  description: '',
  fullDescription: '',
  whyLearn: '',
  whatWillLearn: [],
  category: '',
  price: 0,
  duration: '',
  practicals: 0,
  theoryDays: '',
  practicalDays: '',
  theoryExam: '',
  practicalExam: '',
  image: '',
  instructor: '',
  status: 'published',
};

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  course,
  isNew,
  isSaving = false,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CoursePayload>(emptyForm);
  const [learnItems, setLearnItems] = useState<string[]>([]);
  const [error, setError] = useState('');

  // ============================================================
  // Initialize form when `course` changes (open modal)
  // ============================================================
  useEffect(() => {
    if (course) {
      setForm({
        title: course.title ?? '',
        description: course.description ?? '',
        fullDescription: course.fullDescription ?? '',
        whyLearn: course.whyLearn ?? '',
        whatWillLearn: course.whatWillLearn ?? [],
        category: course.category ?? '',
        price: Number(course.price) || 0,
        duration: course.duration ?? '',
        practicals: course.practicals ?? 0,
        theoryDays: course.theoryDays ?? '',
        practicalDays: course.practicalDays ?? '',
        theoryExam: course.theoryExam ?? '',
        practicalExam: course.practicalExam ?? '',
        image: course.image ?? '',
        instructor: course.instructor ?? course.instructor_name ?? '',
        status: course.status ?? 'published',
      });
      setLearnItems(course.whatWillLearn ?? []);
    } else {
      setForm(emptyForm);
      setLearnItems([]);
    }
    setError('');
  }, [course]);

  // ============================================================
  // Helpers
  // ============================================================
  const update = (patch: Partial<CoursePayload>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const addLearnItem = () => setLearnItems((prev) => [...prev, '']);
  const updateLearnItem = (i: number, v: string) =>
    setLearnItems((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const removeLearnItem = (i: number) =>
    setLearnItems((prev) => prev.filter((_, idx) => idx !== i));
  const moveLearnItem = (i: number, dir: -1 | 1) =>
    setLearnItems((prev) => {
      const next = [...prev];
      const t = i + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });

  const validate = (): string => {
    if (!form.title.trim()) return 'Course title is required';
    if (!form.category?.trim()) return 'Category is required';
    if (!form.instructor?.trim()) return 'Instructor is required';
    if (!form.duration?.trim()) return 'Duration is required';
    if (!form.price || form.price <= 0) return 'Price must be greater than 0';
    return '';
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const cleaned = learnItems.map((s) => s.trim()).filter(Boolean);

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      fullDescription: form.fullDescription?.trim() || '',
      whyLearn: form.whyLearn?.trim() || '',
      category: form.category?.trim() || '',
      duration: form.duration?.trim() || '',
      theoryDays: form.theoryDays?.trim() || '',
      practicalDays: form.practicalDays?.trim() || '',
      theoryExam: form.theoryExam?.trim() || '',
      practicalExam: form.practicalExam?.trim() || '',
      image: form.image?.trim() || '',
      instructor: form.instructor?.trim() || '',
      whatWillLearn: cleaned,
    });
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isNew ? 'Create New Course' : 'Edit Course'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isNew
                ? 'Fill in the details for the new course.'
                : 'Update the course details below.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              {error}
            </div>
          )}

          <Input
            label="Course Title"
            name="title"
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Introduction to Computer Programming"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Category"
              name="category"
              value={form.category ?? ''}
              onChange={(e) => update({ category: e.target.value })}
              placeholder="e.g. Programming"
              required
            />
            <Input
              label="Instructor"
              name="instructor"
              value={form.instructor ?? ''}
              onChange={(e) => update({ instructor: e.target.value })}
              placeholder="e.g. Elisha Sabbath Mwananjela"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Short Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Brief description for the course card"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Full Description
            </label>
            <textarea
              value={form.fullDescription ?? ''}
              onChange={(e) => update({ fullDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Detailed description shown on the course page"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Price (TZS)"
              name="price"
              type="number"
              value={String(form.price)}
              onChange={(e) => update({ price: Number(e.target.value) || 0 })}
              required
            />
            <Input
              label="Duration"
              name="duration"
              value={form.duration ?? ''}
              onChange={(e) => update({ duration: e.target.value })}
              placeholder="e.g. 6 weeks"
              required
            />
            <Input
              label="Practicals"
              name="practicals"
              type="number"
              value={String(form.practicals ?? 0)}
              onChange={(e) => update({ practicals: Number(e.target.value) || 0 })}
            />
          </div>

          {/* What Students Will Learn — list builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-sm font-medium">
                  What Students Will Learn
                </label>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Click "Add Topic" to create a new list item.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                {learnItems.length} item{learnItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {learnItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>

                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateLearnItem(i, e.target.value)}
                    placeholder={`Topic ${i + 1}`}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  />

                  <div className="flex flex-col shrink-0">
                    <button
                      type="button"
                      onClick={() => moveLearnItem(i, -1)}
                      disabled={i === 0}
                      className={`p-0.5 rounded ${
                        i === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-black hover:bg-gray-100'
                      }`}
                      title="Move up"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLearnItem(i, 1)}
                      disabled={i === learnItems.length - 1}
                      className={`p-0.5 rounded ${
                        i === learnItems.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:text-black hover:bg-gray-100'
                      }`}
                      title="Move down"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLearnItem(i)}
                    className="shrink-0 p-1.5 rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {learnItems.length === 0 && (
                <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-400 italic">
                    No topics yet. Click "Add Topic" to start.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={addLearnItem}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-700 hover:border-black hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Topic
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Why Learn This Course
            </label>
            <textarea
              value={form.whyLearn ?? ''}
              onChange={(e) => update({ whyLearn: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Theory Days"
              name="theoryDays"
              value={form.theoryDays ?? ''}
              onChange={(e) => update({ theoryDays: e.target.value })}
              placeholder="e.g. Monday & Wednesday"
            />
            <Input
              label="Practical Days"
              name="practicalDays"
              value={form.practicalDays ?? ''}
              onChange={(e) => update({ practicalDays: e.target.value })}
              placeholder="e.g. Tuesday & Thursday"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Theory Exam"
              name="theoryExam"
              value={form.theoryExam ?? ''}
              onChange={(e) => update({ theoryExam: e.target.value })}
              placeholder="e.g. Week 6 - Friday"
            />
            <Input
              label="Practical Exam"
              name="practicalExam"
              value={form.practicalExam ?? ''}
              onChange={(e) => update({ practicalExam: e.target.value })}
              placeholder="e.g. Week 6 - Saturday (Project)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-t border-gray-200 bg-white shrink-0">
          <Button variant="secondary" fullWidth size="small" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button fullWidth size="small" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : isNew ? 'Create Course' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CourseFormModal;