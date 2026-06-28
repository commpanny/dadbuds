import { ListChecks, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  buildQuizzes,
  quizValues,
  selectedCount,
  toggleSignal,
  validateCustomAnswer,
} from "../lib/personalityQuizzes";
import type { PersonalitySignals } from "../lib/storage";

type PersonalityQuizPromptProps = {
  signals: PersonalitySignals;
  onChange: (signals: PersonalitySignals) => void;
  onDismiss: () => void;
};

export default function PersonalityQuizPrompt({
  signals,
  onChange,
  onDismiss,
}: PersonalityQuizPromptProps) {
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const activeQuizzes = buildQuizzes(signals);
  const activeQuiz = activeQuizzes[activeQuizIndex] ?? activeQuizzes[0];
  const selected = quizValues(signals, activeQuiz);

  useEffect(() => {
    if (activeQuizIndex >= activeQuizzes.length) {
      setActiveQuizIndex(Math.max(0, activeQuizzes.length - 1));
    }
  }, [activeQuizIndex, activeQuizzes.length]);

  useEffect(() => {
    setCustomValue("");
    setCustomError(null);
  }, [activeQuizIndex]);

  function addCustomAnswer() {
    const errorMessage = validateCustomAnswer(customValue, activeQuiz, signals);
    if (errorMessage) {
      setCustomError(errorMessage);
      return;
    }
    onChange(toggleSignal(signals, activeQuiz, customValue.trim()));
    setCustomValue("");
    setCustomError(null);
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 w-[calc(100vw-2.5rem)] max-w-md rounded-lg border border-pencil/15 bg-sticky p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-moss">
            Quick preferences
          </p>
          <h2 className="mt-1 text-xl font-black">Tune your plan feed</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/68">
            Answer a few lightweight questions so DadBuds can make better
            suggestions.
          </p>
        </div>
        <button
          aria-label="Dismiss preference prompt"
          className="btn-ghost min-h-9 px-2 py-2"
          onClick={onDismiss}
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 rounded-md border border-pencil/10 bg-cream/70 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-md bg-pencil/10 px-2 py-1 text-xs font-black text-pencil">
            {activeQuiz.bucketLabel}
          </span>
          {activeQuiz.limit ? (
            <span className="text-xs font-black text-ink/52">
              {selected.length}/{activeQuiz.limit}
            </span>
          ) : null}
        </div>

        <p className="text-sm font-black">{activeQuiz.title}</p>
        <p className="mt-1 text-xs font-semibold text-ink/58">
          {activeQuiz.helper}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {activeQuiz.options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                className={`rounded-md border px-2 py-1 text-xs font-bold transition ${
                  active
                    ? "border-moss bg-moss/15 text-moss"
                    : "border-pencil/15 bg-paper text-ink/68 hover:border-moss/40"
                }`}
                key={option}
                onClick={() => onChange(toggleSignal(signals, activeQuiz, option))}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <label className="space-y-1">
            <span className="text-xs font-black text-ink/62">Add your own</span>
            <div className="flex gap-2">
              <input
                className="input min-h-10 bg-cream"
                maxLength={40}
                onChange={(event) => {
                  setCustomValue(event.target.value);
                  setCustomError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomAnswer();
                  }
                }}
                placeholder="Type an answer"
                value={customValue}
              />
              <button
                className="btn-secondary min-h-10 shrink-0 px-3 py-2"
                onClick={addCustomAnswer}
                type="button"
              >
                Add
              </button>
            </div>
          </label>
          {customError ? (
            <p className="mt-1 text-xs font-bold text-brick">{customError}</p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="btn-secondary min-h-10 px-3 py-2"
            onClick={() =>
              setActiveQuizIndex((current) =>
                current === 0 ? activeQuizzes.length - 1 : current - 1,
              )
            }
            type="button"
          >
            Back
          </button>
          <button
            className="btn-secondary min-h-10 px-3 py-2"
            onClick={() =>
              setActiveQuizIndex((current) =>
                current === activeQuizzes.length - 1 ? 0 : current + 1,
              )
            }
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-black text-ink/62">
          <ListChecks size={16} />
          {selectedCount(signals)} selected
        </span>
        <button
          className="btn-primary min-h-10 px-3 py-2"
          onClick={onDismiss}
          type="button"
        >
          Save for now
        </button>
      </div>
    </div>
  );
}
