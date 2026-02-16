import { getAllDivisions, getTeamsByDivision, sortTeamsByRecord } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';
import { validateTotalWinsLosses, validateDivisionRecords } from '../utils/validation';

const StandingsTable = ({ teams }) => {
  const { predictions } = usePredictions();
  const divisions = getAllDivisions();

  // Validate that total wins equals total losses
  const validation = validateTotalWinsLosses(predictions);
  const divisionValidation = validateDivisionRecords(predictions, teams);
  const hasPredictions = Object.keys(predictions).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-display tracking-wide text-gray-800">DIVISION STANDINGS</h2>
        <p className="text-sm text-gray-500">Based on your predictions</p>
      </div>

      {/* Status Messages */}
      {Object.keys(predictions).length < 32 ? (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">
                Predictions In Progress
              </h3>
              <p className="text-sm text-blue-700">
                Complete predictions for all 32 teams to see final standings. ({Object.keys(predictions).length}/32 teams predicted)
              </p>
            </div>
          </div>
        </div>
      ) : validation.isValid && divisionValidation.isValid ? (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                ✓ All Predictions Complete!
              </h3>
              <p className="text-sm text-green-700">
                Your predictions are mathematically valid. All 32 teams predicted with consistent records.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {divisions.map(division => {
          const divisionTeams = getTeamsByDivision(teams, division);
          const sortedTeams = sortTeamsByRecord(divisionTeams, predictions);
          const conference = division.split(' ')[0]; // "AFC" or "NFC"

          return (
            <div key={division} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className={`p-3 ${conference === 'AFC' ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
                <h3 className="text-xl font-display tracking-wider uppercase">{division}</h3>
              </div>

              <div className="divide-y divide-gray-200">
                {sortedTeams.map((team, index) => {
                  const record = predictions[team.id];
                  const isLeader = index === 0 && record;

                  return (
                    <div
                      key={team.id}
                      className={`p-3 flex items-center justify-between ${
                        isLeader ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-display text-gray-400 w-4">
                          {index + 1}
                        </span>
                        <img
                          src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`}
                          alt={`${team.name} logo`}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-800">
                              {team.id}
                            </span>
                            {isLeader && (
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                Leader
                              </span>
                            )}
                          </div>
                          {!record && (
                            <span className="text-xs text-gray-400 italic">
                              No prediction
                            </span>
                          )}
                        </div>
                      </div>

                      {record && (
                        <div className="text-right">
                          <div className="text-2xl font-display text-gray-800">
                            {record.wins}-{record.losses}
                          </div>
                          <div className="text-xs space-y-0.5">
                            <div className="text-gray-500 font-medium">
                              {(record.wins / 17 * 100).toFixed(0)}% win rate
                            </div>
                            {record.divisionWins !== undefined && (
                              <div className="font-semibold text-blue-600">
                                {record.divisionWins}-{6 - record.divisionWins} division
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StandingsTable;
