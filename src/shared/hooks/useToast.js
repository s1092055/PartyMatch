import { useContext } from "react";
import { ToastContext } from "../components/ui/ToastContext.js";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast 必須在 ToastProvider 內使用");
  }
  return context;
}
