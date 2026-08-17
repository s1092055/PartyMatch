import { ChevronUp } from "lucide-react";
import { useScrollY } from "../utils/hooks";

// 首頁 <html> 有 snap-y 搭配動態切換 mandatory/proximity（見 HomePage.jsx）：往頂部平滑
// 捲動途中如果剛好跨過切換的門檻，snap 類型在動畫進行到一半被換掉，Safari 會重新判定
// snap 目標，導致捲動被打斷、彈回去，回不到真正的最頂部。這裡在觸發捲動前先暫時拿掉
// snap 類型 class，等捲動真的停下來（一段時間沒有新的 scroll 事件）才還原，避免衝突
function scrollToTopSmoothly() {
  const root = document.documentElement;
  const removedClasses = ["snap-y", "snap-mandatory", "snap-proximity"].filter(c =>
    root.classList.contains(c)
  );
  if (removedClasses.length > 0) root.classList.remove(...removedClasses);

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (removedClasses.length === 0) return;
  let settleTimer;
  function onScroll() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(finish, 150);
  }
  function finish() {
    window.removeEventListener("scroll", onScroll);
    clearTimeout(settleTimer);
    root.classList.add(...removedClasses);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  settleTimer = setTimeout(finish, 150);
}

export default function ScrollToTop() {
  const scrollY = useScrollY();
  const visible = scrollY > 300;

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTopSmoothly}
      className="fixed right-6 bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-40 grid h-12 w-12 place-items-center rounded-full bg-surface border border-line text-ink-2 shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white can-hover:lg:bottom-24"
      aria-label="回到頂部"
    >
      <ChevronUp size={20} strokeWidth={1.5} />
    </button>
  );
}
