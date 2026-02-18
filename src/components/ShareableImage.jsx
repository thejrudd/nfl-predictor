import { forwardRef } from 'react';
import { getBestAndWorstTeams, getToughestDivision, getBoldPredictions, getConferenceChampions, getDivisionWinners } from '../utils/exportStats';

const LOGO_URL = (id) => `https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`;

const ShareableImage = forwardRef(({ predictions, teams, enabledSections, userName }, ref) => {
  const stats = {
    bestWorst: getBestAndWorstTeams(predictions, teams),
    toughestDiv: getToughestDivision(predictions, teams),
    bold: getBoldPredictions(predictions, teams),
    confChamps: getConferenceChampions(predictions, teams),
    afcWinners: getDivisionWinners(predictions, teams, 'AFC'),
    nfcWinners: getDivisionWinners(predictions, teams, 'NFC'),
  };

  const activeSections = Object.entries(enabledSections).filter(([, v]) => v).map(([k]) => k);
  const sectionCount = activeSections.length;

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1080, fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif" }}
      className="bg-gray-900 text-white flex flex-col overflow-hidden"
    >
      {/* Header — always shown */}
      <div className="text-center pt-8 pb-4 px-6">
        <h1 className="text-5xl font-bold tracking-wider">NFL SEASON PREDICTOR</h1>
        <p className="text-blue-400 text-lg font-semibold mt-1 tracking-wide">2026 SEASON</p>
        {userName && (
          <p className="text-gray-400 text-base mt-1">Predictions by {userName}</p>
        )}
      </div>

      <div className="w-4/5 mx-auto border-t border-gray-700" />

      {/* Dynamic sections */}
      <div className={`flex-1 px-8 py-4 flex flex-col ${sectionCount <= 3 ? 'justify-evenly' : 'justify-start gap-3'}`}>

        {/* Best & Worst Teams */}
        {enabledSections.bestWorst && stats.bestWorst.best && (
          <div className="flex justify-center gap-12">
            <TeamHighlight
              label="BEST RECORD"
              team={stats.bestWorst.best}
              record={predictions[stats.bestWorst.best.id]}
              accentColor="text-green-400"
              bgColor="bg-green-900/30"
              borderColor="border-green-700"
            />
            <TeamHighlight
              label="WORST RECORD"
              team={stats.bestWorst.worst}
              record={predictions[stats.bestWorst.worst.id]}
              accentColor="text-red-400"
              bgColor="bg-red-900/30"
              borderColor="border-red-700"
            />
          </div>
        )}

        {/* Playoff Seeds — top 3 per conference */}
        {enabledSections.playoffSeeds && (
          <div className="flex justify-center gap-8">
            <ConferenceSeeds
              conference="AFC"
              winners={stats.afcWinners}
              predictions={predictions}
              color="blue"
            />
            <ConferenceSeeds
              conference="NFC"
              winners={stats.nfcWinners}
              predictions={predictions}
              color="red"
            />
          </div>
        )}

        {/* Division Winners */}
        {enabledSections.divisionWinners && (
          <div>
            <SectionLabel>DIVISION WINNERS</SectionLabel>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {[...stats.afcWinners, ...stats.nfcWinners].map(team => (
                <div key={team.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                  <img src={LOGO_URL(team.id)} alt="" className="w-8 h-8 object-contain" />
                  <div>
                    <div className="font-bold text-sm">{team.id}</div>
                    <div className="text-xs text-gray-400">{predictions[team.id]?.wins}-{predictions[team.id]?.losses}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conference Showdown */}
        {enabledSections.conferenceShowdown && stats.confChamps.AFC && stats.confChamps.NFC && (
          <div>
            <SectionLabel>CONFERENCE SHOWDOWN</SectionLabel>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-3 bg-blue-900/30 border border-blue-700 rounded-lg px-5 py-3">
                <img src={LOGO_URL(stats.confChamps.AFC.id)} alt="" className="w-12 h-12 object-contain" />
                <div>
                  <div className="text-xs text-blue-400 font-semibold">AFC BEST</div>
                  <div className="font-bold text-lg">{stats.confChamps.AFC.id}</div>
                  <div className="text-sm text-gray-300">{predictions[stats.confChamps.AFC.id]?.wins}-{predictions[stats.confChamps.AFC.id]?.losses}</div>
                </div>
              </div>
              <span className="text-3xl font-bold text-gray-500">VS</span>
              <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-lg px-5 py-3">
                <img src={LOGO_URL(stats.confChamps.NFC.id)} alt="" className="w-12 h-12 object-contain" />
                <div>
                  <div className="text-xs text-red-400 font-semibold">NFC BEST</div>
                  <div className="font-bold text-lg">{stats.confChamps.NFC.id}</div>
                  <div className="text-sm text-gray-300">{predictions[stats.confChamps.NFC.id]?.wins}-{predictions[stats.confChamps.NFC.id]?.losses}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toughest Division */}
        {enabledSections.toughestDivision && stats.toughestDiv && (
          <div>
            <SectionLabel>TOUGHEST DIVISION</SectionLabel>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="bg-gray-800 rounded-lg px-5 py-3 text-center">
                <div className="font-bold text-lg text-amber-400">{stats.toughestDiv.division}</div>
                <div className="text-sm text-gray-300">{stats.toughestDiv.totalWins} combined wins</div>
                <div className="flex justify-center gap-2 mt-2">
                  {stats.toughestDiv.teams.map(t => (
                    <img key={t.id} src={LOGO_URL(t.id)} alt="" className="w-8 h-8 object-contain" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bold Predictions */}
        {enabledSections.boldPredictions && (stats.bold.highFlyers.length > 0 || stats.bold.cellarDwellers.length > 0) && (
          <div>
            <SectionLabel>BOLD PREDICTIONS</SectionLabel>
            <div className="flex justify-center gap-8 mt-2">
              {stats.bold.highFlyers.length > 0 && (
                <div>
                  <div className="text-xs text-green-400 font-semibold mb-1 text-center">ELITE (12+ WINS)</div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {stats.bold.highFlyers.slice(0, 5).map(t => (
                      <BoldTeamChip key={t.id} team={t} record={predictions[t.id]} color="green" />
                    ))}
                  </div>
                </div>
              )}
              {stats.bold.cellarDwellers.length > 0 && (
                <div>
                  <div className="text-xs text-red-400 font-semibold mb-1 text-center">CELLAR (4- WINS)</div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {stats.bold.cellarDwellers.slice(0, 5).map(t => (
                      <BoldTeamChip key={t.id} team={t} record={predictions[t.id]} color="red" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-4 text-xs text-gray-600">
        nfl-predictor
      </div>
    </div>
  );
});

ShareableImage.displayName = 'ShareableImage';

// --- Sub-components ---

const SectionLabel = ({ children }) => (
  <div className="text-xs font-semibold text-gray-500 tracking-widest uppercase text-center">{children}</div>
);

const TeamHighlight = ({ label, team, record, accentColor, bgColor, borderColor }) => (
  <div className={`${bgColor} border ${borderColor} rounded-xl px-6 py-4 flex items-center gap-4 min-w-[220px]`}>
    <img src={LOGO_URL(team.id)} alt="" className="w-16 h-16 object-contain" />
    <div>
      <div className={`text-xs font-semibold ${accentColor} tracking-wider`}>{label}</div>
      <div className="font-bold text-2xl">{team.id}</div>
      <div className="text-3xl font-bold">{record?.wins}-{record?.losses}</div>
    </div>
  </div>
);

const ConferenceSeeds = ({ conference, winners, predictions, color }) => {
  const top = winners.slice(0, 3);
  const bgClass = color === 'blue' ? 'bg-blue-900/20 border-blue-800' : 'bg-red-900/20 border-red-800';
  const headerClass = color === 'blue' ? 'text-blue-400' : 'text-red-400';

  return (
    <div className={`${bgClass} border rounded-xl px-5 py-3 min-w-[220px]`}>
      <div className={`text-sm font-bold ${headerClass} tracking-wider mb-2`}>{conference} TOP SEEDS</div>
      {top.map((team, i) => (
        <div key={team.id} className="flex items-center gap-3 py-1.5">
          <span className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 text-white">
            {i + 1}
          </span>
          <img src={LOGO_URL(team.id)} alt="" className="w-8 h-8 object-contain" />
          <span className="font-bold text-sm">{team.id}</span>
          <span className="text-sm text-gray-400 ml-auto">{predictions[team.id]?.wins}-{predictions[team.id]?.losses}</span>
        </div>
      ))}
      {top.length === 0 && (
        <div className="text-xs text-gray-500 italic py-2">Predict full divisions to see seeds</div>
      )}
    </div>
  );
};

const BoldTeamChip = ({ team, record, color }) => {
  const bg = color === 'green' ? 'bg-green-900/40 border-green-800' : 'bg-red-900/40 border-red-800';
  return (
    <div className={`${bg} border rounded-lg px-3 py-1.5 flex items-center gap-2`}>
      <img src={LOGO_URL(team.id)} alt="" className="w-6 h-6 object-contain" />
      <span className="font-bold text-xs">{team.id}</span>
      <span className="text-xs text-gray-400">{record?.wins}-{record?.losses}</span>
    </div>
  );
};

export default ShareableImage;
