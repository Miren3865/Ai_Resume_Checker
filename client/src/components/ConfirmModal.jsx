import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({
  message,
  subMessage,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  iconType = 'delete',
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(2,2,18,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        <motion.div
          className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(239,68,68,0.35)',
            boxShadow: '0 0 40px rgba(239,68,68,0.15), 0 25px 60px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.92, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ duration: 0.28, type: 'spring', bounce: 0.22 }}
        >
        {/* Top accent bar */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg,#ef4444,#ec4899)' }} />

        <div className="px-7 py-6">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {iconType === 'logout' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
          </div>

          {/* Text */}
          <h3
            className="text-base font-bold text-center mb-1"
            style={{ color: '#f1e8ff' }}
          >
            {message}
          </h3>
          {subMessage && (
            <p className="text-sm text-center mb-5" style={{ color: '#8b8aa0' }}>
              {subMessage}
            </p>
          )}
          {!subMessage && <div className="mb-5" />}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0a0c0',
                cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg,#ef4444,#ec4899)',
                border: '1px solid rgba(239,68,68,0.4)',
                boxShadow: '0 0 16px rgba(239,68,68,0.3)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}
