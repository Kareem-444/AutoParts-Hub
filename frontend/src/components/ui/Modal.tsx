"use client";

import React, { useEffect } from "react";

type ModalType = "success" | "error" | "warning" | "confirm";

interface ModalOptions {
  title: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
}

interface ModalProps {
  isOpen: boolean;
  options: ModalOptions;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Modal({ isOpen, options, onConfirm, onCancel }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const { title, message, type, confirmText = "OK", cancelText = "Cancel" } = options;

  let icon = null;
  let iconColor = "";

  if (type === "success") {
    iconColor = "text-green-500 bg-green-100";
    icon = (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  } else if (type === "error") {
    iconColor = "text-red-500 bg-red-100";
    icon = (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  } else if (type === "warning" || type === "confirm") {
    iconColor = "text-yellow-500 bg-yellow-100";
    icon = (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full shrink-0 ${iconColor}`}>
              {icon}
            </div>
            <h3 className="text-xl font-bold text-text">{title}</h3>
          </div>
          <p className="text-text-muted mb-6">{message}</p>
          <div className="flex justify-end gap-3 rtl:flex-row-reverse">
            {type === "confirm" && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 text-text font-medium border border-border rounded-lg hover:bg-background transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:outline-none ${
                type === "error" ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" :
                type === "warning" ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500" :
                "bg-primary hover:bg-primary-dark focus:ring-primary"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
