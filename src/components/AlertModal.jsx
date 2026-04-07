import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const AlertContext = createContext(null);

// Module-level singleton — lets non-hook code (e.g. UserContext socket callbacks) show alerts
let _globalShowAlert = null;
export const showGlobalAlert = (opts) => _globalShowAlert?.(opts);

// ----- Modal Component -------------------------------------------------------
const ICON_MAP = {
  error: {
    bg: "bg-red-100",
    icon: "ri-error-warning-fill",
    color: "text-red-500",
    btn: "bg-red-500 hover:bg-red-600",
    border: "border-red-200",
    title: "Error",
  },
  warning: {
    bg: "bg-amber-100",
    icon: "ri-alert-fill",
    color: "text-amber-500",
    btn: "bg-amber-500 hover:bg-amber-600",
    border: "border-amber-200",
    title: "Warning",
  },
  info: {
    bg: "bg-blue-100",
    icon: "ri-information-fill",
    color: "text-blue-500",
    btn: "bg-blue-500 hover:bg-blue-600",
    border: "border-blue-200",
    title: "Info",
  },
  success: {
    bg: "bg-green-100",
    icon: "ri-checkbox-circle-fill",
    color: "text-green-500",
    btn: "bg-green-500 hover:bg-green-600",
    border: "border-green-200",
    title: "Success",
  },
};

const AlertModal = ({ isOpen, message, title, type = "info", onClose }) => {
  const styles = ICON_MAP[type] || ICON_MAP.info;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Card */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full border ${styles.border} overflow-hidden
          animate-[modal-pop_0.18s_cubic-bezier(0.34,1.56,0.64,1)_both]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full ${styles.btn.split(" ")[0]}`} />

        <div className="p-5">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${styles.bg} flex items-center justify-center flex-shrink-0`}>
              <i className={`${styles.icon} text-xl ${styles.color}`} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight">
              {title || styles.title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-gray-600 text-sm leading-relaxed pl-[52px]">
            {message}
          </p>

          {/* Button */}
          <div className="flex justify-end mt-5">
            <button
              onClick={onClose}
              autoFocus
              className={`${styles.btn} text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors active:scale-95`}
            >
              OK
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);   }
        }
      `}</style>
    </div>
  );
};

// ----- Provider ---------------------------------------------------------------
export const AlertProvider = ({ children }) => {
  const [state, setState] = useState({ isOpen: false, message: "", title: "", type: "info" });
  const resolveRef = useRef(null);

  const showAlert = useCallback(({ message, title, type = "info" }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ isOpen: true, message, title, type });
    });
  }, []);

  // Register singleton so non-hook code can reach this
  useEffect(() => {
    _globalShowAlert = showAlert;
    return () => { _globalShowAlert = null; };
  }, [showAlert]);

  const closeAlert = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={state.isOpen}
        message={state.message}
        title={state.title}
        type={state.type}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  );
};

// ----- Hook -------------------------------------------------------------------
export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used inside <AlertProvider>");

  const { showAlert } = ctx;

  return {
    showAlert,
    /** Shorthand helpers */
    alertError:   (message, title) => showAlert({ message, title: title || "Error",   type: "error"   }),
    alertWarning: (message, title) => showAlert({ message, title: title || "Warning", type: "warning" }),
    alertInfo:    (message, title) => showAlert({ message, title: title || "Info",    type: "info"    }),
    alertSuccess: (message, title) => showAlert({ message, title: title || "Success", type: "success" }),
  };
};

export default AlertModal;
