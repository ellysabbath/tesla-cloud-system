import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import QuestionEditor from './QuestionEditor';
import type { ExamSection, ExamQuestion } from '../../../types/admin';

interface Props {
  section: ExamSection;
  sectionIndex: number;
  onChange: (p: Partial<ExamSection>) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (qIdx: number) => void;
  onUpdateQuestion: (qIdx: number, p: Partial<ExamQuestion>) => void;
}

const SectionEditor: React.FC<Props> = ({
  section,
  sectionIndex,
  onChange,
  onRemove,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
}) => {
  return (
    <Card className="p-6 border-l-4 border-black">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <div className="flex-1">
          <Input
            label={`Section ${String.fromCharCode(65 + sectionIndex)} title`}
            name="sectionTitle"
            value={section.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="w-32">
            <Input
              label="Points / question"
              name="pointsPerQuestion"
              type="number"
              value={String(section.pointsPerQuestion)}
              onChange={(e) =>
                onChange({ pointsPerQuestion: Number(e.target.value) || 1 })
              }
            />
          </div>
          <Button variant="danger" size="small" onClick={onRemove}>
            Remove Section
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Instructions</label>
        <textarea
          value={section.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {section.questions.map((q, qIdx) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={qIdx}
            kind={section.kind}
            onChange={(p) => onUpdateQuestion(qIdx, p)}
            onRemove={() => onRemoveQuestion(qIdx)}
          />
        ))}
      </div>

      <div className="mt-4">
        <Button variant="outline" onClick={onAddQuestion}>
          + Add Question
        </Button>
      </div>
    </Card>
  );
};

export default SectionEditor;