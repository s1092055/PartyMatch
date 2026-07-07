import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () =>
      window.removeEventListener("scroll", onScroll, { passive: true });
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-white border border-line text-ink-2 shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white active:scale-[0.96] md:bottom-24"
      aria-label="回到頂部"
    >
      <ArrowUp size={20} />
    </button>
  );
}
