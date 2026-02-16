import { getAllDivisions, getTeamsByDivision } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';

const TeamList = ({ teams, onTeamClick }) => {
  const { getTeamRecord } = usePredictions();
  const divisions = getAllDivisions();

  return (
    <div className="space-y-8">
      {divisions.map(division => {
        const divisionTeams = getTeamsByDivision(teams, division);
        const conference = division.split(' ')[0]; // "AFC" or "NFC"

        return (
          <div key={division} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`p-4 ${conference === 'AFC' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
              <h2 className="text-2xl font-display tracking-wider uppercase">{division}</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {divisionTeams.map(team => {
                const record = getTeamRecord(team.id);

                return (
                  <button
                    key={team.id}
                    onClick={() => onTeamClick(team)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center justify-between group"
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
                        <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors text-lg">
                          {team.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono font-semibold">{team.id}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {record ? (
                        <div>
                          <div className="text-2xl font-display text-gray-800">
                            {record.wins}-{record.losses}
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            {record.divisionWins !== undefined ? `${record.divisionWins}-${6 - record.divisionWins} in division` : 'Click to edit'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm text-gray-400 italic">Not set</span>
                          <p className="text-xs text-gray-500">Click to predict</p>
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
