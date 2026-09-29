import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { examApi, attemptApi } from '../../api/api';
import type {
  ApiExam,
  ApiExamQuestion,
  ApiExamSection,
  ApiAttempt,
} from '../../api/api';

// ============================================================
// Helpers
// ============================================================
const formatTime = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
};

const letterOf = (i: number): string => String.fromCharCode(65 + i);

const letterToIndex = (raw: string): number => {
  const s = raw.trim().toUpperCase();
  if (!s) return -1;
  const code = s.charCodeAt(0);
  if (code < 65 || code > 90) return -1;
  return code - 65;
};

const isDesktopDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hasTouch =
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isLargeScreen = window.innerWidth >= 1024;
  return isLargeScreen && (!hasTouch || window.innerWidth >= 1280);
};

// ============================================================
// Local answer shape
// ============================================================
interface LocalAnswer {
  questionId: string;
  selectedOptionId?: string | null;
  booleanAnswer?: boolean | null;
  textAnswer?: string | null;
  /** For matching: { aIndex: bIndex } both as strings. */
  matches?: Record<string, string>;
}

// ============================================================
// Icons
// ============================================================
const VideoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
  </svg>
);

// ============================================================
// Video recorder hook
// ============================================================
type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopped'
  | 'denied'
  | 'error';

interface UseExamRecorderReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: RecorderStatus;
  elapsedSeconds: number;
  stream: MediaStream | null;
  stopRecording: () => Promise<string | null>;
}

const useExamRecorder = (enabled: boolean): UseExamRecorderReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streamState, setStreamState] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = async () => {
      setStatus('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setStreamState(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const mimeType =
          MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : '';

        const rec = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined
        );
        recorderRef.current = rec;
        chunksRef.current = [];

        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        rec.start(2000);
        setStatus('recording');

        interval = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Recorder error:', err);
        if ((err as Error).name === 'NotAllowedError') setStatus('denied');
        else setStatus('error');
      }
    };

    start();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      try {
        if (
          recorderRef.current &&
          recorderRef.current.state !== 'inactive'
        ) {
          recorderRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStreamState(null);
    };
  }, [enabled]);

  const stopRecording = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      const stream = streamRef.current;

      if (!rec || rec.state === 'inactive') {
        stream?.getTracks().forEach((t) => t.stop());
        resolve(null);
        return;
      }

      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        stream?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setStreamState(null);
        setStatus('stopped');

        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      };

      try {
        rec.stop();
      } catch {
        resolve(null);
      }
    });
  };

  return {
    videoRef,
    status,
    elapsedSeconds,
    stream: streamState,
    stopRecording,
  };
};

// ============================================================
// Main component
// ============================================================
const TakeExam: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ApiExam | null>(null);
  const [attempt, setAttempt] = useState<ApiAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [blurReason, setBlurReason] = useState('');

  const submittedRef = useRef(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const recorderRef = useRef<UseExamRecorderReturn | null>(null);

  const desktopEnforced = useMemo(() => isDesktopDevice(), []);
  const recorderEnabled = !!exam && !!attempt && !error;
  const recorder = useExamRecorder(recorderEnabled);

  useEffect(() => {
    recorderRef.current = recorder;
  }, [recorder]);

  useEffect(() => {
    const payload = recorderEnabled
      ? {
          active: true,
          status: recorder.status,
          elapsedSeconds: recorder.elapsedSeconds,
          stream: recorder.stream,
        }
      : null;

    window.dispatchEvent(new CustomEvent('tci:recorder', { detail: payload }));

    return () => {
      window.dispatchEvent(
        new CustomEvent('tci:recorder', { detail: null })
      );
    };
  }, [
    recorderEnabled,
    recorder.status,
    recorder.elapsedSeconds,
    recorder.stream,
  ]);

  // ============================================================
  // Load exam + start attempt
  // ============================================================
  useEffect(() => {
    if (!id) {
      navigate('/candidate/exams');
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const examRes = await examApi.get(id);
        if (cancelled) return;

        if (!examRes.success || !examRes.data) {
          setError('This exam does not exist or is unavailable.');
          return;
        }

        const e = examRes.data as ApiExam;

        if (e.status !== 'published') {
          setError('This exam is not currently available.');
          setExam(e);
          return;
        }

        setExam(e);
        setTimeLeft(e.durationMinutes * 60);

        const startRes = await attemptApi.start(e.id);
        if (cancelled) return;

        if (startRes.success && startRes.data) {
          const att = startRes.data as ApiAttempt;

          if (att.submitted_at) {
            navigate(`/candidate/exams/${e.id}/result`);
            return;
          }

          setAttempt(att);
        } else {
          setError(startRes.message || 'Could not start the exam session.');
        }
      } catch (err) {
        console.error('TakeExam load error:', err);
        if (!cancelled) setError('Could not load exam.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // ============================================================
  // Submit
  // ============================================================
  const performSubmit = async (
    auto: boolean,
    reason: string = ''
  ) => {
    if (!exam || !attempt) return;
    if (submittedRef.current) return;

    submittedRef.current = true;
    setSubmitting(true);

    let videoBase64: string | null = null;
    try {
      const rec = recorderRef.current ?? recorder;
      videoBase64 = await rec.stopRecording();
      console.log(
        '[TakeExam] recorded video (base64 length):',
        videoBase64?.length ?? 0
      );
    } catch (err) {
      console.warn('Failed to stop recorder:', err);
    }

    const payloadAnswers = Object.values(answersRef.current).map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId ?? null,
      booleanAnswer: a.booleanAnswer ?? null,
      textAnswer: a.textAnswer ?? null,
      matches: a.matches ?? {},
    }));

    try {
      const res = await attemptApi.submit(attempt.id, {
        answers: payloadAnswers,
        autoSubmitted: auto,
        autoSubmitReason: reason || undefined,
        videoRecord: videoBase64 ?? undefined,
      });

      if (!res.success) {
        setError(res.message || 'Could not submit the exam.');
        setSubmitting(false);
        submittedRef.current = false;
        return;
      }

      setTimeout(() => {
        navigate(`/candidate/exams/${exam.id}/result`);
      }, 300);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Could not reach the server. Please try again.');
      setSubmitting(false);
      submittedRef.current = false;
    }
  };

  const submitExam = (auto = false) => {
    performSubmit(auto, '');
  };

  const submitExamOnBlur = (reason: string) => {
    setBlurReason(reason);
    performSubmit(true, reason);
  };

  // ============================================================
  // Desktop blur-protection
  // ============================================================
  useEffect(() => {
    if (!desktopEnforced) return;
    if (!exam || !attempt) return;

    const handleBlur = (reason: string) => {
      if (submittedRef.current) return;
      submitExamOnBlur(reason);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleBlur('You switched to another tab or minimized the window.');
      }
    };

    const onWindowBlur = () => {
      handleBlur('The exam window lost focus.');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopEnforced, exam, attempt]);

  // ============================================================
  // Timer countdown
  // ============================================================
  useEffect(() => {
    if (!exam || submittedRef.current) return;
    if (timeLeft <= 0) return;

    const t = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [exam, timeLeft]);

  // ============================================================
  // Timer auto-submit
  // ============================================================
  useEffect(() => {
    if (!exam || submittedRef.current) return;
    if (timeLeft === 0 && exam.durationMinutes > 0) {
      submittedRef.current = true;
      submitExam(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, exam]);

  const totalQuestions = useMemo(() => {
    if (!exam) return 0;
    return (exam.sections ?? []).reduce(
      (sum, sec) => sum + (sec.questions?.length ?? 0),
      0
    );
  }, [exam]);

  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft <= 60 && timeLeft > 30;
  const isCritical = timeLeft <= 30 && timeLeft > 0;

  const setAnswer = (
    questionId: string,
    patch: Omit<Partial<LocalAnswer>, 'questionId'>
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch, questionId },
    }));
  };

  // ============================================================
  // Guards
  // ============================================================
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-12 text-center text-gray-400">
          Loading exam...
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/candidate/exams')}>
            Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  if (!exam || !attempt) return null;

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="max-w-5xl mx-auto pb-32">
      {desktopEnforced && recorder.status !== 'denied' && (
        <div className="mb-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <WarningIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <p className="font-semibold mb-0.5">
              Exam integrity mode is active
            </p>
            <p>
              Switching tabs, minimizing the window, or losing focus will
              <strong> automatically submit your exam</strong> with all of
              your current answers and the session video. Stay on this page
              until you finish.
            </p>
          </div>
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {exam.title}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {exam.courseTitle} • {exam.year} • {totalQuestions} questions
            </p>
          </div>

          <div className="flex items-center gap-3">
            {recorder.status === 'recording' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-red-700">
                  REC
                </span>
                <span className="text-[11px] text-red-700 font-mono tabular-nums">
                  {formatTime(recorder.elapsedSeconds)}
                </span>
              </div>
            )}

            <div
              className={`px-4 py-2 rounded-lg font-mono text-lg font-bold tabular-nums transition-colors ${
                isCritical
                  ? 'bg-red-600 text-white animate-pulse'
                  : isLowTime
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-black text-white'
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            <Button
              variant="outline"
              size="small"
              onClick={() => setShowConfirm(true)}
            >
              Submit
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{
                width: `${
                  totalQuestions === 0
                    ? 0
                    : (answeredCount / totalQuestions) * 100
                }%`,
              }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>
      </div>

      {/* General instructions */}
      {exam.instructions.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            Examination General Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
            {exam.instructions
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((ins, i) => (
                <li key={i}>{ins.instruction}</li>
              ))}
          </ol>
        </Card>
      )}

      {/* Sections + questions */}
      {exam.sections.map((section: ApiExamSection, sIdx: number) => {
        const questions = section.questions ?? [];
        const questionsBefore = (exam.sections ?? [])
          .slice(0, sIdx)
          .reduce((sum, s) => sum + (s.questions?.length ?? 0), 0);

        return (
          <div key={section.id ?? sIdx} className="mt-8">
            <div className="bg-gray-900 text-white rounded-t-lg p-4">
              <h2 className="font-bold text-lg">{section.title}</h2>
              {section.instructions && (
                <p className="text-sm text-gray-300 mt-1">
                  {section.instructions}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {questions.length} question
                {questions.length !== 1 ? 's' : ''} •{' '}
                {Number(section.points_per_question)} point
                {Number(section.points_per_question) !== 1 ? 's' : ''} each
              </p>
            </div>

            <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
              {questions.map((q: ApiExamQuestion, qIdx: number) => {
                const ans: LocalAnswer = answers[q.id] ?? {
                  questionId: q.id,
                };
                const questionNumber = questionsBefore + qIdx + 1;

                return (
                  <div key={q.id} className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                        {questionNumber}
                      </span>
                      <p className="text-gray-900 font-medium leading-relaxed pt-1">
                        {q.text || (
                          <span className="text-gray-400 italic">
                            {q.type === 'matching'
                              ? 'Match the items below.'
                              : '(no text)'}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* ---------------- multiple choice ---------------- */}
                    {q.type === 'multiple-choice' && (
                      <div className="space-y-2 ml-11">
                        {(q.options ?? []).map((opt, i) => {
                          const selected = ans.selectedOptionId === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                selected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={selected}
                                onChange={() =>
                                  setAnswer(q.id, {
                                    selectedOptionId: opt.id,
                                  })
                                }
                                className="sr-only"
                              />
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                                  selected
                                    ? 'bg-white text-black'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {letterOf(i).toLowerCase()}
                              </span>
                              <span className="text-sm">
                                {opt.option_text || (
                                  <span
                                    className={
                                      selected
                                        ? 'text-gray-300 italic'
                                        : 'text-gray-400 italic'
                                    }
                                  >
                                    (empty option)
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* ---------------- true / false ---------------- */}
                    {q.type === 'true-false' && (
                      <div className="ml-11 flex gap-3">
                        {[
                          { v: true, l: 'T — True' },
                          { v: false, l: 'F — False' },
                        ].map((o) => {
                          const selected = ans.booleanAnswer === o.v;
                          return (
                            <button
                              key={o.l}
                              type="button"
                              onClick={() =>
                                setAnswer(q.id, { booleanAnswer: o.v })
                              }
                              className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                                selected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {o.l}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ---------------- matching (letter inputs, index keys) ---------------- */}
                    {q.type === 'matching' && (
                      <div className="ml-11">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                              Column A — Type the letter from Column B
                            </p>
                            <div className="space-y-2">
                              {(q.column_a ?? []).map((a, i) => {
                                const storedBIdx = (ans.matches ?? {})[
                                  String(i)
                                ];
                                const chosenBIdx =
                                  storedBIdx === undefined
                                    ? -1
                                    : Number(storedBIdx);
                                const chosenLetter =
                                  chosenBIdx >= 0 &&
                                  chosenBIdx < (q.column_b ?? []).length
                                    ? letterOf(chosenBIdx)
                                    : '';

                                return (
                                  <div
                                    key={a.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                                      chosenLetter
                                        ? 'border-black bg-gray-50'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <span className="w-7 text-right text-xs font-bold text-gray-500 shrink-0">
                                      {i + 1}.
                                    </span>
                                    <span className="flex-1 text-sm font-medium text-gray-900">
                                      {a.item_text || '(empty)'}
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="text"
                                      autoComplete="off"
                                      spellCheck={false}
                                      maxLength={1}
                                      value={chosenLetter}
                                      onChange={(e) => {
                                        const letter =
                                          e.target.value.toUpperCase();
                                        const idx =
                                          letterToIndex(letter);

                                        const next = {
                                          ...(ans.matches ?? {}),
                                        };

                                        if (!letter) {
                                          delete next[String(i)];
                                          setAnswer(q.id, {
                                            matches: next,
                                          });
                                          return;
                                        }

                                        if (
                                          idx < 0 ||
                                          idx >=
                                            (q.column_b ?? []).length
                                        ) {
                                          return;
                                        }

                                        next[String(i)] = String(idx);
                                        setAnswer(q.id, {
                                          matches: next,
                                        });
                                      }}
                                      placeholder="?"
                                      className={`w-12 h-10 text-center text-base font-bold uppercase border-2 rounded focus:outline-none focus:border-black transition-colors ${
                                        chosenLetter
                                          ? 'border-black bg-white text-black'
                                          : 'border-gray-300 bg-white text-gray-400'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                              Column B — Answers
                            </p>
                            <div className="space-y-2">
                              {(q.column_b ?? []).map((b, i) => (
                                <div
                                  key={b.id}
                                  className="p-2 bg-gray-50 rounded-lg text-sm flex gap-2"
                                >
                                  <span className="font-bold text-gray-700 shrink-0">
                                    {letterOf(i)}.
                                  </span>
                                  <span className="text-gray-700">
                                    {b.item_text || '(empty)'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-500 mt-3">
                          {(q.column_a ?? []).filter(
                            (_, i) => (ans.matches ?? {})[String(i)]
                          ).length}{' '}
                          of {(q.column_a ?? []).length} matched
                          {(q.column_b ?? []).length > 0 &&
                            ` • type A–${letterOf(
                              (q.column_b ?? []).length - 1
                            )}`}
                          .
                        </p>
                      </div>
                    )}

                    {/* ---------------- fill in the blank ---------------- */}
                    {q.type === 'fill-blank' && (
                      <div className="ml-11">
                        <input
                          type="text"
                          value={ans.textAnswer ?? ''}
                          onChange={(e) =>
                            setAnswer(q.id, { textAnswer: e.target.value })
                          }
                          placeholder="Type your answer here..."
                          className="w-full max-w-md px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bottom submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 lg:pl-72 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            <strong>{answeredCount}</strong> of{' '}
            <strong>{totalQuestions}</strong> answered
          </p>
          <Button onClick={() => setShowConfirm(true)}>Submit Exam</Button>
        </div>
      </div>

      {/* Blur overlay */}
      {blurReason && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <WarningIcon className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Exam auto-submitted
            </h3>
            <p className="text-sm text-gray-600 mb-4">{blurReason}</p>
            <p className="text-xs text-gray-500 mb-6">
              All of your answers and the session video have been submitted
              successfully. You cannot retake this exam.
            </p>
            <Button
              fullWidth
              onClick={() => navigate('/candidate/exams')}
            >
              Back to Exams
            </Button>
          </Card>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && !blurReason && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Submit your exam?
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              You have answered <strong>{answeredCount}</strong> of{' '}
              <strong>{totalQuestions}</strong> questions.
            </p>
            {answeredCount < totalQuestions && (
              <p className="text-sm text-orange-600 mb-3">
                {totalQuestions - answeredCount} question
                {totalQuestions - answeredCount !== 1 ? 's' : ''}{' '}
                unanswered.
              </p>
            )}
            {recorder.status === 'recording' && (
              <p className="text-sm text-blue-600 mb-3 flex items-center gap-1.5">
                <VideoIcon className="w-4 h-4" />
                Recording will be submitted with your answers (
                {formatTime(recorder.elapsedSeconds)} captured).
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Once submitted, you cannot retrieve or change your answers.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Keep Working
              </Button>
              <Button
                fullWidth
                onClick={() => submitExam(false)}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TakeExam;