import { CalendarClock, CircleHelp, Shuffle } from "lucide-react";
import { FeedbackBadge } from "../components/FeedbackBadge";
import { FieldError } from "../components/Fields";
import { InfoCard } from "../components/InfoCard";
import { OptionCard, handleRadioKeys } from "../components/OptionCard";
import { SliderInput } from "../components/SliderInput";
import { StepHeader } from "../components/StepHeader";
import { CYCLE_LENGTH_OPTIONS, CYCLE_RANGE } from "../constants";
import { getCycleFeedback } from "../lib/health";
import type { StepProps } from "../types";

const ICONS = { known: CalendarClock, unsure: CircleHelp, varies: Shuffle } as const;

export function StepCycleLength({ data, update, errors }: StepProps) {
  const length = data.cycleLength ?? CYCLE_RANGE.default;
  const feedback = getCycleFeedback(length);

  return (
    <div>
      <StepHeader
        step={2}
        title="How long is your menstrual cycle?"
        subtitle="A cycle is counted from the first day of one period to the first day of the next."
      />

      <div role="radiogroup" tabIndex={-1} onKeyDown={handleRadioKeys} aria-label="Cycle length" className="grid gap-2">
        {CYCLE_LENGTH_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            icon={ICONS[o.value]}
            selected={data.cycleLengthOption === o.value}
            inTabOrder={!data.cycleLengthOption || data.cycleLengthOption === o.value}
            onSelect={() =>
              update({
                cycleLengthOption: o.value,
                // Seed the slider with a sensible starting point the first time.
                ...(o.value === "known" && data.cycleLength === undefined ? { cycleLength: CYCLE_RANGE.default } : {}),
              })
            }
          />
        ))}
      </div>
      <FieldError message={errors.cycleLengthOption} />

      <div className="mt-3 space-y-2.5">
        {data.cycleLengthOption === "known" && (
          <div className="animate-expand space-y-2.5">
            <SliderInput
              id="cycle-length"
              label="Usual cycle length"
              value={length}
              min={CYCLE_RANGE.min}
              max={CYCLE_RANGE.max}
              ticks={[15, 21, 28, 35, 45, 60]}
              onChange={(cycleLength) => update({ cycleLength })}
              aside={<FeedbackBadge tone={feedback.tone} label={feedback.label} />}
            />
            <FieldError message={errors.cycleLength} />
            <InfoCard>
              Cycle length naturally varies. If yours is consistently outside the typical range, consider
              discussing it with a healthcare professional.
            </InfoCard>
          </div>
        )}
        {data.cycleLengthOption === "unsure" && (
          <InfoCard live>That's okay. We can estimate your cycle over time as you log more periods.</InfoCard>
        )}
        {data.cycleLengthOption === "varies" && (
          <InfoCard live title="Your cycle may not follow the same number of days every month.">
            Tracking several cycles can help reveal your personal pattern.
          </InfoCard>
        )}
      </div>
    </div>
  );
}
