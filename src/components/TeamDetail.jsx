import { useState, useEffect, useCallback } from 'react';
import { getOpponentDetails, findCorrespondingGameIndex } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';
import RecordSetter from './RecordSetter';
import GameResultToggle from './GameResultToggle';

const TeamDetail = ({ team, allTeams, onClose }) => {
  const { getTeamRecord, setTeamRecord, predictions } = usePredictions();
  const existingRecord = getTeamRecord(team.id);

  const [wins, setWins] = useState(existingRecord?.wins || 8);
  const [losses, setLosses] = useState(existingRecord?.losses || 9);
  const [ties, setTies] = useState(existingRecord?.ties || 0);
  const [divisionWins, setDivisionWins] = useState(existingRecord?.divisionWins || 3);
  const [validationError, setValidationError] = useState(null);

  const opponents = getOpponentDetails(allTeams, team);

  // Initialize game results: start from saved data, then fill in synced results
  // from other teams' predictions (e.g., if BUF marked W vs MIA, MIA sees L vs BUF)
  const [gameResults, setGameResults] = useState(() => {
    const saved = { ...(existingRecord?.gameResults || {}) };
    for (let i = 0; i < team.opponents.length; i++) {
      if (saved[i]) continue; // Don't override existing results
      const oppId = team.opponents[i];
      const oppRecord = predictions[oppId];
      if (!oppRecord?.gameResults) continue;
      const correspondingIdx = findCorrespondingGameIndex(allTeams, team.id, i, oppId);
      if (correspondingIdx === -1) continue;
      const oppResult = oppRecord.gameResults[correspondingIdx];
      if (oppResult === 'W') saved[i] = 'L';
      else if (oppResult === 'L') saved[i] = 'W';
      else if (oppResult === 'T') saved[i] = 'T';
    }
    return saved;
  });

  // Calculate global win/loss balance constraints
  // Total wins across all 32 teams must equal 272
  const TOTAL_GAMES = 272;
  const otherPredictedWins = Object.entries(predictions).reduce((sum, [id, record]) => {
    if (id === team.id) return sum;
    return sum + record.wins;
  }, 0);
  const otherPredictedLosses = Object.entries(predictions).reduce((sum, [id, record]) => {
    if (id === team.id) return sum;
    return sum + record.losses;
  }, 0);
  const remainingUnpredicted = allTeams.filter(t => t.id !== team.id && !predictions[t.id]).length;

  // This team's wins + remaining unpredicted teams' wins must fill the gap to 272
  // globalMinWins: even if all remaining teams win 17, this team needs at least this many
  // globalMaxWins: even if all remaining teams win 0, this team can have at most this many
  const globalMinWins = Math.max(0, TOTAL_GAMES - otherPredictedWins - remainingUnpredicted * 17);
  const globalMaxWins = Math.min(17, TOTAL_GAMES - otherPredictedWins - remainingUnpredicted * 0);
  // Same logic for losses (total losses must also equal 272)
  const globalMinLosses = Math.max(0, TOTAL_GAMES - otherPredictedLosses - remainingUnpredicted * 17);
  const globalMaxLosses = Math.min(17, TOTAL_GAMES - otherPredictedLosses - remainingUnpredicted * 0);
  // Convert loss constraints to win constraints (wins = 17 - losses - ties)
  // maxLosses → minWins, minLosses → maxWins
  const globalMinWinsFromLosses = Math.max(0, 17 - globalMaxLosses);
  const globalMaxWinsFromLosses = Math.min(17, 17 - globalMinLosses);

  const combinedGlobalMinWins = Math.max(globalMinWins, globalMinWinsFromLosses);
  const combinedGlobalMaxWins = Math.min(globalMaxWins, globalMaxWinsFromLosses);

  // Calculate max possible division wins for this team
  const divisionTeams = allTeams.filter(t => t.division === team.division);
  const otherTeamsDivisionWins = divisionTeams.reduce((sum, t) => {
    if (t.id === team.id) return sum;
    const record = predictions[t.id];
    return sum + (record?.divisionWins || 0);
  }, 0);
  // Pairwise constraint: combined division wins with any single rival can't exceed 10
  const maxFromPairwise = divisionTeams.reduce((minSoFar, t) => {
    if (t.id === team.id) return minSoFar;
    const otherDivWins = predictions[t.id]?.divisionWins;
    if (otherDivWins === undefined) return minSoFar;
    return Math.min(minSoFar, 10 - otherDivWins);
  }, 6);
  const maxPossibleDivisionWins = Math.min(6, 12 - otherTeamsDivisionWins, maxFromPairwise);
  const minPossibleDivisionWins = Math.max(0, 12 - otherTeamsDivisionWins - (divisionTeams.length - 1 - divisionTeams.filter(t => t.id !== team.id && predictions[t.id]).length) * 6);

  // Game pick constraints
  const pickedWins = Object.values(gameResults).filter(r => r === 'W').length;
  const pickedLosses = Object.values(gameResults).filter(r => r === 'L').length;
  const pickedTies = Object.values(gameResults).filter(r => r === 'T').length;
  const undecidedCount = opponents.length - pickedWins - pickedLosses - pickedTies;
  const gamePickMinWins = pickedWins;
  const gamePickMaxWins = pickedWins + undecidedCount;

  // Division game pick constraints
  const divisionGameIndices = opponents
    .map((opp, i) => opp.division === team.division ? i : -1)
    .filter(i => i !== -1);
  const pickedDivWins = divisionGameIndices.filter(i => gameResults[i] === 'W').length;
  const pickedDivLosses = divisionGameIndices.filter(i => gameResults[i] === 'L').length;
  const pickedDivTies = divisionGameIndices.filter(i => gameResults[i] === 'T').length;
  const undecidedDivGames = divisionGameIndices.length - pickedDivWins - pickedDivLosses - pickedDivTies;
  const gamePickMinDivWins = pickedDivWins;
  const gamePickMaxDivWins = pickedDivWins + undecidedDivGames;

  // Conference game pick tracking
  const conferenceGameIndices = opponents
    .map((opp, i) => opp.conference === team.conference ? i : -1)
    .filter(i => i !== -1);
  const pickedConfWins = conferenceGameIndices.filter(i => gameResults[i] === 'W').length;
  const pickedConfLosses = conferenceGameIndices.filter(i => gameResults[i] === 'L').length;
  const pickedConfTies = conferenceGameIndices.filter(i => gameResults[i] === 'T').length;
  const pickedConfGames = pickedConfWins + pickedConfLosses + pickedConfTies;

  // Combine all constraint sources
  const finalMinWins = Math.max(combinedGlobalMinWins, gamePickMinWins);
  const finalMaxWins = Math.min(combinedGlobalMaxWins, gamePickMaxWins);
  const finalMinDivWins = Math.max(minPossibleDivisionWins, gamePickMinDivWins);
  const finalMaxDivWins = Math.min(maxPossibleDivisionWins, gamePickMaxDivWins);

  // Can the user mark more W/L/T picks?
  const canMarkMoreWins = pickedWins < combinedGlobalMaxWins;
  const canMarkMoreLosses = pickedLosses < (17 - combinedGlobalMinWins);
  const canMarkMoreTies = pickedTies < 4; // Max 4 ties allowed by RecordSetter
  const canMarkMoreDivWins = pickedDivWins < maxPossibleDivisionWins;
  const canMarkMoreDivLosses = pickedDivLosses < (6 - minPossibleDivisionWins);

  const handleGameResultToggle = (gameIndex, result) => {
    setGameResults(prev => {
      const next = { ...prev };
      if (result === undefined) {
        delete next[gameIndex];
      } else {
        next[gameIndex] = result;
      }
      return next;
    });
    setValidationError(null);
  };

  // Auto-clamp wins/divisionWins when game picks change
  useEffect(() => {
    if (wins < pickedWins) setWins(pickedWins);
    if (wins > gamePickMaxWins) setWins(gamePickMaxWins);
    if (divisionWins < pickedDivWins) setDivisionWins(pickedDivWins);
    if (divisionWins > gamePickMaxDivWins) setDivisionWins(gamePickMaxDivWins);
  }, [pickedWins, pickedDivWins, gamePickMaxWins, gamePickMaxDivWins]); // eslint-disable-line react-hooks/exhaustive-deps

  // Snap ties slider to match game-level tie count when it changes
  useEffect(() => {
    setTies(pickedTies);
  }, [pickedTies]);

  const handleRecordChange = useCallback((newWins, newLosses, newDivisionWins, newTies) => {
    setWins(newWins);
    setLosses(newLosses);
    setDivisionWins(newDivisionWins);
    setTies(newTies || 0);
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

    // Pairwise constraint: any two teams in the same division play each other twice,
    // so their combined division wins can't exceed 10 (2 head-to-head + 4 each vs other 2 teams)
    const MAX_PAIRWISE_DIVISION_WINS = 10;
    for (const t of divisionTeams) {
      if (t.id === team.id) continue;
      const otherRecord = predictions[t.id];
      if (!otherRecord) continue;
      const combined = divisionWins + otherRecord.divisionWins;
      if (combined > MAX_PAIRWISE_DIVISION_WINS) {
        setValidationError(
          `❌ Invalid: ${team.id} (${divisionWins} div wins) + ${t.id} (${otherRecord.divisionWins} div wins) = ${combined} combined division wins. ` +
          `Two teams that play each other twice can have at most ${MAX_PAIRWISE_DIVISION_WINS} combined. ` +
          `Reduce division wins to ${MAX_PAIRWISE_DIVISION_WINS - otherRecord.divisionWins} or lower.`
        );
        return;
      }
    }

    // If validation passes, save the record with game results and cross-team sync
    setValidationError(null);
    setTeamRecord(team.id, wins, losses, divisionWins, gameResults, allTeams, ties);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
            <h3 className="text-xl font-display tracking-wide text-gray-700 dark:text-gray-200 mb-4">SET PREDICTED RECORD</h3>

            {/* Global Balance Info */}
            {Object.keys(predictions).filter(id => id !== team.id).length > 0 && (
              <div className="mb-4 p-3 rounded-lg border-2 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                <div className="flex items-start space-x-2">
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">League Balance</p>
                    <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      <strong>{otherPredictedWins}</strong> of <strong>272</strong> total wins assigned.
                      {remainingUnpredicted > 0 && (
                        <> {remainingUnpredicted} team{remainingUnpredicted !== 1 ? 's' : ''} still unpredicted.</>
                      )}
                      {' '}This team can have <strong>{combinedGlobalMinWins}-{combinedGlobalMaxWins}</strong> wins.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Division Wins Constraint Info */}
            {divisionTeams.filter(t => t.id !== team.id && predictions[t.id]).length > 0 && (
              <div className={`mb-4 p-3 rounded-lg border-2 ${
                maxPossibleDivisionWins === 6
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                  : maxPossibleDivisionWins >= 3
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                  : 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
              }`}>
                <div className="flex items-start space-x-2">
                  <svg className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    maxPossibleDivisionWins === 6
                      ? 'text-green-600 dark:text-green-400'
                      : maxPossibleDivisionWins >= 3
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      maxPossibleDivisionWins === 6
                        ? 'text-green-800 dark:text-green-300'
                        : maxPossibleDivisionWins >= 3
                        ? 'text-blue-800 dark:text-blue-300'
                        : 'text-orange-800 dark:text-orange-300'
                    }`}>
                      Division Record Constraints
                    </p>
                    <p className={`text-xs mt-1 ${
                      maxPossibleDivisionWins === 6
                        ? 'text-green-700 dark:text-green-400'
                        : maxPossibleDivisionWins >= 3
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-orange-700 dark:text-orange-400'
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
              initialTies={ties}
              initialDivisionWins={divisionWins}
              maxDivisionWins={finalMaxDivWins}
              minDivisionWins={finalMinDivWins}
              globalMaxWins={finalMaxWins}
              globalMinWins={finalMinWins}
              minTies={pickedTies}
              onChange={handleRecordChange}
            />
          </div>

          {/* Opponents List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-display tracking-wide text-gray-700 dark:text-gray-200">
                2026 OPPONENTS ({opponents.length} GAMES)
              </h3>
              {pickedWins + pickedLosses + pickedTies > 0 && (
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span className="text-green-600">{pickedWins}W</span>
                  {' / '}
                  <span className="text-red-600">{pickedLosses}L</span>
                  {pickedTies > 0 && <>
                    {' / '}
                    <span className="text-amber-600">{pickedTies}T</span>
                  </>}
                  {' / '}
                  <span className="text-gray-400">{undecidedCount} TBD</span>
                </span>
              )}
            </div>
            {/* Conference & Division record from picks */}
            {pickedConfGames > 0 && (
              <div className="flex space-x-4 mb-3 text-xs font-semibold">
                <span className="text-purple-600 dark:text-purple-400">
                  {team.conference}: {pickedConfWins}-{pickedConfLosses}{pickedConfTies > 0 && `-${pickedConfTies}`}
                  {pickedConfGames < conferenceGameIndices.length && (
                    <span className="text-gray-400 dark:text-gray-500 font-normal"> ({pickedConfGames}/{conferenceGameIndices.length})</span>
                  )}
                </span>
                {pickedDivWins + pickedDivLosses + pickedDivTies > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">
                    DIV: {pickedDivWins}-{pickedDivLosses}{pickedDivTies > 0 && `-${pickedDivTies}`}
                    {pickedDivWins + pickedDivLosses + pickedDivTies < divisionGameIndices.length && (
                      <span className="text-gray-400 dark:text-gray-500 font-normal"> ({pickedDivWins + pickedDivLosses + pickedDivTies}/{divisionGameIndices.length})</span>
                    )}
                  </span>
                )}
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              {(() => {
                const midpoint = Math.ceil(opponents.length / 2);
                const col1 = opponents.slice(0, midpoint);
                const col2 = opponents.slice(midpoint);

                const OpponentRow = ({ opponent, gameNum, gameIndex }) => {
                  const isDivision = opponent.division === team.division;
                  const result = gameResults[gameIndex];

                  const canWin = isDivision
                    ? (canMarkMoreWins && canMarkMoreDivWins) || result === 'W'
                    : canMarkMoreWins || result === 'W';
                  const canLose = isDivision
                    ? (canMarkMoreLosses && canMarkMoreDivLosses) || result === 'L'
                    : canMarkMoreLosses || result === 'L';
                  const canTie = canMarkMoreTies || result === 'T';

                  return (
                    <div
                      className={`flex items-center space-x-2 text-sm rounded px-2 py-1 ${
                        result === 'W' ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' :
                        result === 'L' ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700' :
                        result === 'T' ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700' :
                        isDivision ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700' : ''
                      }`}
                    >
                      <GameResultToggle
                        value={result}
                        onToggle={(newResult) => handleGameResultToggle(gameIndex, newResult)}
                        canMarkWin={canWin}
                        canMarkLoss={canLose}
                        canMarkTie={canTie}
                      />
                      <span className="text-gray-400 dark:text-gray-500 font-mono w-6 flex-shrink-0">{gameNum}.</span>
                      <img
                        src={`https://a.espncdn.com/i/teamlogos/nfl/500/${opponent.id}.png`}
                        alt={opponent.name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className={`font-semibold truncate ${
                        result === 'W' ? 'text-green-700 dark:text-green-400' :
                        result === 'L' ? 'text-red-700 dark:text-red-400' :
                        result === 'T' ? 'text-amber-700 dark:text-amber-400' :
                        isDivision ? 'text-yellow-800 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-200'
                      }`}>
                        {opponent.id}
                      </span>
                      <span className={`text-xs hidden sm:inline ${isDivision ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        {opponent.division}
                      </span>
                      {isDivision && (
                        <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded uppercase tracking-wide ml-auto whitespace-nowrap flex-shrink-0">
                          DIV
                        </span>
                      )}
                    </div>
                  );
                };

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="space-y-1.5">
                      {col1.map((opponent, index) => (
                        <OpponentRow key={`${opponent.id}-${index}`} opponent={opponent} gameNum={index + 1} gameIndex={index} />
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {col2.map((opponent, index) => (
                        <OpponentRow key={`${opponent.id}-${midpoint + index}`} opponent={opponent} gameNum={midpoint + index + 1} gameIndex={midpoint + index} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Validation Error Display */}
          {validationError && (
            <div className="px-4 pt-4">
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  {validationError}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="p-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
