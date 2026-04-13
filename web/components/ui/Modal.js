"use client";

import { useEffect, useRef } from "react";

export default function Modal({ open, onClose, title, children, wide = false }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`bg-dd-surface border border-dd-border rounded-xl shadow-2xl w-full mb-8 animate-in fade-in slide-in-from-top-4 duration-200 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-dd-border">
          <h2 className="text-base font-semibold text-dd-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-dd-text-secondary hover:bg-dd-purple-50 hover:text-dd-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
