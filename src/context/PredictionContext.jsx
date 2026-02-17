import { createContext, useContext, useState, useEffect } from 'react';
import { findCorrespondingGameIndex } from '../utils/scheduleParser';

const PredictionContext = createContext();

export const PredictionProvider = ({ children }) => {
  // predictions = { "KC": {wins: 14, losses: 3, divisionWins: 5}, "BUF": {wins: 12, losses: 5, divisionWins: 4}, ... }
  const [predictions, setPredictions] = useState({});

  // Load predictions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nfl-predictions-2026');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPredictions(parsed);
        console.log('Loaded predictions from localStorage:', parsed);
      } catch (error) {
        console.error('Error loading predictions from localStorage:', error);
      }
    }
  }, []);

  // Save predictions to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(predictions).length > 0) {
      localStorage.setItem('nfl-predictions-2026', JSON.stringify(predictions));
      console.log('Saved predictions to localStorage');
    }
  }, [predictions]);

  // Set a team's win/loss record, division record, and optional game results
  // allTeams is needed for cross-team sync of game results
  const setTeamRecord = (teamId, wins, losses, divisionWins = 3, gameResults = {}, allTeams = null, ties = 0) => {
    setPredictions(prev => {
      const next = { ...prev, [teamId]: { wins, losses, divisionWins, gameResults, ties } };

      // Cross-team sync: update opponents' game results with inverse
      if (allTeams) {
        const team = allTeams.find(t => t.id === teamId);
        if (team) {
          // Build set of current game results for diffing
          const prevGameResults = prev[teamId]?.gameResults || {};

          // Process all 17 game slots
          for (let i = 0; i < team.opponents.length; i++) {
            const opponentId = team.opponents[i];
            const correspondingIdx = findCorrespondingGameIndex(allTeams, teamId, i, opponentId);
            if (correspondingIdx === -1) continue;

            const newResult = gameResults[i];
            const oldResult = prevGameResults[i];

            // Skip if nothing changed for this game
            if (newResult === oldResult) continue;

            // Only sync if the opponent already has a saved prediction
            // (unsaved opponents get synced results computed on-the-fly in TeamDetail)
            if (!next[opponentId]) continue;

            const oppRecord = { ...next[opponentId] };
            const oppGameResults = { ...(oppRecord.gameResults || {}) };

            if (newResult === 'W') {
              oppGameResults[correspondingIdx] = 'L';
            } else if (newResult === 'L') {
              oppGameResults[correspondingIdx] = 'W';
            } else if (newResult === 'T') {
              oppGameResults[correspondingIdx] = 'T';
            } else {
              // Result was cleared — only clear opponent's if it was set by us
              delete oppGameResults[correspondingIdx];
            }

            oppRecord.gameResults = oppGameResults;

            // Auto-adjust opponent's record if forced picks exceed it
            const oppPickedWins = Object.values(oppGameResults).filter(r => r === 'W').length;
            const oppPickedLosses = Object.values(oppGameResults).filter(r => r === 'L').length;
            const oppPickedTies = Object.values(oppGameResults).filter(r => r === 'T').length;
            const oppTies = oppRecord.ties || 0;
            if (oppPickedTies > oppTies) {
              oppRecord.ties = oppPickedTies;
              // Recalculate wins/losses to fit within 17 - ties
              const available = 17 - oppPickedTies;
              if (oppRecord.wins + oppRecord.losses > available) {
                oppRecord.wins = Math.min(oppRecord.wins, available);
                oppRecord.losses = available - oppRecord.wins;
              }
            }
            if (oppPickedWins > oppRecord.wins) {
              oppRecord.wins = oppPickedWins;
              oppRecord.losses = 17 - oppPickedWins - (oppRecord.ties || 0);
            }
            if (oppPickedLosses > oppRecord.losses) {
              oppRecord.losses = oppPickedLosses;
              oppRecord.wins = 17 - oppPickedLosses - (oppRecord.ties || 0);
            }

            // Auto-adjust division wins if needed
            const oppTeam = allTeams.find(t => t.id === opponentId);
            if (oppTeam) {
              const oppDivGameIndices = oppTeam.opponents
                .map((oId, idx) => {
                  const oTeam = allTeams.find(t => t.id === oId);
                  return oTeam && oTeam.division === oppTeam.division ? idx : -1;
                })
                .filter(idx => idx !== -1);
              const oppPickedDivWins = oppDivGameIndices.filter(idx => oppGameResults[idx] === 'W').length;
              const oppPickedDivLosses = oppDivGameIndices.filter(idx => oppGameResults[idx] === 'L').length;
              if (oppPickedDivWins > oppRecord.divisionWins) {
                oppRecord.divisionWins = oppPickedDivWins;
              }
              if (oppPickedDivLosses > 6 - oppRecord.divisionWins) {
                oppRecord.divisionWins = 6 - oppPickedDivLosses;
              }
            }

            next[opponentId] = oppRecord;
          }
        }
      }

      return next;
    });
  };

  // Get a team's record (or default if not set)
  const getTeamRecord = (teamId) => {
    return predictions[teamId] || null;
  };

  // Reset all predictions
  const resetAllPredictions = () => {
    if (window.confirm('Are you sure you want to reset all predictions? This cannot be undone.')) {
      setPredictions({});
      localStorage.removeItem('nfl-predictions-2026');
      console.log('All predictions reset');
    }
  };

  // Get count of teams with predictions
  const getPredictionCount = () => {
    return Object.keys(predictions).length;
  };

  // Import predictions from an exported JSON object
  const importPredictions = (data) => {
    setPredictions(data);
    localStorage.setItem('nfl-predictions-2026', JSON.stringify(data));
  };

  return (
    <PredictionContext.Provider
      value={{
        predictions,
        setTeamRecord,
        getTeamRecord,
        resetAllPredictions,
        getPredictionCount,
        importPredictions
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

// Custom hook to use the prediction context
export const usePredictions = () => {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePredictions must be used within a PredictionProvider');
  }
  return context;
};
