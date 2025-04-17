// Modal.tsx
'use client';

import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ children, onClose }: ModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-5xl rounded-lg bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <div className="max-h-[90vh] overflow-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
