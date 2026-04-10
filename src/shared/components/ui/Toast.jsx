import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ToastContext } from "./ToastContext.js";

const MotionDiv = motion.div;

const TOAST_DURATION = 3000;

const ICONS = {
  success: <CheckCircleIcon className="h-5 w-5 text-[#16a34a]" />,
  error: <ExclamationCircleIcon className="h-5 w-5 text-[#dc2626]" />,
  info: <ExclamationCircleIcon className="h-5 w-5 text-black" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[9999] flex flex-col items-center gap-2 px-4 sm:top-[calc(env(safe-area-inset-top)+5rem)]">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <MotionDiv
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto flex max-w-[min(92vw,32rem)] items-center gap-2.5 rounded-2xl border border-black/8 bg-white px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-md"
            >
              {ICONS[toast.type] ?? ICONS.info}
              <span className="text-sm font-medium text-black/85">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-1 rounded-full p-0.5 text-black/30 transition hover:text-black/60"
                aria-label="關閉通知"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </MotionDiv>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
