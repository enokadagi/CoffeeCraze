import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-espresso/90 backdrop-blur-sm" onClick={onCancel} />
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] w-full max-w-sm relative z-10 border border-espresso/10 shadow-premium p-6 sm:p-8 text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-100' : 'bg-cream'}`}>
          <AlertTriangle size={24} className={variant === 'danger' ? 'text-red-500' : 'text-caramel'} />
        </div>
        <h3 className="text-xl font-display font-black uppercase italic tracking-tightest text-espresso mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onCancel} className="px-6 py-3 font-black uppercase tracking-widest italic text-espresso border border-espresso/20 rounded-full hover:bg-espresso/5 transition-colors text-sm">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-6 py-3 font-black uppercase tracking-widest italic rounded-full text-sm transition-colors ${
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-espresso text-cream hover:bg-espresso/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
        <button onClick={onCancel} aria-label="Close dialog" className="absolute top-4 right-4 p-1 text-text-muted hover:text-espresso transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
