import { getAllDivisions, getTeamsByDivision, getStrengthOfSchedule, findCorrespondingGameIndex } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';

// Compute implied game results for a team from all saved predictions
const getImpliedRecord = (teamId, teams, predictions) => {
  const team = teams.find(t => t.id === teamId);
  if (!team) return { wins: 0, losses: 0, ties: 0, divWins: 0, divLosses: 0, divTies: 0, hasAny: false };

  let wins = 0, losses = 0, ties = 0, divWins = 0, divLosses = 0, divTies = 0;
  let hasAny = false;

  for (let i = 0; i < team.opponents.length; i++) {
    const oppId = team.opponents[i];
    const oppRecord = predictions[oppId];
    if (!oppRecord?.gameResults) continue;
    const correspondingIdx = findCorrespondingGameIndex(teams, teamId, i, oppId);
    if (correspondingIdx === -1) continue;
    const oppResult = oppRecord.gameResults[correspondingIdx];
    if (!oppResult) continue;

    const oppTeam = teams.find(t => t.id === oppId);
    const isDivision = oppTeam && oppTeam.division === team.division;
    hasAny = true;

    if (oppResult === 'W') { // Opponent won = we lost
      losses++;
      if (isDivision) divLosses++;
    } else if (oppResult === 'L') { // Opponent lost = we won
      wins++;
      if (isDivision) divWins++;
    } else if (oppResult === 'T') {
      ties++;
      if (isDivision) divTies++;
    }
  }

  return { wins, losses, ties, divWins, divLosses, divTies, hasAny };
};

const TeamList = ({ teams, onTeamClick }) => {
  const { getTeamRecord, predictions } = usePredictions();
  const divisions = getAllDivisions();

  return (
    <div className="space-y-8">
      {divisions.map(division => {
        const divisionTeams = getTeamsByDivision(teams, division);
        const conference = division.split(' ')[0]; // "AFC" or "NFC"

        return (
          <div key={division} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className={`p-4 ${conference === 'AFC' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
              <h2 className="text-2xl font-display tracking-wider uppercase">{division}</h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {divisionTeams.map(team => {
                const record = getTeamRecord(team.id);
                const implied = getImpliedRecord(team.id, teams, predictions);
                const sos = getStrengthOfSchedule(team.id, teams, predictions);

                return (
                  <button
                    key={team.id}
                    onClick={() => onTeamClick(team)}
                    className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <img
                        src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`}
                        alt={`${team.name} logo`}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-lg">
                          {team.name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono font-semibold">{team.id}</p>
                        {sos && (
                          <p className={`text-[10px] font-medium ${
                            sos.avgOppWins >= 9.5 ? 'text-red-500' :
                            sos.avgOppWins >= 8.5 ? 'text-orange-500' :
                            sos.avgOppWins <= 7.5 ? 'text-green-500' :
                            'text-gray-400 dark:text-gray-500'
                          }`}>
                            SOS: {sos.avgOppWins.toFixed(1)} avg opp wins
                            {sos.predictedOpponents < sos.totalOpponents && (
                              <span className="text-gray-400 dark:text-gray-500"> ({sos.predictedOpponents}/{sos.totalOpponents})</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {record ? (
                        <div>
                          <div className="text-2xl font-display text-gray-800 dark:text-gray-100">
                            {record.wins}-{record.losses}{record.ties > 0 && `-${record.ties}`}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {record.divisionWins !== undefined ? `${record.divisionWins}-${6 - record.divisionWins} in division` : 'Click to edit'}
                          </p>
                          {implied.hasAny && (
                            <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">
                              {implied.divWins}W-{implied.divLosses}L{implied.divTies > 0 && `-${implied.divTies}T`} from matchups
                            </p>
                          )}
                        </div>
                      ) : implied.hasAny ? (
                        <div>
                          <div className="text-lg font-display text-blue-500 dark:text-blue-400">
                            {implied.wins}-{implied.losses}{implied.ties > 0 && `-${implied.ties}`}
                          </div>
                          <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">
                            {implied.divWins}W-{implied.divLosses}L{implied.divTies > 0 && `-${implied.divTies}T`} div (from matchups)
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Click to predict</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not set</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Click to predict</p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamList;
