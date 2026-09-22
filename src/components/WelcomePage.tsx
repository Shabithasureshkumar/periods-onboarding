import { ArrowRight, ChartColumn, Check, Droplet, Droplets, Heart, Smile, Sparkles, Sprout, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { STEPS, TOTAL_STEPS } from "../constants";
import { cn } from "../lib/cn";
import { progressPercentOf, type OnboardingProgress } from "../lib/progress";
import { primaryBtn } from "./NavigationButtons";
import { OnboardingLayout } from "./OnboardingLayout";
import { StartOverDialog } from "./StartOverDialog";
import { GirlCharacter } from "./visuals/GirlCharacter";
import { SceneCanvas } from "./visuals/primitives";

interface WelcomePageProps {
  /** Opens Step 1 of the existing onboarding flow. */
  onGetStarted: () => void;
  /** Saved setup progress, when the user left part-way through. */
  progress?: OnboardingProgress | null;
  /** Continues from the saved step. */
  onResume?: () => void;
  /** Clears saved progress and starts from Step 1. */
  onStartOver?: () => void;
}

/**
 * Optional hero photo (a realistic adult woman using a smartphone). Add
 * `src/assets/welcome/hero-woman.webp` (or `.png`) and it is bundled and used automatically; until then
 * the approved Mednevo guide is shown in the same spot. Discovered at build time, so a missing photo
 * never costs a failed network request or a flash of the fallback.
 */
const HERO_PHOTO_FILES = import.meta.glob<string>("../assets/welcome/hero-woman.{webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
});
const HERO_PHOTO_SRC: string | undefined =
  HERO_PHOTO_FILES["../assets/welcome/hero-woman.webp"] ?? HERO_PHOTO_FILES["../assets/welcome/hero-woman.png"];

/** Pastel icon tones — soft rose, lavender-pink and lilac; never bright pink. */
const TONES = {
  rose: "bg-[#FFF0F5] text-[#E95A94]",
  lavender: "bg-[#F9EEFA] text-[#C567B8]",
  lilac: "bg-[#F3EFFC] text-[#9A7FD6]",
} as const;
type Tone = keyof typeof TONES;

const FEATURES: { icon: LucideIcon; tone: Tone; title: string; text: string }[] = [
  { icon: Droplets, tone: "rose", title: "Track Your Cycle", text: "Follow periods, cycle days and phases." },
  { icon: Smile, tone: "lavender", title: "Log Symptoms & Mood", text: "Record how you feel throughout your cycle." },
  { icon: ChartColumn, tone: "lilac", title: "Understand Your Patterns", text: "See trends and personalized cycle insights." },
  { icon: Heart, tone: "rose", title: "Personalize Your Goals", text: "Choose fertility and wellness tracking that fits you." },
];

/* ------------------------------------------------------------------ */
/* Hero visual — one 640×460 composition scaled to its column, so the  */
/* floating cards can never leave the visual or overlap the text.      */
/* ------------------------------------------------------------------ */
const floatCard = "absolute rounded-xl border border-card-border bg-white shadow-glass";

function FloatingLabel({ icon: Icon, tone, label, className, delay }: { icon: LucideIcon; tone: Tone; label: string; className: string; delay: string }) {
  return (
    <div className={cn(floatCard, "flex animate-drift items-center gap-2 py-2 pl-2 pr-3", className)} style={{ animationDelay: delay }}>
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", TONES[tone])}>
        <Icon className="size-3.5" strokeWidth={2.2} />
      </span>
      <span className="max-w-[84px] text-[12px] font-semibold leading-tight text-ink">{label}</span>
    </div>
  );
}

function MyCycleCard() {
  const month = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const kind = (d: number) => (d <= 5 ? "period" : d >= 8 && d <= 13 ? "fertile" : d === 14 ? "ovulation" : "none");
  return (
    <div className={cn(floatCard, "left-[424px] top-[40px] w-[196px] animate-drift rounded-2xl p-3.5")} style={{ animationDelay: "0.8s" }}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink">My Cycle</p>
        <span className="text-[10px] font-medium text-ink-muted">{month}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-7 gap-1 text-center text-[8.5px] font-semibold text-ink-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
        {Array.from({ length: 21 }, (_, i) => {
          const d = i + 1;
          const k = kind(d);
          return (
            <span
              key={d}
              className={cn(
                "grid aspect-square place-items-center rounded-[6px] text-[8.5px] font-semibold",
                k === "period" && "bg-[#FFE8F1] text-[#E95A94]",
                k === "fertile" && "bg-[#F1ECFC] text-[#8E72D2]",
                k === "ovulation" && "bg-[#E8F6EE] text-[#4FA67A]",
                k === "none" && "bg-[#F7F3F5] text-ink-muted",
              )}
            >
              {k === "period" ? <Droplet className="size-2.5 fill-current" strokeWidth={0} /> : k === "ovulation" ? <Sprout className="size-2.5" strokeWidth={2.4} /> : d}
            </span>
          );
        })}
      </div>
      <div className="mt-2.5 flex gap-3 text-[9px] font-medium text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#E95A94]" />
          Period
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#9A7FD6]" />
          Fertile
        </span>
      </div>
    </div>
  );
}

/** The hero photo when it exists, otherwise the approved guide — same position and scale either way. */
function HeroPortrait() {
  const [photoFailed, setPhotoFailed] = useState(false);
  if (!HERO_PHOTO_SRC || photoFailed) {
    return (
      <div className="absolute bottom-[14px] left-[178px] h-[430px] animate-drift [animation-duration:9s]">
        <GirlCharacter decorative />
      </div>
    );
  }
  return (
    <div className="absolute left-[176px] top-[14px] h-[404px] w-[288px] animate-drift overflow-hidden rounded-b-[4px] [animation-duration:9s]">
      <img src={HERO_PHOTO_SRC} alt="" decoding="async" draggable={false} onError={() => setPhotoFailed(true)} className="size-full select-none object-cover object-top" />
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      className="relative aspect-[640/476] w-full"
      role="img"
      aria-label="Cycle tracking preview: period tracking, symptom logging, pattern insights and a monthly cycle calendar"
    >
      <SceneCanvas mode="landscape">
        {/* Soft pink circular gradient behind the portrait */}
        <div className="absolute left-[40px] top-[8px] h-[412px] w-[530px] rounded-full bg-[radial-gradient(ellipse_at_50%_45%,#FFDDEA_0%,#FFE8F0_55%,#FFF2F6_100%)]" />
        <HeroPortrait />
        <FloatingLabel icon={Droplets} tone="rose" label="Track Periods" className="left-[68px] top-[48px]" delay="0s" />
        <FloatingLabel icon={Smile} tone="rose" label="Log Symptoms" className="left-[6px] top-[182px]" delay="1.4s" />
        <FloatingLabel icon={Heart} tone="rose" label="Understand Patterns" className="left-[14px] top-[296px]" delay="0.6s" />
        <FloatingLabel icon={ChartColumn} tone="lilac" label="Personalized Insights" className="left-[512px] top-[282px]" delay="2s" />
        <MyCycleCard />
        <div className={cn(floatCard, "left-[446px] top-[356px] flex w-[136px] animate-drift items-center gap-2 px-2.5 py-2")} style={{ animationDelay: "1s" }}>
          <Sparkles className="size-3.5 shrink-0 text-[#E95A94]" aria-hidden="true" />
          <span className="text-[11px] font-semibold leading-tight text-[#E95A94]">Insights designed around you</span>
        </div>
      </SceneCanvas>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page — hero + four feature cards, nothing else                      */
/* ------------------------------------------------------------------ */
export function WelcomePage({ onGetStarted, progress, onResume, onStartOver }: WelcomePageProps) {
  const [confirmingStartOver, setConfirmingStartOver] = useState(false);
  const resumeStep = progress ? STEPS[progress.currentStep - 1] : undefined;

  return (
    <OnboardingLayout headerRight={null} background="plain">
      <section
        aria-labelledby="welcome-title"
        className="grid items-center gap-8 pb-8 pt-2 sm:pt-4 md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] md:gap-6 lg:gap-10 lg:pb-14"
      >
        <div className="animate-fade-up">
          <p className="text-caption font-semibold uppercase tracking-[0.16em] text-rose-ink">Your cycle, your way</p>
          <h1 id="welcome-title" className="mt-3 whitespace-nowrap text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-ink min-[360px]:text-[36px] min-[400px]:text-[40px] md:text-[34px] lg:text-[46px] xl:text-[54px]">
            <span className="block">Welcome to Your</span>
            <span className="block text-[#F06AA6]">Cycle Tracker</span>
          </h1>
          <p className="mt-4 max-w-[430px] text-pretty text-lead leading-relaxed text-ink-sub lg:text-base">
            Understand your cycle, track what matters to you, and get personalized insights along the way.
          </p>
          {progress && resumeStep ? (
            <>
              {/* Compact resume card — the page itself is unchanged, only the CTA area adapts. */}
              <div className="mt-6 max-w-[430px] rounded-2xl border border-card-border bg-white p-4 shadow-feature">
                <p className="text-caption font-semibold uppercase tracking-[0.14em] text-rose-ink">Welcome back</p>
                <p className="mt-1 text-lead font-bold text-ink">
                  You&apos;re on Step {progress.currentStep} of {TOTAL_STEPS}
                </p>
                <p className="text-body-sm text-ink-muted">{resumeStep.label}</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-blush-200" aria-hidden="true">
                    <span
                      className="block h-full origin-left rounded-full bg-brand transition-transform duration-700"
                      style={{ transform: `scaleX(${progressPercentOf(progress) / 100})` }}
                    />
                  </span>
                  <span className="text-caption font-semibold tabular-nums text-rose-ink">{progressPercentOf(progress)}% complete</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2.5 min-[420px]:flex-row min-[420px]:items-center">
                <button type="button" onClick={onResume} className={cn(primaryBtn, "w-full min-[420px]:w-auto min-[420px]:min-w-[190px]")}>
                  Resume Journey
                  <ArrowRight className="size-[18px]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingStartOver(true)}
                  className="min-h-11 rounded-xl px-3 text-body font-semibold text-ink-soft transition-colors duration-200 hover:bg-hover-bg hover:text-rose-ink focus-ring"
                >
                  Start Over
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={onGetStarted} className={cn(primaryBtn, "mt-7 w-full min-[420px]:w-auto min-[420px]:min-w-[170px]")}>
                Get Started
                <ArrowRight className="size-[18px]" aria-hidden="true" />
              </button>
              <p className="mt-4 flex items-center gap-1.5 text-body-sm text-ink-muted">
                <Check className="size-3.5 text-[#4FA67A]" strokeWidth={2.6} aria-hidden="true" />
                You can change your preferences anytime.
              </p>
            </>
          )}
        </div>

        <div className="animate-fade-in [animation-delay:150ms]">
          <HeroVisual />
        </div>
      </section>

      <section aria-labelledby="features-title" className="pb-10 lg:pb-12">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-rose-ink">Made for your wellbeing</p>
        <h2 id="features-title" className="mt-2 text-section font-bold tracking-[-0.02em] text-ink">
          Make tracking work for you
        </h2>
        <p className="mt-1.5 text-body text-ink-sub">Choose what matters to you and personalize your experience.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-card-border bg-white px-5 py-4 shadow-feature transition-[background-color,border-color,box-shadow] duration-200 ease-out hover:border-hover-border hover:bg-hover-bg hover:shadow-glass"
            >
              <span className={cn("grid size-10 place-items-center rounded-xl", TONES[f.tone])} aria-hidden="true">
                <f.icon className="size-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-lead font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-body-sm leading-relaxed text-ink-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <StartOverDialog
        open={confirmingStartOver}
        onCancel={() => setConfirmingStartOver(false)}
        onConfirm={() => {
          setConfirmingStartOver(false);
          onStartOver?.();
        }}
      />
    </OnboardingLayout>
  );
}
