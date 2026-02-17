'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'info' | 'success' | 'error';
  onClose: () => void;
}

export default function AlertDialog({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  variant = 'info',
  onClose,
}: AlertDialogProps) {
  const iconConfig = {
    info: { Icon: Info, bg: 'bg-blue-100', text: 'text-blue-600' },
    success: { Icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-600' },
    error: { Icon: AlertCircle, bg: 'bg-red-100', text: 'text-red-600' },
  };

  const buttonConfig = {
    info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20',
    error: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
  };

  const { Icon, bg, text } = iconConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 p-6 max-w-sm w-full pointer-events-auto"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center', bg, text)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              </div>

              {/* Message */}
              <p className="text-slate-600 mb-6 leading-relaxed whitespace-pre-line">{message}</p>

              {/* Action */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className={clsx('px-6 py-2.5 rounded-xl font-bold transition-all active:scale-[0.98]', buttonConfig[variant])}
                >
                  {buttonText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
