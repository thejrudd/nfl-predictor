import { useState, useEffect } from 'react';

const RecordSetter = ({
  initialWins = 8,
  initialTies = 0,
  initialDivisionWins = 3,
  maxDivisionWins = 6,
  minDivisionWins = 0,
  globalMaxWins = 17,
  globalMinWins = 0,
  minTies = 0,
  onChange
}) => {
  const [wins, setWins] = useState(initialWins);
  const [ties, setTies] = useState(initialTies);
  const [divisionWins, setDivisionWins] = useState(initialDivisionWins);
  const losses = 17 - wins - ties;
  const divisionLosses = 6 - divisionWins;

  // Overall wins are constrained by:
  // - Division budget: can't win more than maxDivisionWins + 11, can't win fewer than minDivisionWins
  // - Global balance: total league wins must equal 272
  const maxWins = Math.min(17 - ties, maxDivisionWins + 11 - ties, globalMaxWins);
  const minWins = Math.max(0, minDivisionWins, globalMinWins);

  // Division wins can't exceed overall wins, and division losses can't exceed overall losses
  const effectiveMaxDivisionWins = Math.min(maxDivisionWins, wins, 6);
  const effectiveMinDivisionWins = Math.max(minDivisionWins, wins + ties - 11, 0);

  // Sync internal state from parent when parent drives changes (e.g., game pick clamping)
  useEffect(() => { setWins(initialWins); }, [initialWins]);
  useEffect(() => { setDivisionWins(initialDivisionWins); }, [initialDivisionWins]);
  useEffect(() => { setTies(initialTies); }, [initialTies]);

  // Clamp wins to valid range
  useEffect(() => {
    if (wins > maxWins) {
      setWins(maxWins);
    } else if (wins < minWins) {
      setWins(minWins);
    }
  }, [wins, maxWins, minWins]);

  // Clamp ties to respect minimum from game picks
  useEffect(() => {
    if (ties < minTies) {
      setTies(minTies);
    }
  }, [ties, minTies]);

  // Clamp division wins to valid range when constraints change
  useEffect(() => {
    if (divisionWins > effectiveMaxDivisionWins) {
      setDivisionWins(effectiveMaxDivisionWins);
    } else if (divisionWins < effectiveMinDivisionWins) {
      setDivisionWins(effectiveMinDivisionWins);
    }
  }, [effectiveMaxDivisionWins, effectiveMinDivisionWins, divisionWins]);

  // Update parent when values change
  useEffect(() => {
    onChange(wins, losses, divisionWins, ties);
  }, [wins, losses, divisionWins, ties, onChange]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-6xl font-display text-gray-800 dark:text-gray-100 mb-2 tracking-wider">
          {wins}-{losses}{ties > 0 && `-${ties}`}
        </div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
          {ties > 0 ? 'W - L - T' : 'PREDICTED RECORD'}
        </p>
      </div>

      {/* Wins slider */}
      <div className="space-y-2">
        <label className="block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wins: {wins}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Losses: {losses}</span>
          </div>
          <input
            type="range"
            min={minWins}
            max={maxWins}
            value={wins}
            onChange={(e) => setWins(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${maxWins > minWins ? ((wins - minWins) / (maxWins - minWins)) * 100 : 100}%, #e5e7eb ${maxWins > minWins ? ((wins - minWins) / (maxWins - minWins)) * 100 : 100}%, #e5e7eb 100%)`
            }}
          />
        </label>

        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{minWins}-{17 - ties - minWins}{ties > 0 && `-${ties}`}</span>
          <span>{Math.floor((minWins + maxWins) / 2)}-{17 - ties - Math.floor((minWins + maxWins) / 2)}{ties > 0 && `-${ties}`}</span>
          <span>{maxWins}-{17 - ties - maxWins}{ties > 0 && `-${ties}`}</span>
        </div>
      </div>

      {/* Quick preset buttons for wins */}
      <div className="grid grid-cols-6 gap-2 mt-4">
        {[0, 3, 6, 9, 12, 17].filter(v => v >= minWins && v <= maxWins).map(value => (
          <button
            key={value}
            onClick={() => setWins(value)}
            className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
              wins === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {value}-{17 - ties - value}{ties > 0 && `-${ties}`}
          </button>
        ))}
      </div>

      {/* Ties slider */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <label className="block">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ties: {ties}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Rare, but it happens!</span>
          </div>
          <input
            type="range"
            min={minTies}
            max="4"
            value={ties}
            onChange={(e) => setTies(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${4 - minTies > 0 ? ((ties - minTies) / (4 - minTies)) * 100 : 100}%, #e5e7eb ${4 - minTies > 0 ? ((ties - minTies) / (4 - minTies)) * 100 : 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            {[0, 1, 2, 3, 4].filter(v => v >= minTies).map(v => (
              <span key={v}>{v}</span>
            ))}
          </div>
        </label>
      </div>

      {/* Division Record */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Division Record (Tiebreaker)</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {divisionWins}-{divisionLosses}
          </span>
        </div>

        {effectiveMinDivisionWins === effectiveMaxDivisionWins ? (
          /* Locked - only one valid option */
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-center">
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Locked at {effectiveMinDivisionWins}-{6 - effectiveMinDivisionWins}
            </span>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              Determined by the overall record and division constraints.
            </p>
          </div>
        ) : (
          /* Slider and buttons */
          <>
            <label className="block">
              <input
                type="range"
                min={effectiveMinDivisionWins}
                max={effectiveMaxDivisionWins}
                value={divisionWins}
                onChange={(e) => setDivisionWins(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((divisionWins - effectiveMinDivisionWins) / (effectiveMaxDivisionWins - effectiveMinDivisionWins)) * 100}%, #e5e7eb ${((divisionWins - effectiveMinDivisionWins) / (effectiveMaxDivisionWins - effectiveMinDivisionWins)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>{effectiveMinDivisionWins}-{6 - effectiveMinDivisionWins}</span>
                <span>{Math.floor((effectiveMinDivisionWins + effectiveMaxDivisionWins) / 2)}-{6 - Math.floor((effectiveMinDivisionWins + effectiveMaxDivisionWins) / 2)}</span>
                <span>{effectiveMaxDivisionWins}-{6 - effectiveMaxDivisionWins}</span>
              </div>
            </label>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-7 gap-1 mt-3">
              {[0, 1, 2, 3, 4, 5, 6]
                .filter(value => value >= effectiveMinDivisionWins && value <= effectiveMaxDivisionWins)
                .map(value => (
                  <button
                    key={value}
                    onClick={() => setDivisionWins(value)}
                    className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                      divisionWins === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value}-{6 - value}
                  </button>
                ))}
            </div>
          </>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Each team plays 6 division games (3 opponents x 2 games). Used to break ties when teams have the same overall record.
        </p>
      </div>
    </div>
  );
};

export default RecordSetter;
