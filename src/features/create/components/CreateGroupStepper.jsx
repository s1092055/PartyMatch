import { Check } from "lucide-react";

export default function CreateGroupStepper({ steps, current }) {
  return (
    <div className="mb-6 flex items-center">
      {steps.map(({ n, label }, i) => {
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? "bg-brand text-white"
                    : active
                      ? "bg-brand text-white ring-4 ring-brand-subtle"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </div>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  active
                    ? "text-brand"
                    : done
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-5 mx-2 h-0.5 flex-1 rounded-full transition-colors ${
                  done ? "bg-brand" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
