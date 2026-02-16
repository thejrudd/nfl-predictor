import { createContext, useContext, useState, useEffect } from 'react';

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

  // Set a team's win/loss record and division record
  const setTeamRecord = (teamId, wins, losses, divisionWins = 3) => {
    setPredictions(prev => ({
      ...prev,
      [teamId]: { wins, losses, divisionWins }
    }));
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

  return (
    <PredictionContext.Provider
      value={{
        predictions,
        setTeamRecord,
        getTeamRecord,
        resetAllPredictions,
        getPredictionCount
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
