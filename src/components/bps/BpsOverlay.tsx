import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BPS_ANCESTRY, BPS_CONDITIONS, ageInYear, computeBps, primaryCode } from "@/lib/bps";
import { ConditionPicker } from "./ConditionPicker";
import {
  EMPTY_VALUES,
  ghostBtn,
  hasAnyAnswer,
  inputCls,
  labelCls,
  primaryBtn,
  type BpsValues,
} from "./shared";

const STEPS = ["intro", "sex", "birth", "ancestry", "conditions", "review"] as const;
type StepId = (typeof STEPS)[number];
const QUESTIONS = 4;

/**
 * Full-screen "Get started" flow: one question per screen. It collects the three
 * values that are live today (sex and age, ancestry, conditions) and hands the
 * answers back; saving to the account happens on the page.
 */
export function BpsOverlay({
  open,
  onOpenChange,
  initial,
  onComplete,
  onSaveDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: BpsValues;
  onComplete: (values: BpsValues) => void;
  onSaveDraft: (values: BpsValues) => void;
}) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<BpsValues>(EMPTY_VALUES);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [fromReview, setFromReview] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(initial);
    setIndex(hasAnyAnswer(initial) ? 1 : 0);
    setError("");
    setLeaving(false);
    setFromReview(false);
    // Only reset when the overlay opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const step: StepId = STEPS[index];
  const year = Number(values.birthYear);
  const yearShape = /^\d{4}$/.test(values.birthYear);
  const age = yearShape ? ageInYear(year) : NaN;

  const preview = useMemo(() => {
    const primary = values.sex && yearShape ? primaryCode(values.sex, age) : null;
    const result = computeBps({
      sex: values.sex,
      birthYear: yearShape ? year : null,
      ancestry: values.ancestry,
      conditions: values.conditions,
    });
    return { primary, result };
  }, [values, yearShape, year, age]);

  function patch(next: Partial<BpsValues>) {
    setValues((v) => ({ ...v, ...next }));
    setError("");
  }

  function go(to: number) {
    setError("");
    setIndex(to);
  }

  function next() {
    if (step === "sex" && !values.sex) return setError("Choose one option to continue.");
    if (step === "birth") {
      if (!yearShape) return setError("Enter a four-digit year of birth, for example 1990.");
      if (age < 18) return setError("BPS profiles are for adults, 18 and over.");
      if (age > 110) return setError("Check the year. It looks too early.");
    }
    if (fromReview && step !== "intro") {
      setFromReview(false);
      return go(STEPS.indexOf("review"));
    }
    go(index + 1);
  }

  function back() {
    setFromReview(false);
    go(Math.max(0, index - 1));
  }

  function skipAncestry() {
    patch({ ancestry: null });
    if (fromReview) {
      setFromReview(false);
      return go(STEPS.indexOf("review"));
    }
    go(index + 1);
  }

  function edit(id: StepId) {
    setFromReview(true);
    go(STEPS.indexOf(id));
  }

  function finish() {
    onComplete(values);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      if (leaving) return setLeaving(false);
      if (index > 0) return setLeaving(true);
    }
    onOpenChange(nextOpen);
  }

  const questionNumber = index >= 1 && index <= QUESTIONS ? index : null;
  const progress = Math.min(index, QUESTIONS + 1) / (QUESTIONS + 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 p-0 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sm sm:border sm:border-[color:var(--color-hairline)]"
        aria-describedby="bps-overlay-desc"
      >
        <div className="flex items-center gap-4 border-b border-[color:var(--color-hairline)] px-6 py-4 pr-14">
          <div
            className="h-[3px] flex-1 bg-[color:var(--color-hairline)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={QUESTIONS}
            aria-valuenow={Math.min(index, QUESTIONS)}
            aria-label="Progress"
          >
            <div
              className="h-full bg-foreground transition-[width] duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {leaving
              ? "Paused"
              : questionNumber
                ? `Question ${questionNumber} of ${QUESTIONS}`
                : step === "review"
                  ? "Review"
                  : "Start"}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
          {leaving ? (
            <div className="space-y-6">
              <DialogTitle className="text-3xl font-semibold leading-tight">
                Leave without finishing?
              </DialogTitle>
              <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                Your answers so far can stay on this device for this visit, so you can pick up where
                you stopped.
              </DialogDescription>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" className={primaryBtn} onClick={() => setLeaving(false)}>
                  Keep going
                </button>
                <button
                  type="button"
                  className={ghostBtn}
                  onClick={() => {
                    onSaveDraft(values);
                    setLeaving(false);
                    onOpenChange(false);
                  }}
                >
                  Save and close
                </button>
                <button
                  type="button"
                  className={ghostBtn}
                  onClick={() => {
                    setLeaving(false);
                    onOpenChange(false);
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {step === "intro" && (
                <>
                  <p className={labelCls}>BPS Profile</p>
                  <DialogTitle className="text-4xl font-semibold leading-tight">
                    Before we start
                  </DialogTitle>
                  <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                    Four short questions. Skip ancestry if you prefer not to say, and leave
                    conditions empty if none apply.
                  </DialogDescription>
                  <ul className="max-w-md list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Your answers are health information.</li>
                    <li>Until you save to an account they stay in this browser.</li>
                    <li>Only you and Moringa&apos;s admins can see a saved profile.</li>
                  </ul>
                </>
              )}

              {step === "sex" && (
                <>
                  <DialogTitle className="text-3xl font-semibold leading-tight">
                    Which reference group fits you?
                  </DialogTitle>
                  <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                    Biological sex, used for reference values such as body fat and muscle mass.
                  </DialogDescription>
                  <div className="grid max-w-md gap-3" role="radiogroup" aria-label="Sex">
                    {(["female", "male"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={values.sex === s}
                        onClick={() => patch({ sex: s })}
                        className={`rounded-sm border px-5 py-4 text-left text-base capitalize transition-colors ${
                          values.sex === s
                            ? "border-foreground bg-foreground/10"
                            : "border-[color:var(--color-hairline)] [@media(hover:hover)]:hover:border-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === "birth" && (
                <>
                  <DialogTitle className="text-3xl font-semibold leading-tight">
                    <label htmlFor="bps-birth-year">What year were you born?</label>
                  </DialogTitle>
                  <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                    This sets your age band. BPS profiles are for adults, 18 and over.
                  </DialogDescription>
                  <input
                    id="bps-birth-year"
                    autoFocus
                    inputMode="numeric"
                    maxLength={4}
                    value={values.birthYear}
                    onChange={(e) => patch({ birthYear: e.target.value.replace(/\D/g, "") })}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="1990"
                    aria-invalid={!!error}
                    aria-describedby={error ? "bps-overlay-error" : undefined}
                    className={`${inputCls} max-w-[10rem] font-mono text-2xl`}
                  />
                </>
              )}

              {step === "ancestry" && (
                <>
                  <DialogTitle className="text-3xl font-semibold leading-tight">
                    <label htmlFor="bps-ancestry">Which ancestry fits best?</label>
                  </DialogTitle>
                  <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                    Optional. Ancestry can affect how you process some nutrients. Choose the closest
                    match.
                  </DialogDescription>
                  <select
                    id="bps-ancestry"
                    value={values.ancestry ?? ""}
                    onChange={(e) =>
                      patch({ ancestry: e.target.value ? Number(e.target.value) : null })
                    }
                    className={`${inputCls} max-w-sm`}
                  >
                    <option value="">Choose the closest match</option>
                    {BPS_ANCESTRY.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {step === "conditions" && (
                <>
                  <DialogTitle className="text-3xl font-semibold leading-tight">
                    Do any health conditions apply?
                  </DialogTitle>
                  <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                    Optional. Select all that apply, or continue with none selected.
                  </DialogDescription>
                  <ConditionPicker
                    value={values.conditions}
                    onChange={(conditions) => patch({ conditions })}
                  />
                </>
              )}

              {step === "review" && (
                <>
                  <DialogTitle className="text-3xl font-semibold leading-tight">
                    Check your answers
                  </DialogTitle>
                  <DialogDescription id="bps-overlay-desc" className="max-w-md text-base">
                    {preview.result
                      ? `Your profile is BPS ${preview.result.code}.`
                      : preview.primary
                        ? `Your first value is BPS ${preview.primary}. Add your ancestry for the full code.`
                        : "Add your sex and year of birth to see your profile."}
                  </DialogDescription>
                  <dl className="max-w-md divide-y divide-[color:var(--color-hairline)] border-y border-[color:var(--color-hairline)]">
                    <ReviewRow
                      term="Sex"
                      value={values.sex ? (values.sex === "male" ? "Male" : "Female") : null}
                      onEdit={() => edit("sex")}
                    />
                    <ReviewRow
                      term="Year of birth"
                      value={yearShape ? values.birthYear : null}
                      onEdit={() => edit("birth")}
                    />
                    <ReviewRow
                      term="Ancestry"
                      value={BPS_ANCESTRY.find((a) => a.code === values.ancestry)?.label ?? null}
                      onEdit={() => edit("ancestry")}
                    />
                    <ReviewRow
                      term="Conditions"
                      value={
                        values.conditions.length
                          ? values.conditions
                              .map((k) => BPS_CONDITIONS.find((c) => c.key === k)?.label ?? k)
                              .join(", ")
                          : "None selected"
                      }
                      onEdit={() => edit("conditions")}
                    />
                  </dl>
                </>
              )}

              <p id="bps-overlay-error" role="alert" className="min-h-5 text-sm text-destructive">
                {error}
              </p>
            </div>
          )}
        </div>

        {!leaving && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-hairline)] px-6 py-4 sm:px-10">
            {index > 0 ? (
              <button type="button" className={ghostBtn} onClick={back}>
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center gap-3">
              {step === "ancestry" && (
                <button type="button" className={ghostBtn} onClick={skipAncestry}>
                  Prefer not to say
                </button>
              )}
              {step === "review" ? (
                <button type="button" className={primaryBtn} onClick={finish}>
                  See my profile
                </button>
              ) : (
                <button type="button" className={primaryBtn} onClick={next}>
                  {step === "intro"
                    ? "Agree and start"
                    : step === "conditions"
                      ? "Review"
                      : "Continue"}
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({
  term,
  value,
  onEdit,
}: {
  term: string;
  value: string | null;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="flex items-start gap-3 text-right text-sm">
        <span className={value ? "" : "text-muted-foreground"}>{value ?? "Not provided"}</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4 [@media(hover:hover)]:hover:text-foreground"
        >
          Edit
        </button>
      </dd>
    </div>
  );
}
