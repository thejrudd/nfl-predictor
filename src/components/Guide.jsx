import { useEffect } from 'react';

const GUIDE_CONTENT = {
  predictions: {
    title: 'HOW TO PREDICT',
    steps: [
      {
        title: 'Pick a Team',
        description: 'Tap any team from the division cards to open the prediction editor for that team.',
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
        description: 'The progress bar shows how many of the 32 teams you\'ve predicted so far.',
      },
      {
        title: 'Stay Valid',
        description: 'A green "Valid" badge appears when the league balances — exactly 272 total wins across all teams.',
      },
      {
        title: 'View Results',
        description: 'Switch to the Standings or Playoffs tabs to see projected division rankings and the playoff bracket.',
      },
      {
        title: 'Save & Share',
        description: 'Export your predictions as a JSON file to save them, or import a previously saved file to restore your picks.',
      },
    ],
  },
  statistics: {
    title: 'HOW TO USE STATISTICS',
    steps: [
      {
        title: 'Browse by Division',
        description: 'Teams are organized by conference and division. Scroll through to find any team in the league.',
      },
      {
        title: 'Open a Team Page',
        description: 'Tap any team card to view their full roster, key players, and franchise history.',
      },
      {
        title: 'Key Players Strip',
        description: 'The top of each team page highlights the depth-chart starter at each key position — QB, RB, WR, and more.',
      },
      {
        title: 'Full Roster',
        description: 'Scroll down to see the complete roster organized by position group. Tap any group to expand it.',
      },
      {
        title: 'Player Profiles',
        description: 'Tap any player to view their detailed profile, including position, experience, and headshot.',
      },
    ],
  },
  companion: {
    title: 'COMPANION',
    steps: [
      {
        title: 'Coming in v4.0',
        description: 'The Companion section will include fantasy league integration, Sleeper sync, and advanced analytics.',
      },
      {
        title: 'Sleeper Sync',
        description: 'Connect your Sleeper account to overlay your fantasy roster onto NFL team pages and prediction cards.',
      },
      {
        title: 'Advanced Analytics',
        description: 'Historical win-rate comparisons, strength-of-schedule breakdowns, and prediction accuracy tracking.',
      },
    ],
  },
};

const Guide = ({ onClose, activeTab = 'predictions' }) => {
  const content = GUIDE_CONTENT[activeTab] ?? GUIDE_CONTENT.predictions;
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
          <h2 className="text-2xl font-display tracking-wide">{content.title}</h2>
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
          {content.steps.map((step, i) => (
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
