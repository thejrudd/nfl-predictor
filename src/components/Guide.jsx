import { useEffect } from 'react';

const steps = [
  {
    title: 'Pick a Team',
    description: 'Tap any team from the division cards on the main screen to open the prediction editor.',
  },
  {
    title: 'Set the Record',
    description: 'Use the record controls to set wins, losses, and ties — or toggle individual game outcomes for more precision.',
  },
  {
    title: 'Auto-Sync',
    description: "Predictions sync with opponents automatically. If you pick Team A to beat Team B, Team B's schedule updates with that loss.",
  },
  {
    title: 'Track Progress',
    description: 'The progress bar at the top shows how many of the 32 teams you\'ve predicted so far.',
  },
  {
    title: 'Stay Valid',
    description: 'A green "Valid" badge appears when the league balances — exactly 272 total wins across all teams.',
  },
  {
    title: 'View Results',
    description: 'Switch to the Standings tab to see projected division rankings, or Playoff Seeding to see the bracket.',
  },
  {
    title: 'Save & Share',
    description: 'Export your predictions as a JSON file to save them, or import a previously saved file to restore your picks.',
  },
];

const Guide = ({ onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    // Lock body scroll while guide is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-display tracking-wide">HOW TO USE</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none"
            aria-label="Close guide"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guide;
