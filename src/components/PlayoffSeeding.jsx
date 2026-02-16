import { getAllDivisions, getTeamsByDivision, sortTeamsByRecord, getConferenceRecord } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';

const seedBadgeColors = [
  'bg-yellow-500 text-white',   // #1 seed
  'bg-gray-500 text-white',     // #2
  'bg-amber-700 text-white',    // #3
  'bg-blue-600 text-white',     // #4
  'bg-purple-600 text-white',   // #5 wild card
  'bg-purple-600 text-white',   // #6 wild card
  'bg-purple-600 text-white',   // #7 wild card
];

const getConferenceSeeding = (teams, predictions, conference) => {
  const divisions = getAllDivisions().filter(d => d.startsWith(conference));

  // Only include a division winner when all 4 teams in that division have predictions
  const divisionWinners = [];
  const nonWinners = [];

  for (const division of divisions) {
    const divTeams = getTeamsByDivision(teams, division);
    const allPredicted = divTeams.every(t => predictions[t.id]);
    if (!allPredicted) continue;

    const sorted = sortTeamsByRecord(divTeams, predictions, teams);
    divisionWinners.push({ ...sorted[0], division });
    nonWinners.push(...sorted.slice(1).map(t => ({ ...t, division })));
  }

  // Sort division winners by record to determine seeds 1-4
  const sortedWinners = sortTeamsByRecord(divisionWinners, predictions, teams);

  // Wild cards: only from divisions that are fully predicted, take best 3
  const sortedWildCards = sortTeamsByRecord(nonWinners, predictions, teams).slice(0, 3);

  return { divisionWinners: sortedWinners, wildCards: sortedWildCards };
};

const PlayoffSeeding = ({ teams }) => {
  const { predictions } = usePredictions();
  const hasPredictions = Object.keys(predictions).length > 0;

  const conferences = ['AFC', 'NFC'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-display tracking-wide text-gray-800 dark:text-gray-100">PLAYOFF SEEDING</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Based on your predictions</p>
      </div>

      {!hasPredictions && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Make predictions for teams to see playoff seeding.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {conferences.map(conference => {
          const { divisionWinners, wildCards } = getConferenceSeeding(teams, predictions, conference);

          return (
            <div key={conference} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className={`p-3 ${conference === 'AFC' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
                <h3 className="text-xl font-display tracking-wider uppercase">{conference} PLAYOFFS</h3>
              </div>

              {/* Division Winners */}
              <div className="px-3 pt-3 pb-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Division Winners ({divisionWinners.length}/4)
                </span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {divisionWinners.map((team, index) => (
                  <SeedRow
                    key={team.id}
                    team={team}
                    record={predictions[team.id]}
                    seed={index + 1}
                    hasBye={index === 0}
                    allTeams={teams}
                    predictions={predictions}
                  />
                ))}
                {divisionWinners.length === 0 && (
                  <div className="p-3 text-sm text-gray-400 dark:text-gray-500 italic">
                    Predict all teams in a division to determine its winner
                  </div>
                )}
              </div>

              {/* Wild Cards */}
              <div className="px-3 pt-3 pb-1 border-t-2 border-gray-300 dark:border-gray-600">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Wild Card ({wildCards.length}/3)
                </span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {wildCards.map((team, index) => (
                  <SeedRow
                    key={team.id}
                    team={team}
                    record={predictions[team.id]}
                    seed={index + 5}
                    allTeams={teams}
                    predictions={predictions}
                  />
                ))}
                {wildCards.length === 0 && (
                  <div className="p-3 text-sm text-gray-400 dark:text-gray-500 italic">
                    Predict all teams in a division to see wild card seeding
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SeedRow = ({ team, record, seed, hasBye, allTeams, predictions }) => {
  const confRecord = allTeams ? getConferenceRecord(team.id, allTeams, predictions) : null;

  return (
    <div className={`p-3 flex items-center justify-between ${hasBye ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
      <div className="flex items-center space-x-3">
        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${seedBadgeColors[seed - 1]}`}>
          {seed}
        </span>
        <img
          src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`}
          alt={`${team.name} logo`}
          className="w-8 h-8 object-contain"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-800 dark:text-gray-100">{team.id}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{team.division}</span>
            {hasBye && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-semibold">
                #1 Seed
              </span>
            )}
          </div>
          {!record && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">No prediction</span>
          )}
        </div>
      </div>

      {record && (
        <div className="text-right">
          <div className="text-2xl font-display text-gray-800 dark:text-gray-100">
            {record.wins}-{record.losses}
          </div>
          <div className="text-xs space-y-0.5">
            <div className="text-gray-500 dark:text-gray-400 font-medium">
              {(record.wins / 17 * 100).toFixed(0)}% win rate
            </div>
            {confRecord && (
              <div className="text-purple-600 dark:text-purple-400 font-medium">
                {confRecord.wins}-{confRecord.losses}{confRecord.ties > 0 && `-${confRecord.ties}`} conf
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayoffSeeding;
