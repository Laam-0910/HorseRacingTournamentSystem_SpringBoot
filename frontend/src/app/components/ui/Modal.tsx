import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#151310] border border-white/5 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white text-base transition"
        >
          ✕
        </button>
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
