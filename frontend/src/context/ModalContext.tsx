"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";

type ModalType = "success" | "error" | "warning" | "confirm";

interface ModalOptions {
  title: string;
  message: string;
  type: ModalType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const showModal = useCallback((newOptions: ModalOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsOpen(false);
    // Slight delay to allow animation to complete
    setTimeout(() => {
      if (!isOpen) setOptions(null);
    }, 200);
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    if (options?.onConfirm) options.onConfirm();
    hideModal();
  }, [options, hideModal]);

  const handleCancel = useCallback(() => {
    if (options?.onCancel) options.onCancel();
    hideModal();
  }, [options, hideModal]);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {isOpen && options && (
        <Modal 
          isOpen={isOpen} 
          options={options} 
          onConfirm={handleConfirm} 
          onCancel={handleCancel} 
        />
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
