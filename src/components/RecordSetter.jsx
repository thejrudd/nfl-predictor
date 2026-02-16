import { useState, useEffect } from 'react';

const RecordSetter = ({
  initialWins = 8,
  initialTies = 0,
  initialDivisionWins = 3,
  maxDivisionWins = 6,
  minDivisionWins = 0,
  onChange
}) => {
  const [wins, setWins] = useState(initialWins);
  const [ties, setTies] = useState(initialTies);
  const [divisionWins, setDivisionWins] = useState(initialDivisionWins);
  const losses = 17 - wins - ties;
  const divisionLosses = 6 - divisionWins;

  // Clamp wins if ties push total over 17
  useEffect(() => {
    if (wins + ties > 17) {
      setWins(17 - ties);
    }
  }, [ties, wins]);

  // Clamp division wins to valid range when constraints change
  useEffect(() => {
    if (divisionWins > maxDivisionWins) {
      setDivisionWins(maxDivisionWins);
    } else if (divisionWins < minDivisionWins) {
      setDivisionWins(minDivisionWins);
    }
  }, [maxDivisionWins, minDivisionWins, divisionWins]);

  // Update parent when values change
  useEffect(() => {
    onChange(wins, losses, divisionWins, ties);
  }, [wins, losses, divisionWins, ties, onChange]);

  const maxWins = 17 - ties;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-6xl font-display text-gray-800 mb-2 tracking-wider">
          {wins}-{losses}{ties > 0 && `-${ties}`}
        </div>
        <p className="text-sm font-semibold text-gray-500 tracking-wide">
          {ties > 0 ? 'W - L - T' : 'PREDICTED RECORD'}
        </p>
      </div>

      {/* Wins slider */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Wins: {wins}</span>
            <span className="text-sm text-gray-500">Losses: {losses}</span>
          </div>
          <input
            type="range"
            min="0"
            max={maxWins}
            value={wins}
            onChange={(e) => setWins(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(wins / maxWins) * 100}%, #e5e7eb ${(wins / maxWins) * 100}%, #e5e7eb 100%)`
            }}
          />
        </label>

        <div className="flex justify-between text-xs text-gray-400">
          <span>0-{maxWins}{ties > 0 && `-${ties}`}</span>
          <span>{Math.floor(maxWins / 2)}-{maxWins - Math.floor(maxWins / 2)}{ties > 0 && `-${ties}`}</span>
          <span>{maxWins}-0{ties > 0 && `-${ties}`}</span>
        </div>
      </div>

      {/* Quick preset buttons for wins */}
      <div className="grid grid-cols-6 gap-2 mt-4">
        {[0, 3, 6, 9, 12, 17].filter(v => v <= maxWins).map(value => (
          <button
            key={value}
            onClick={() => setWins(value)}
            className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
              wins === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {value}-{maxWins - value}{ties > 0 && `-${ties}`}
          </button>
        ))}
      </div>

      {/* Ties slider */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Ties: {ties}</span>
            <span className="text-xs text-gray-400">Rare, but it happens!</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            value={ties}
            onChange={(e) => setTies(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(ties / 4) * 100}%, #e5e7eb ${(ties / 4) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        </label>
      </div>

      {/* Division Record */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <label className="block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Division Record (Tiebreaker)</span>
            <span className="text-lg font-bold text-blue-600">
              {divisionWins}-{divisionLosses}
            </span>
          </div>
          <input
            type="range"
            min={minDivisionWins}
            max={maxDivisionWins}
            value={divisionWins}
            onChange={(e) => setDivisionWins(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${maxDivisionWins > 0 ? (divisionWins / maxDivisionWins) * 100 : 0}%, #e5e7eb ${maxDivisionWins > 0 ? (divisionWins / maxDivisionWins) * 100 : 0}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{minDivisionWins}-{6 - minDivisionWins}</span>
            <span>{Math.floor((minDivisionWins + maxDivisionWins) / 2)}-{6 - Math.floor((minDivisionWins + maxDivisionWins) / 2)}</span>
            <span>{maxDivisionWins}-{6 - maxDivisionWins}</span>
          </div>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Each team plays 6 division games (3 opponents × 2 games). Used to break ties when teams have the same overall record.
        </p>

        {/* Quick preset buttons */}
        <div className="grid grid-cols-7 gap-1 mt-3">
          {[0, 1, 2, 3, 4, 5, 6]
            .filter(value => value >= minDivisionWins && value <= maxDivisionWins)
            .map(value => (
              <button
                key={value}
                onClick={() => setDivisionWins(value)}
                className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                  divisionWins === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value}-{6 - value}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RecordSetter;
