import { ProgressBar } from "../../../../shared/components/ui/ProgressBar.jsx";

export function CreateGroupFlowFooter({
  step,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  backDisabled = false,
  primaryDisabled = false,
  backLabel = "上一步",
  nextLabel = "下一步",
  submitLabel = "建立群組",
  className = "",
  innerClassName = "",
}) {
  const isLastStep = step === totalSteps - 1;
  const progress = (step + 1) / totalSteps;

  return (
    <footer
      className={[
        "shrink-0 border-t border-black/10 bg-white",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 sm:px-6 lg:px-10",
          innerClassName,
        ].join(" ")}
      >
        <ProgressBar
          value={progress}
          className="h-1.5 bg-black/6"
          fillClassName="bg-black"
        />

        <div className="grid grid-cols-3 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={backDisabled}
            className="inline-flex min-w-[108px] items-center justify-center rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {backLabel}
          </button>

          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={[
                  "rounded-full transition-all duration-300",
                  i === step ? "h-2 w-5 bg-black" : "h-2 w-2 bg-black/18",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={isLastStep ? onSubmit : onNext}
              disabled={primaryDisabled}
              className="inline-flex min-w-[132px] items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLastStep ? (isSubmitting ? "建立中..." : submitLabel) : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
