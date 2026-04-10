import { useEffect } from "react";

const ATTR = "data-modal-count";

export function useModalOpen() {
  useEffect(() => {
    const current = parseInt(document.body.getAttribute(ATTR) ?? "0", 10);
    document.body.setAttribute(ATTR, String(current + 1));
    return () => {
      const next = parseInt(document.body.getAttribute(ATTR) ?? "1", 10) - 1;
      if (next <= 0) {
        document.body.removeAttribute(ATTR);
      } else {
        document.body.setAttribute(ATTR, String(next));
      }
    };
  }, []);
}
