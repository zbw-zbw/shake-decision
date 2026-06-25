"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { Check, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Desktop: top-right */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm hidden sm:block">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
      {/* Mobile: bottom-center */}
      <div className="fixed bottom-6 left-4 right-4 z-[100] flex flex-col items-center gap-2 sm:hidden">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-[rgba(52,211,153,0.15)] border-[rgba(52,211,153,0.3)] text-[#34d399]",
  error: "bg-[rgba(244,114,182,0.15)] border-[rgba(244,114,182,0.3)] text-[#f472b6]",
  info: "bg-[rgba(79,70,229,0.15)] border-[rgba(79,70,229,0.3)] text-[#818cf8]",
};

const TypeIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case "success":
      return <Check className="w-4 h-4 shrink-0" />;
    case "error":
      return <X className="w-4 h-4 shrink-0" />;
    case "info":
      return <Info className="w-4 h-4 shrink-0" />;
  }
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      className={`animate-toast-in flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-md text-sm font-medium shadow-lg cursor-pointer ${typeStyles[toast.type]}`}
      onClick={onClose}
      role="alert"
    >
      <TypeIcon type={toast.type} />
      <span className="flex-1">{toast.message}</span>
    </div>
  );
}
