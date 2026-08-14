import { ChevronUp } from "lucide-react";
import { useScrollY } from "../utils/hooks";

export default function ScrollToTop() {
  const scrollY = useScrollY();
  const visible = scrollY > 300;

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-6 bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-40 grid h-12 w-12 place-items-center rounded-full bg-surface border border-line text-ink-2 shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white can-hover:lg:bottom-24"
      aria-label="回到頂部"
    >
      <ChevronUp size={20} strokeWidth={1.5} />
    </button>
  );
}
