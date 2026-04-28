import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function Modal({ onClose, containerClassName = '', containerStyle = {}, children }) {
  useBodyScrollLock();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className={`w-full rounded-2xl overflow-hidden ${containerClassName}`}
        style={{ background: 'var(--color-bg-secondary)', ...containerStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
