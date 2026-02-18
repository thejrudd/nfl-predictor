import { useState, useEffect, useRef } from 'react';
import { usePredictions } from '../context/PredictionContext';
import { exportAsImage } from '../utils/exportImport';
import ShareableImage from './ShareableImage';

const SECTION_LABELS = {
  bestWorst: 'Best & Worst Teams',
  playoffSeeds: 'Playoff Seeds',
  divisionWinners: 'Division Winners',
  conferenceShowdown: 'Conference Showdown',
  toughestDivision: 'Toughest Division',
  boldPredictions: 'Bold Predictions',
};

const ExportPreview = ({ teams, onClose }) => {
  const { predictions } = usePredictions();
  const imageRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [userName, setUserName] = useState('');
  const [enabledSections, setEnabledSections] = useState({
    bestWorst: true,
    playoffSeeds: true,
    divisionWinners: true,
    conferenceShowdown: true,
    toughestDivision: true,
    boldPredictions: true,
  });

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const toggleSection = (key) => {
    setEnabledSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async () => {
    if (!imageRef.current) return;
    setDownloading(true);
    // Small delay to ensure latest render is captured
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await exportAsImage(imageRef.current);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
    setDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-display tracking-wide">EXPORT IMAGE</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none"
            aria-label="Close export preview"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Preview — scaled to fit */}
            <div className="flex-1 flex items-start justify-center">
              <div className="w-full max-w-[540px]">
                <div style={{ aspectRatio: '1/1', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1080 }}>
                      <ShareableImage
                        ref={imageRef}
                        predictions={predictions}
                        teams={teams}
                        enabledSections={enabledSections}
                        userName={userName}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="lg:w-64 space-y-4">
              {/* User name input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Your Name / Handle
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. @thejrudd"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Section toggles */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sections
                </label>
                <div className="space-y-2">
                  {Object.entries(SECTION_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabledSections[key]}
                        onChange={() => toggleSection(key)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? 'Downloading...' : 'Download PNG'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPreview;
