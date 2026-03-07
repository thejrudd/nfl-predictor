import { useState, useEffect } from 'react';

// Mobile + tablet top bar (hidden on lg+ via CSS — sidebar handles desktop nav)
export default function NavBar({ darkMode, onToggleDarkMode, onMenuOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 2);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <header
      className={`nav-bar${scrolled ? ' scrolled' : ''}`}
      style={{ justifyContent: 'space-between' }}
    >
      {/* Left: theme toggle */}
      <button
        onClick={onToggleDarkMode}
        className="nav-bar-btn"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Center: wordmark */}
      <div className="flex items-center gap-1.5">
        <span
          className="font-display font-bold text-sm"
          style={{ color: 'var(--color-label)', letterSpacing: '0.12em' }}
        >
          NFL
        </span>
        <span
          className="w-px h-3"
          style={{ background: 'var(--color-separator)' }}
        />
        <span
          className="font-display text-sm"
          style={{ color: 'var(--color-label-secondary)', letterSpacing: '0.10em' }}
        >
          PREDICTOR
        </span>
      </div>

      {/* Right: overflow menu (opens ActionSheet) */}
      <button
        onClick={onMenuOpen}
        className="nav-bar-btn"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>
    </header>
  );
}
