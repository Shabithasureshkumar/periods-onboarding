import { Bell, CalendarHeart, Droplet, ListChecks, PencilLine, Sparkles, Target } from "lucide-react";
import { useMemo } from "react";
import { FERTILITY_GOAL_OPTIONS } from "../constants";
import { effectiveDuration, parseISODate } from "../lib/health";
import type { OnboardingData } from "../types";
import { Icon3D } from "./Icon3D";
import { InfoCard } from "./InfoCard";
import { secondaryBtn } from "./NavigationButtons";
import { GirlCharacter } from "./visuals/GirlCharacter";

const DAY = 86_400_000;
const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

interface CycleSnapshot {
  cycleDay: number;
  cycleLength: number;
  estimated: boolean;
  nextPeriod: Date;
  daysUntil: number;
  fertileStart: Date;
  fertileEnd: Date;
}

/** Calendar-based estimate only — refined in the real app as cycles are logged. */
function snapshot(data: OnboardingData): CycleSnapshot | undefined {
  const last = parseISODate(data.lastPeriod);
  if (!last) return undefined;
  const estimated = !(data.cycleLengthOption === "known" && data.cycleLength);
  const cycleLength = data.cycleLength && !estimated ? data.cycleLength : 28;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = Math.max(0, Math.round((today.getTime() - last.getTime()) / DAY));
  const cyclesPassed = Math.floor(since / cycleLength);
  const nextPeriod = new Date(last.getTime() + (cyclesPassed + 1) * cycleLength * DAY);
  const ovulation = new Date(nextPeriod.getTime() - 14 * DAY);
  return {
    cycleDay: (since % cycleLength) + 1,
    cycleLength,
    estimated,
    nextPeriod,
    daysUntil: Math.round((nextPeriod.getTime() - today.getTime()) / DAY),
    fertileStart: new Date(ovulation.getTime() - 5 * DAY),
    fertileEnd: new Date(ovulation.getTime() + DAY),
  };
}

interface DashboardProps {
  data: OnboardingData;
  onEditSetup: () => void;
}

export function Dashboard({ data, onEditSetup }: DashboardProps) {
  const snap = useMemo(() => snapshot(data), [data]);
  const duration = effectiveDuration(data);
  const goal = FERTILITY_GOAL_OPTIONS.find((g) => g.value === data.fertilityGoal)?.label;
  const tracking = [...data.symptoms, ...data.moods].filter((s) => s !== "Other").length;
  const r = 70;
  const C = 2 * Math.PI * r;
  const progress = snap ? snap.cycleDay / snap.cycleLength : 0;

  return (
    <div className="animate-fade-up pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-micro font-bold uppercase tracking-[0.16em] text-rose-ink">Cycle dashboard</p>
          <h1 className="mt-1 text-headline font-bold tracking-[-0.02em] text-ink">
            {data.name.trim() ? `Welcome, ${data.name.trim().split(/\s+/)[0]}` : "Welcome to your tracker"}
          </h1>
        </div>
        <button type="button" onClick={onEditSetup} className={secondaryBtn}>
          <PencilLine className="size-[18px]" aria-hidden="true" />
          Edit setup
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section aria-labelledby="today" className="relative overflow-hidden rounded-[24px] border border-blush-300 bg-white p-5 shadow-glass sm:p-7">
          <h2 id="today" className="text-lead font-semibold text-ink">Today</h2>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative size-[176px] shrink-0">
              <svg viewBox="0 0 176 176" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="88" cy="88" r={r} fill="none" stroke="#F8DDE7" strokeWidth="14" />
                <circle cx="88" cy="88" r={r} fill="none" stroke="#F34F97" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${C * progress} ${C}`} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-micro font-semibold uppercase tracking-[0.16em] text-ink-muted">Cycle day</p>
                  <p className="text-metric font-bold leading-none text-rose-ink tabular-nums">{snap?.cycleDay ?? "–"}</p>
                  <p className="text-caption font-medium text-ink-muted">of {snap?.cycleLength ?? 28}</p>
                </div>
              </div>
            </div>
            <dl className="grid w-full gap-3">
              <div className="flex items-center gap-3 rounded-[18px] bg-blush-50 p-3.5">
                <Icon3D icon={CalendarHeart} active size="sm" />
                <div>
                  <dt className="text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted">Next period (estimate)</dt>
                  <dd className="text-base font-bold text-ink">
                    {snap ? `${fmt(snap.nextPeriod)} · in ${snap.daysUntil} ${snap.daysUntil === 1 ? "day" : "days"}` : "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[18px] bg-blush-50 p-3.5">
                <Icon3D icon={Sparkles} size="sm" />
                <div>
                  <dt className="text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted">Estimated fertile window</dt>
                  <dd className="text-base font-bold text-ink">{snap ? `${fmt(snap.fertileStart)} – ${fmt(snap.fertileEnd)}` : "—"}</dd>
                </div>
              </div>
            </dl>
          </div>
          {snap?.estimated && (
            <InfoCard className="mt-5">Predictions use a 28-day estimate until you log a few cycles.</InfoCard>
          )}
          <InfoCard variant="disclaimer" className="mt-3">
            Estimates are based on calendar averages and are not a diagnosis or a method of contraception.
          </InfoCard>
        </section>

        <section aria-labelledby="setup" className="rounded-[24px] border border-blush-300 bg-gradient-to-br from-white via-[#FFFAFC] to-blush-50 p-5 shadow-glass sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <h2 id="setup" className="text-lead font-semibold text-ink">Your setup</h2>
            <div className="-mb-6 -mt-3 h-[150px] animate-character-float">
              <GirlCharacter decorative />
            </div>
          </div>
          <ul className="mt-2 grid gap-2.5">
            {[
              { icon: Droplet, label: "Period duration", value: duration ? `${duration} days` : "—" },
              { icon: ListChecks, label: "Tracking", value: tracking ? `${tracking} symptoms & moods` : "Nothing selected" },
              {
                icon: Bell,
                label: "Reminders",
                value: [data.periodReminder && "Period", data.ovulationReminder && "Ovulation"].filter(Boolean).join(" & ") || "Off",
              },
              { icon: Target, label: "Focus", value: goal ?? "—" },
            ].map(({ icon, label, value }) => (
              <li key={label} className="flex items-center gap-3 rounded-[18px] border border-line bg-white p-3">
                <Icon3D icon={icon} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-caption font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</span>
                  <span className="block truncate text-body font-semibold text-ink">{value}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
