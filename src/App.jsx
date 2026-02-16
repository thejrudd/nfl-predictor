import { useEffect, useState } from 'react';
import { loadScheduleData } from './utils/scheduleParser';
import { usePredictions } from './context/PredictionContext';
import { validateTotalWinsLosses } from './utils/validation';
import TeamList from './components/TeamList';
import TeamDetail from './components/TeamDetail';
import StandingsTable from './components/StandingsTable';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentView, setCurrentView] = useState('predictions'); // 'predictions' or 'standings'

  const { getPredictionCount, resetAllPredictions, predictions } = usePredictions();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">No data available</div>
      </div>
    );
  }

  const predictionCount = getPredictionCount();
  const totalTeams = scheduleData.teams.length;
  const validation = validateTotalWinsLosses(predictions);
  const hasPredictions = predictionCount > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-display tracking-wide text-gray-900">
                NFL SEASON PREDICTOR
              </h1>
              <p className="text-sm font-semibold text-blue-600 mt-1">2026 SEASON</p>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-semibold text-gray-700">{predictionCount}</span>
                <span className="text-gray-500"> / {totalTeams} teams predicted</span>
              </div>

              {/* Validation Status Badge */}
              {hasPredictions && (
                <div>
                  {validation.isValid ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                      ✓ Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                      ⚠ Invalid
                    </span>
                  )}
                </div>
              )}

              {predictionCount > 0 && (
                <button
                  onClick={resetAllPredictions}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
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
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              MAKE PREDICTIONS
            </button>
            <button
              onClick={() => setCurrentView('standings')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentView === 'standings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              VIEW STANDINGS
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {currentView === 'predictions' ? (
          <TeamList
            teams={scheduleData.teams}
            onTeamClick={setSelectedTeam}
          />
        ) : (
          <StandingsTable teams={scheduleData.teams} />
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          allTeams={scheduleData.teams}
          onClose={() => setSelectedTeam(null)}
        />
      )}

    </div>
  );
}

export default App;
