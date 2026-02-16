const GameResultToggle = ({ value, onToggle, canMarkWin, canMarkLoss, canMarkTie }) => {
  const handleClick = () => {
    if (value === undefined) {
      if (canMarkWin) onToggle('W');
      else if (canMarkLoss) onToggle('L');
      else if (canMarkTie) onToggle('T');
    } else if (value === 'W') {
      if (canMarkLoss) onToggle('L');
      else if (canMarkTie) onToggle('T');
      else onToggle(undefined);
    } else if (value === 'L') {
      if (canMarkTie) onToggle('T');
      else onToggle(undefined);
    } else {
      // value === 'T'
      onToggle(undefined);
    }
  };

  const base = 'w-8 h-8 rounded text-xs font-bold flex items-center justify-center cursor-pointer transition-colors select-none flex-shrink-0';

  if (value === 'W') {
    return (
      <button onClick={handleClick} className={`${base} bg-green-500 text-white hover:bg-green-600`}>
        W
      </button>
    );
  }
  if (value === 'L') {
    return (
      <button onClick={handleClick} className={`${base} bg-red-500 text-white hover:bg-red-600`}>
        L
      </button>
    );
  }
  if (value === 'T') {
    return (
      <button onClick={handleClick} className={`${base} bg-amber-500 text-white hover:bg-amber-600`}>
        T
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      disabled={!canMarkWin && !canMarkLoss && !canMarkTie}
      className={`${base} ${
        canMarkWin || canMarkLoss || canMarkTie
          ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed'
      }`}
    >
      --
    </button>
  );
};

export default GameResultToggle;
