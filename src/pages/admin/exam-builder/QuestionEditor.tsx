import React from 'react';
import type { ExamQuestion, ExamSection } from '../../../types/admin';

// ============================================================
// Props
// ============================================================
interface Props {
  question: ExamQuestion;
  index: number;
  kind: ExamSection['kind'];
  onChange: (p: Partial<ExamQuestion>) => void;
  onRemove: () => void;
}

// ============================================================
// Small helpers
// ============================================================
const letterOf = (i: number) => String.fromCharCode(65 + i); // A, B, C...
const numberLabel = (i: number) => `${i + 1}.`;              // 1. 2. 3...

// ============================================================
// Component
// ============================================================
const QuestionEditor: React.FC<Props> = ({
  question,
  index,
  kind,
  onChange,
  onRemove,
}) => {
  // ---------------------------------------------------------
  // MATCHING — local helpers
  // ---------------------------------------------------------
  const colA = question.columnA ?? [];
  const colB = question.columnB ?? [];
  const matches = question.correctMatches ?? {};

  const addColumnA = () => {
    onChange({
      columnA: [...colA, { id: crypto.randomUUID(), text: '' }],
    });
  };

  const addColumnB = () => {
    onChange({
      columnB: [...colB, { id: crypto.randomUUID(), text: '' }],
    });
  };

  const removeColumnA = (id: string) => {
    const newA = colA.filter((x) => x.id !== id);
    const newMatches = { ...matches };
    delete newMatches[id];
    onChange({ columnA: newA, correctMatches: newMatches });
  };

  const removeColumnB = (id: string) => {
    const newB = colB.filter((x) => x.id !== id);
    const newMatches: Record<string, string> = {};
    Object.entries(matches).forEach(([k, v]) => {
      if (v !== id) newMatches[k] = v;
    });
    onChange({ columnB: newB, correctMatches: newMatches });
  };

  const setColumnAText = (id: string, text: string) => {
    onChange({
      columnA: colA.map((x) => (x.id === id ? { ...x, text } : x)),
    });
  };

  const setColumnBText = (id: string, text: string) => {
    onChange({
      columnB: colB.map((x) => (x.id === id ? { ...x, text } : x)),
    });
  };

  const setCorrectMatch = (aId: string, bId: string) => {
    onChange({ correctMatches: { ...matches, [aId]: bId } });
  };

  // ---------------------------------------------------------
  // MULTIPLE CHOICE — local helpers
  // ---------------------------------------------------------
  const setOptionText = (i: number, text: string) => {
    const opts = [...(question.options ?? ['', '', '', ''])];
    opts[i] = text;
    onChange({ options: opts });
  };

  const addOption = () => {
    onChange({ options: [...(question.options ?? []), ''] });
  };

  const removeOption = (i: number) => {
    const opts = (question.options ?? []).filter((_, idx) => idx !== i);
    let correct = question.correctOptionIndex ?? 0;
    if (correct >= opts.length) correct = Math.max(0, opts.length - 1);
    if (correct === i) correct = 0;
    onChange({ options: opts, correctOptionIndex: correct });
  };

  // ---------------------------------------------------------
  // FILL-IN-THE-BLANK — local helpers
  // ---------------------------------------------------------
  const setAcceptAlternatives = (raw: string) => {
    onChange({
      acceptAlternatives: raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-gray-700 uppercase">
          Q{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:underline"
        >
          Remove
        </button>
      </div>

      {/* ---------- Question text (hidden for matching — uses section instructions) ---------- */}
      {kind !== 'Matching Items' && (
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Question</label>
          <textarea
            value={question.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter the question text"
          />
        </div>
      )}

      {/* ============================================================
          MULTIPLE CHOICE
      ============================================================ */}
      {kind === 'Multiple Choice Questions' && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Options <span className="text-gray-400">(select the correct one)</span>
          </label>

          <div className="space-y-2">
            {(question.options ?? []).map((opt, i) => {
              const isCorrect = question.correctOptionIndex === i;
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={isCorrect}
                    onChange={() => onChange({ correctOptionIndex: i })}
                    title="Mark as correct"
                  />
                  <span className="text-xs text-gray-500 w-5 shrink-0">
                    {letterOf(i).toLowerCase()})
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => setOptionText(i, e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder={`Option ${letterOf(i).toLowerCase()}`}
                  />
                  {(question.options ?? []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                  {isCorrect && (
                    <span className="text-[10px] font-bold text-green-600 shrink-0">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={addOption}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              + Add option
            </button>
            <span className="text-[11px] text-gray-500">
              Radio = correct answer · only admins see this
            </span>
          </div>
        </div>
      )}

      {/* ============================================================
          TRUE / FALSE
      ============================================================ */}
      {kind === 'True or False' && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Correct answer
          </label>
          <div className="flex gap-3">
            {[
              { v: true, l: 'True (T)' },
              { v: false, l: 'False (F)' },
            ].map((o) => {
              const selected = question.correctBoolean === o.v;
              return (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => onChange({ correctBoolean: o.v })}
                  className={`px-4 py-1.5 rounded border text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }`}
                >
                  {o.l}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            The selected value is the correct answer (marking scheme).
          </p>
        </div>
      )}

      {/* ============================================================
          MATCHING ITEMS
      ============================================================ */}
      {kind === 'Matching Items' && (
        <div className="space-y-4">
          {/* --- prompt --- */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Prompt / instructions
            </label>
            <textarea
              value={question.text ?? ''}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Match the items in Column A with the correct definition in Column B."
            />
          </div>

          {/* --- two-column builder --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ----- COLUMN A ----- */}
            <div className="border-2 border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Column A — Questions
                </p>
                <span className="text-[10px] text-gray-400">
                  {colA.length} item{colA.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {colA.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="w-7 text-right text-xs font-bold text-gray-500 shrink-0">
                      {numberLabel(i)}
                    </span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => setColumnAText(item.id, e.target.value)}
                      placeholder={`Question ${i + 1}`}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={() => removeColumnA(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {colA.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No Column A items yet.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={addColumnA}
                className="mt-3 text-xs font-medium text-blue-600 hover:underline"
              >
                + Add Column A item
              </button>
            </div>

            {/* ----- COLUMN B ----- */}
            <div className="border-2 border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Column B — Answers
                </p>
                <span className="text-[10px] text-gray-400">
                  {colB.length} item{colB.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {colB.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="w-7 text-right text-xs font-bold text-gray-500 shrink-0">
                      {letterOf(i)}.
                    </span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => setColumnBText(item.id, e.target.value)}
                      placeholder={`Answer ${letterOf(i)}`}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={() => removeColumnB(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {colB.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-2">
                    No Column B items yet.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={addColumnB}
                className="mt-3 text-xs font-medium text-blue-600 hover:underline"
              >
                + Add Column B item
              </button>
            </div>
          </div>

          {/* --- marking scheme --- */}
          <div className="border-2 border-dashed border-black rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  🔒 Marking Scheme — Correct Matches
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Only admins see this. Students never see these answers.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">
                {Object.keys(matches).length}/{colA.length} matched
              </span>
            </div>

            {colA.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-2">
                Add Column A items to set the marking scheme.
              </p>
            ) : (
              <div className="space-y-2">
                {colA.map((a, i) => {
                  const correctB = matches[a.id] ?? '';
                  const matchedIndex = colB.findIndex((b) => b.id === correctB);
                  const isMatched = Boolean(correctB);

                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-2 rounded px-3 py-2 border transition-colors ${
                        isMatched
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-600 w-7 text-right shrink-0">
                        {numberLabel(i)}
                      </span>

                      <span className="flex-1 text-sm text-gray-800 truncate">
                        {a.text || (
                          <span className="italic text-gray-400">
                            (Column A item {i + 1})
                          </span>
                        )}
                      </span>

                      <span className="text-gray-400 text-xs shrink-0">→</span>

                      <select
                        value={correctB}
                        onChange={(e) => setCorrectMatch(a.id, e.target.value)}
                        className={`px-2 py-1 border rounded text-sm min-w-[240px] ${
                          isMatched
                            ? 'border-green-400 bg-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <option value="">— Select correct answer —</option>
                        {colB.map((b, j) => (
                          <option key={b.id} value={b.id}>
                            {letterOf(j)}.{' '}
                            {b.text || `(Column B item ${letterOf(j)})`}
                          </option>
                        ))}
                      </select>

                      {isMatched && (
                        <span className="text-xs font-bold text-green-600 w-5 text-center shrink-0">
                          {letterOf(matchedIndex)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-block w-3 h-3 rounded-full bg-green-400" />
              Green rows are matched. Grey rows still need an answer.
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          FILL-IN-THE-BLANK
      ============================================================ */}
      {kind === 'Fill-in-the-Blank' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Correct answer{' '}
              <span className="text-gray-400">(marking scheme)</span>
            </label>
            <input
              type="text"
              value={question.correctText ?? ''}
              onChange={(e) => onChange({ correctText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g. adaptability"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Accepted alternatives{' '}
              <span className="text-gray-400">(comma-separated, optional)</span>
            </label>
            <input
              type="text"
              value={(question.acceptAlternatives ?? []).join(', ')}
              onChange={(e) => setAcceptAlternatives(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="adaptability, flexibility"
            />
            {(question.acceptAlternatives ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(question.acceptAlternatives ?? []).map((alt, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Footer note ---------- */}
      <p className="text-[11px] text-gray-500 mt-3">
        🔒 Marking scheme values are only visible to admins.
      </p>
    </div>
  );
};

export default QuestionEditor;