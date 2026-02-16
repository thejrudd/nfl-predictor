import { useState, useEffect, useCallback } from 'react';
import { getOpponentDetails } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';
import RecordSetter from './RecordSetter';

const TeamDetail = ({ team, allTeams, onClose }) => {
  const { getTeamRecord, setTeamRecord, predictions } = usePredictions();
  const existingRecord = getTeamRecord(team.id);

  const [wins, setWins] = useState(existingRecord?.wins || 8);
  const [losses, setLosses] = useState(existingRecord?.losses || 9);
  const [divisionWins, setDivisionWins] = useState(existingRecord?.divisionWins || 3);
  const [validationError, setValidationError] = useState(null);

  const opponents = getOpponentDetails(allTeams, team);

  // Calculate max possible division wins for this team
  const divisionTeams = allTeams.filter(t => t.division === team.division);
  const otherTeamsDivisionWins = divisionTeams.reduce((sum, t) => {
    if (t.id === team.id) return sum;
    const record = predictions[t.id];
    return sum + (record?.divisionWins || 0);
  }, 0);
  const maxPossibleDivisionWins = Math.min(6, 12 - otherTeamsDivisionWins);
  const minPossibleDivisionWins = Math.max(0, 12 - otherTeamsDivisionWins - (divisionTeams.length - 1 - divisionTeams.filter(t => t.id !== team.id && predictions[t.id]).length) * 6);

  const handleRecordChange = useCallback((newWins, newLosses, newDivisionWins) => {
    setWins(newWins);
    setLosses(newLosses);
    setDivisionWins(newDivisionWins);
    setValidationError(null); // Clear error when user changes values
  }, []); // Empty deps - this function doesn't depend on any props or state

  const handleSave = () => {
    // Validate division record before saving
    const divisionTeams = allTeams.filter(t => t.division === team.division);

    // Calculate current total division wins for this division, excluding this team
    const otherTeamsDivisionWins = divisionTeams.reduce((sum, t) => {
      if (t.id === team.id) return sum; // Skip the current team
      const record = predictions[t.id];
      return sum + (record?.divisionWins || 0);
    }, 0);

    const newTotal = otherTeamsDivisionWins + divisionWins;
    const EXPECTED_DIVISION_WINS = 12;

    // Check if this would make the division total exceed 12
    if (newTotal > EXPECTED_DIVISION_WINS) {
      setValidationError(
        `❌ Invalid division record: ${team.division} would have ${newTotal} total division wins (maximum: ${EXPECTED_DIVISION_WINS}). ` +
        `Please reduce division wins to ${divisionWins - (newTotal - EXPECTED_DIVISION_WINS)} or lower.`
      );
      return;
    }

    // Check if remaining teams could possibly reach exactly 12
    const teamsWithoutPredictions = divisionTeams.filter(t =>
      t.id !== team.id && !predictions[t.id]
    ).length;

    const maxPossibleTotal = newTotal + (teamsWithoutPredictions * 6); // Each team can win max 6 division games

    if (maxPossibleTotal < EXPECTED_DIVISION_WINS) {
      const deficit = EXPECTED_DIVISION_WINS - newTotal;
      setValidationError(
        `❌ Invalid division record: ${team.division} would only have ${newTotal} division wins, ` +
        `but needs ${deficit} more from ${teamsWithoutPredictions} unpredicted team(s) who can only contribute ${maxPossibleTotal - newTotal} wins maximum. ` +
        `Please increase division wins to ${divisionWins + (EXPECTED_DIVISION_WINS - maxPossibleTotal)} or higher.`
      );
      return;
    }

    // If validation passes, save the record
    setValidationError(null);
    setTeamRecord(team.id, wins, losses, divisionWins);
    onClose();
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`}
                alt={`${team.name} logo`}
                className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <h2 className="text-3xl font-display tracking-wide mb-1">{team.name}</h2>
                <p className="text-blue-100 font-semibold">{team.division}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Record Setter */}
          <div className="mb-8">
            <h3 className="text-xl font-display tracking-wide text-gray-700 mb-4">SET PREDICTED RECORD</h3>

            {/* Division Wins Constraint Info */}
            {divisionTeams.filter(t => t.id !== team.id && predictions[t.id]).length > 0 && (
              <div className={`mb-4 p-3 rounded-lg border-2 ${
                maxPossibleDivisionWins === 6
                  ? 'bg-green-50 border-green-300'
                  : maxPossibleDivisionWins >= 3
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-orange-50 border-orange-300'
              }`}>
                <div className="flex items-start space-x-2">
                  <svg className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    maxPossibleDivisionWins === 6
                      ? 'text-green-600'
                      : maxPossibleDivisionWins >= 3
                      ? 'text-blue-600'
                      : 'text-orange-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      maxPossibleDivisionWins === 6
                        ? 'text-green-800'
                        : maxPossibleDivisionWins >= 3
                        ? 'text-blue-800'
                        : 'text-orange-800'
                    }`}>
                      Division Record Constraints
                    </p>
                    <p className={`text-xs mt-1 ${
                      maxPossibleDivisionWins === 6
                        ? 'text-green-700'
                        : maxPossibleDivisionWins >= 3
                        ? 'text-blue-700'
                        : 'text-orange-700'
                    }`}>
                      {team.division} has used <strong>{otherTeamsDivisionWins} of 12</strong> total division wins.
                      {' '}This team can have <strong>{minPossibleDivisionWins}-{maxPossibleDivisionWins}</strong> division wins.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <RecordSetter
              initialWins={wins}
              initialDivisionWins={divisionWins}
              maxDivisionWins={maxPossibleDivisionWins}
              minDivisionWins={minPossibleDivisionWins}
              onChange={handleRecordChange}
            />
          </div>

          {/* Opponents List */}
          <div>
            <h3 className="text-xl font-display tracking-wide text-gray-700 mb-3">
              2026 OPPONENTS ({opponents.length} GAMES)
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {(() => {
                const midpoint = Math.ceil(opponents.length / 2);
                const col1 = opponents.slice(0, midpoint);
                const col2 = opponents.slice(midpoint);

                const OpponentRow = ({ opponent, gameNum }) => {
                  const isDivision = opponent.division === team.division;
                  return (
                    <div
                      className={`flex items-center space-x-2 text-sm rounded px-2 py-1 ${
                        isDivision ? 'bg-yellow-100 border border-yellow-300' : ''
                      }`}
                    >
                      <span className="text-gray-400 font-mono w-6">{gameNum}.</span>
                      <img
                        src={`https://a.espncdn.com/i/teamlogos/nfl/500/${opponent.id}.png`}
                        alt={opponent.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className={`font-semibold ${isDivision ? 'text-yellow-800' : 'text-gray-700'}`}>
                        {opponent.id}
                      </span>
                      <span className={`text-xs ${isDivision ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {opponent.division}
                      </span>
                      {isDivision && (
                        <span className="text-[10px] font-bold text-yellow-700 bg-yellow-200 px-1.5 py-0.5 rounded uppercase tracking-wide ml-auto whitespace-nowrap">
                          Divisional Matchup
                        </span>
                      )}
                    </div>
                  );
                };

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1.5">
                      {col1.map((opponent, index) => (
                        <OpponentRow key={`${opponent.id}-${index}`} opponent={opponent} gameNum={index + 1} />
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {col2.map((opponent, index) => (
                        <OpponentRow key={`${opponent.id}-${midpoint + index}`} opponent={opponent} gameNum={midpoint + index + 1} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Validation Error Display */}
          {validationError && (
            <div className="px-4 pt-4">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">
                  {validationError}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="p-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={validationError !== null}
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                validationError
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Save Prediction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
