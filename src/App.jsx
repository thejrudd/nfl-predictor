import { useEffect, useState, useRef } from 'react';
import { loadScheduleData } from './utils/scheduleParser';
import { usePredictions } from './context/PredictionContext';
import { useTheme } from './context/ThemeContext';
import { validateTotalWinsLosses } from './utils/validation';
import { exportAsJSON, importFromJSON, exportAsImage } from './utils/exportImport';
import TeamList from './components/TeamList';
import TeamDetail from './components/TeamDetail';
import StandingsTable from './components/StandingsTable';
import PlayoffSeeding from './components/PlayoffSeeding';
import Guide from './components/Guide';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentView, setCurrentView] = useState('predictions'); // 'predictions', 'standings', or 'playoffs'

  const { getPredictionCount, resetAllPredictions, predictions, importPredictions } = usePredictions();
  const { darkMode, toggleDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  const exportContainerRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    loadScheduleData()
      .then(data => {
        setScheduleData(data);
        setLoading(false);
        console.log('Loaded data:', data);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        console.error('Error loading data:', err);
      });
  }, []);

  const handleExportJSON = () => {
    exportAsJSON(predictions);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      importPredictions(data);
      alert(`Imported predictions for ${Object.keys(data).length} teams.`);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
    // Reset file input so re-importing the same file works
    e.target.value = '';
  };

  const handleExportImage = async () => {
    setExporting(true);
    // Wait for React to render the off-screen container
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await exportAsImage(exportContainerRef.current);
    } catch (err) {
      alert(`Image export failed: ${err.message}`);
    }
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  const predictionCount = getPredictionCount();
  const totalTeams = scheduleData.teams.length;
  const validation = validateTotalWinsLosses(predictions);
  const hasPredictions = predictionCount > 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-display tracking-wide text-gray-900 dark:text-white">
                NFL SEASON PREDICTOR
              </h1>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">2026 SEASON</p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-start space-x-4 w-full sm:w-auto">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{predictionCount}</span>
                <span className="text-gray-500 dark:text-gray-400"> / {totalTeams} teams predicted</span>
              </div>

              {/* Validation Status Badge */}
              {hasPredictions && validation.isValid && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
                  ✓ Valid
                </span>
              )}

              {/* Desktop controls */}
              <div className="hidden sm:flex items-center space-x-4">
                <button
                  onClick={() => setGuideOpen(true)}
                  className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Guide
                </button>
                <button
                  onClick={handleExportImage}
                  disabled={exporting || predictionCount === 0}
                  className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exporting...' : 'Export Image'}
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={predictionCount === 0}
                  className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  Import
                </button>
                <button
                  onClick={resetAllPredictions}
                  disabled={predictionCount === 0}
                  className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset All
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="relative sm:hidden ml-auto">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1">
                      <button
                        onClick={() => { handleExportImage(); setMenuOpen(false); }}
                        disabled={exporting || predictionCount === 0}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {exporting ? 'Exporting...' : 'Export Image'}
                      </button>
                      <button
                        onClick={() => { handleExportJSON(); setMenuOpen(false); }}
                        disabled={predictionCount === 0}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Export JSON
                      </button>
                      <button
                        onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Import
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <button
                        onClick={() => { setGuideOpen(true); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Guide
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <button
                        onClick={() => { resetAllPredictions(); setMenuOpen(false); }}
                        disabled={predictionCount === 0}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reset All
                      </button>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(predictionCount / totalTeams) * 100}%` }}
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setCurrentView('predictions')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentView === 'predictions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              MAKE PREDICTIONS
            </button>
            <button
              onClick={() => setCurrentView('standings')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentView === 'standings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              VIEW STANDINGS
            </button>
            <button
              onClick={() => setCurrentView('playoffs')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentView === 'playoffs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              PLAYOFF SEEDING
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        {currentView === 'predictions' && (
          <TeamList
            teams={scheduleData.teams}
            onTeamClick={setSelectedTeam}
          />
        )}
        {currentView === 'standings' && (
          <StandingsTable teams={scheduleData.teams} />
        )}
        {currentView === 'playoffs' && (
          <PlayoffSeeding teams={scheduleData.teams} />
        )}
      </div>

      {/* Guide Modal */}
      {guideOpen && <Guide onClose={() => setGuideOpen(false)} />}

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          allTeams={scheduleData.teams}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {/* Version Footer */}
      <footer className="mt-auto max-w-6xl mx-auto px-4 pb-6 sm:px-6 lg:px-8 text-center w-full">
        <p className="text-xs text-gray-400 dark:text-gray-600">V1.02</p>
      </footer>

      {/* Off-screen container for image export — renders all views */}
      {exporting && (
        <div
          ref={exportContainerRef}
          style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px' }}
          className="bg-gray-100 dark:bg-gray-900 p-8 space-y-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-4xl font-display tracking-wide text-gray-900 dark:text-white">NFL SEASON PREDICTOR</h1>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">2026 SEASON — {predictionCount}/{totalTeams} Teams Predicted</p>
          </div>
          <TeamList teams={scheduleData.teams} onTeamClick={() => {}} />
          <StandingsTable teams={scheduleData.teams} />
          <PlayoffSeeding teams={scheduleData.teams} />
        </div>
      )}

    </div>
  );
}

export default App;
