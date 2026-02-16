import { findCorrespondingGameIndex } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';

// Get head-to-head results for teamA vs teamB from game picks
const getHeadToHead = (teamA, teamB, allTeams, predictions) => {
  // Find game indices where teamA plays teamB
  const indices = teamA.opponents
    .map((oppId, i) => oppId === teamB.id ? i : -1)
    .filter(i => i !== -1);

  const savedResults = predictions[teamA.id]?.gameResults || {};

  return indices.map((gameIdx) => {
    // Check teamA's own saved result first
    if (savedResults[gameIdx]) return savedResults[gameIdx];

    // Check if opponent has a synced result
    const oppRecord = predictions[teamB.id];
    if (!oppRecord?.gameResults) return null;
    const correspondingIdx = findCorrespondingGameIndex(allTeams, teamA.id, gameIdx, teamB.id);
    if (correspondingIdx === -1) return null;
    const oppResult = oppRecord.gameResults[correspondingIdx];
    if (oppResult === 'W') return 'L';
    if (oppResult === 'L') return 'W';
    if (oppResult === 'T') return 'T';
    return null;
  });
};

const resultColors = {
  W: 'bg-green-500 text-white',
  L: 'bg-red-500 text-white',
  T: 'bg-amber-500 text-white',
};

const DivisionMatrix = ({ divisionTeams, allTeams }) => {
  const { predictions } = usePredictions();

  // Check if there are any game picks at all for this division
  const hasAnyPicks = divisionTeams.some(team => {
    for (const rival of divisionTeams) {
      if (rival.id === team.id) continue;
      const results = getHeadToHead(team, rival, allTeams, predictions);
      if (results.some(r => r !== null)) return true;
    }
    return false;
  });

  if (!hasAnyPicks) return null;

  return (
    <div className="px-3 pb-3">
      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
        Head-to-Head
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead>
            <tr>
              <th className="w-12" />
              {divisionTeams.map(team => (
                <th key={team.id} className="px-1 py-1 font-bold text-gray-600 dark:text-gray-300 text-[11px]">
                  {team.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {divisionTeams.map(rowTeam => (
              <tr key={rowTeam.id}>
                <td className="pr-1 py-0.5 text-right font-bold text-gray-600 dark:text-gray-300 text-[11px]">
                  {rowTeam.id}
                </td>
                {divisionTeams.map(colTeam => {
                  if (rowTeam.id === colTeam.id) {
                    return (
                      <td key={colTeam.id} className="px-1 py-0.5">
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      </td>
                    );
                  }

                  const results = getHeadToHead(rowTeam, colTeam, allTeams, predictions);

                  return (
                    <td key={colTeam.id} className="px-1 py-0.5">
                      <div className="flex justify-center gap-0.5">
                        {results.map((result, i) => (
                          <span
                            key={i}
                            className={`inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold ${
                              result ? resultColors[result] : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                            }`}
                          >
                            {result || '·'}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DivisionMatrix;
