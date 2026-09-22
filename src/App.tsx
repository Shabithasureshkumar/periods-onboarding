import { Clock } from "lucide-react";
import { useCallback, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { OnboardingLayout, PrivacyPill } from "./components/OnboardingLayout";
import { WelcomePage } from "./components/WelcomePage";
import { clearProgress, loadProgress, type OnboardingProgress } from "./lib/progress";
import { OnboardingFlow } from "./OnboardingFlow";
import type { OnboardingData, StepId } from "./types";

type View =
  | { name: "welcome" }
  | { name: "onboarding"; data?: OnboardingData; step?: StepId; completed?: readonly StepId[] }
  | { name: "dashboard"; data: OnboardingData };

export default function App() {
  const [view, setView] = useState<View>({ name: "welcome" });
  // Read once on mount. The welcome page stays in control — nothing auto-jumps into the flow.
  const [progress, setProgress] = useState<OnboardingProgress | null>(() => loadProgress());

  const open = useCallback((next: View) => {
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const startSetup = () => open({ name: "onboarding" });

  const resumeSetup = () => {
    if (!progress) return startSetup();
    open({ name: "onboarding", data: progress.data, step: progress.currentStep, completed: progress.completedSteps });
  };

  const startOver = () => {
    clearProgress();
    setProgress(null);
    open({ name: "onboarding" });
  };

  if (view.name === "welcome") {
    return <WelcomePage onGetStarted={startSetup} progress={progress} onResume={resumeSetup} onStartOver={startOver} />;
  }

  if (view.name === "dashboard") {
    return (
      <OnboardingLayout>
        <Dashboard data={view.data} onEditSetup={() => open({ name: "onboarding", data: view.data, step: 11 })} />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      mode="fixed"
      headerRight={
        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-1.5 text-body-sm font-medium text-ink-muted md:flex">
            <Clock className="size-3.5 text-rose" aria-hidden="true" />
            About 3 minutes
          </p>
          <PrivacyPill />
        </div>
      }
    >
      <OnboardingFlow
        // Remount when resuming so the flow starts from the provided data and step.
        key={view.step ? `resume-${view.step}` : "new"}
        initialData={view.data}
        initialStep={view.step ?? 1}
        initialCompleted={view.completed}
        onComplete={(data) => {
          // Integration point: persist `data` to the Mednevo backend here.
          setProgress(null);
          open({ name: "dashboard", data });
        }}
      />
    </OnboardingLayout>
  );
}
