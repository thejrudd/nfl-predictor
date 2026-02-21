import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTeamsByDivision, getStrengthOfSchedule, findCorrespondingGameIndex } from '../utils/scheduleParser';
import { usePredictions } from '../context/PredictionContext';

// Quick-view tooltip showing game-by-game picks (rendered via portal to escape overflow:hidden)
const GameTooltip = ({ team, allTeams, predictions, onClose, anchorRef }) => {
  const teamRecord = predictions[team.id];
  const gameResults = teamRecord?.gameResults || {};
  const [position, setPosition] = useState(null);

  // Position the tooltip relative to the anchor element
  useEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(400, window.innerWidth - 16);
    // Center horizontally on the anchor, clamped to viewport
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: left + window.scrollX,
      width: tooltipWidth,
    });
  }, [anchorRef]);

  // Also compute synced results from opponents
  const fullResults = { ...gameResults };
  for (let i = 0; i < team.opponents.length; i++) {
    if (fullResults[i]) continue;
    const oppId = team.opponents[i];
    const oppRecord = predictions[oppId];
    if (!oppRecord?.gameResults) continue;
    const correspondingIdx = findCorrespondingGameIndex(allTeams, team.id, i, oppId);
    if (correspondingIdx === -1) continue;
    const oppResult = oppRecord.gameResults[correspondingIdx];
    if (oppResult === 'W') fullResults[i] = 'L';
    else if (oppResult === 'L') fullResults[i] = 'W';
    else if (oppResult === 'T') fullResults[i] = 'T';
  }

  const hasAnyResults = Object.keys(fullResults).length > 0;

  if (!position) return null;

  return createPortal(
    <div
      className="fixed z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-3 text-left"
      style={{ top: position.top, left: position.left, width: position.width, position: 'absolute' }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{team.name} — Game-by-Game</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none tooltip-close-btn">×</button>
      </div>
      {!hasAnyResults ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No game picks yet. Click to open and set predictions.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {team.opponents.map((oppId, i) => {
            const result = fullResults[i];
            const isSynced = !gameResults[i] && result;
            return (
              <div key={`${oppId}-${i}`} className="flex items-center space-x-1.5 text-xs py-0.5">
                <span className="font-mono text-gray-400 dark:text-gray-500 w-4 text-right">{i + 1}.</span>
                <img
                  src={`https://a.espncdn.com/i/teamlogos/nfl/500/${oppId}.png`}
                  alt={oppId}
                  className="w-4 h-4 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="font-semibold text-gray-600 dark:text-gray-300 w-7">{oppId}</span>
                {result ? (
                  <span className={`font-bold px-1 rounded text-[10px] ${
                    result === 'W' ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40' :
                    result === 'L' ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40' :
                    'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40'
                  }${isSynced ? ' opacity-60' : ''}`}>
                    {result}
                  </span>
                ) : (
                  <span className="text-gray-300 dark:text-gray-600">—</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>,
    document.body
  );
};

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

// Individual team row with ref for portal tooltip positioning
const TeamRow = ({ team, record, implied, sos, hasGameData, showTooltip, allTeams, predictions, onTeamClick, hoverTimeout, setTooltipTeamId }) => {
  const rowRef = useRef(null);

  return (
    <div key={team.id} className="relative">
      <div
        ref={rowRef}
        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center justify-between group cursor-pointer"
        onClick={() => onTeamClick(team)}
        onMouseEnter={() => {
          hoverTimeout.current = setTimeout(() => setTooltipTeamId(team.id), 400);
        }}
        onMouseLeave={() => {
          clearTimeout(hoverTimeout.current);
          setTooltipTeamId(null);
        }}
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

        <div className="flex items-center space-x-2">
          {/* Info button for touch devices */}
          {(hasGameData || implied.hasAny) && (
            <button
              className="hidden p-1.5 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors touch-info-btn"
              onClick={(e) => {
                e.stopPropagation();
                setTooltipTeamId(showTooltip ? null : team.id);
              }}
              aria-label="View game picks"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

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
        </div>
      </div>

      {/* Game-by-game tooltip (portal) */}
      {showTooltip && (
        <GameTooltip
          team={team}
          allTeams={allTeams}
          predictions={predictions}
          onClose={() => setTooltipTeamId(null)}
          anchorRef={rowRef}
        />
      )}
    </div>
  );
};

// Collapsed team button with tooltip support
const CollapsedTeamButton = ({ team, record, allTeams, predictions, onTeamClick, showTooltip, hoverTimeout, setTooltipTeamId }) => {
  const btnRef = useRef(null);
  const hasData = record?.gameResults && Object.keys(record.gameResults).length > 0;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => onTeamClick(team)}
        className="flex flex-col items-center space-y-1 px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onMouseEnter={() => {
          hoverTimeout.current = setTimeout(() => setTooltipTeamId(team.id), 400);
        }}
        onMouseLeave={() => {
          clearTimeout(hoverTimeout.current);
          setTooltipTeamId(null);
        }}
      >
        <img
          src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`}
          alt={team.name}
          className="w-8 h-8 object-contain"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">{team.id}</span>
        {record ? (
          <span className="text-sm font-display font-bold text-gray-800 dark:text-gray-100">
            {record.wins}-{record.losses}{record.ties > 0 && `-${record.ties}`}
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">--</span>
        )}
      </button>
      {hasData && (
        <button
          className="hidden absolute -top-1 -right-1 p-0.5 rounded-full text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm touch-info-btn"
          onClick={(e) => {
            e.stopPropagation();
            setTooltipTeamId(showTooltip ? null : team.id);
          }}
          aria-label="View game picks"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      {showTooltip && (
        <GameTooltip
          team={team}
          allTeams={allTeams}
          predictions={predictions}
          onClose={() => setTooltipTeamId(null)}
          anchorRef={btnRef}
        />
      )}
    </div>
  );
};

const DivisionCard = ({ division, onTeamClick, getTeamRecord, predictions, allTeams, collapsed, onToggle }) => {
  const divisionTeams = getTeamsByDivision(allTeams, division);
  const conference = division.split(' ')[0];
  const predictedCount = divisionTeams.filter(t => getTeamRecord(t.id)).length;
  const allPredicted = predictedCount === 4;
  const [tooltipTeamId, setTooltipTeamId] = useState(null);
  const hoverTimeout = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!tooltipTeamId) return;
    const handleClick = () => setTooltipTeamId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [tooltipTeamId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full p-4 ${conference === 'AFC' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors flex items-center justify-between`}
      >
        <h2 className="text-2xl font-display tracking-wider uppercase">{division}</h2>
        <div className="flex items-center space-x-3">
          {allPredicted && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">4/4</span>
          )}
          {!allPredicted && predictedCount > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{predictedCount}/4</span>
          )}
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {collapsed ? (
        <div className="p-3 flex items-center justify-around">
          {divisionTeams.map(team => {
            const record = getTeamRecord(team.id);
            return (
              <CollapsedTeamButton
                key={team.id}
                team={team}
                record={record}
                allTeams={allTeams}
                predictions={predictions}
                onTeamClick={onTeamClick}
                showTooltip={tooltipTeamId === team.id}
                hoverTimeout={hoverTimeout}
                setTooltipTeamId={setTooltipTeamId}
              />
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {divisionTeams.map(team => {
            const record = getTeamRecord(team.id);
            const implied = getImpliedRecord(team.id, allTeams, predictions);
            const sos = getStrengthOfSchedule(team.id, allTeams, predictions);
            const hasGameData = record?.gameResults && Object.keys(record.gameResults).length > 0;
            const showTooltip = tooltipTeamId === team.id;

            return (
              <TeamRow
                key={team.id}
                team={team}
                record={record}
                implied={implied}
                sos={sos}
                hasGameData={hasGameData}
                showTooltip={showTooltip}
                allTeams={allTeams}
                predictions={predictions}
                onTeamClick={onTeamClick}
                hoverTimeout={hoverTimeout}
                setTooltipTeamId={setTooltipTeamId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const DIVISION_PAIRS = ['East', 'North', 'South', 'West'];

const LG_BREAKPOINT = 1024; // matches Tailwind's lg: breakpoint

const TeamList = ({ teams, onTeamClick }) => {
  const { getTeamRecord, predictions } = usePredictions();
  const [collapsedDivs, setCollapsedDivs] = useState({});

  const toggleDiv = (division) => {
    const isLg = window.innerWidth >= LG_BREAKPOINT;
    if (isLg) {
      // Two-column: toggle both AFC and NFC for this subdivision
      const subDiv = division.split(' ').slice(1).join(' ');
      const afc = `AFC ${subDiv}`;
      const nfc = `NFC ${subDiv}`;
      const newVal = !collapsedDivs[division];
      setCollapsedDivs(prev => ({ ...prev, [afc]: newVal, [nfc]: newVal }));
    } else {
      // Single-column: toggle only the clicked division
      setCollapsedDivs(prev => ({ ...prev, [division]: !prev[division] }));
    }
  };

  return (
    <div className="space-y-6">
      {DIVISION_PAIRS.map(subDiv => (
        <div key={subDiv} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DivisionCard
            division={`AFC ${subDiv}`}
            onTeamClick={onTeamClick}
            getTeamRecord={getTeamRecord}
            predictions={predictions}
            allTeams={teams}
            collapsed={!!collapsedDivs[`AFC ${subDiv}`]}
            onToggle={() => toggleDiv(`AFC ${subDiv}`)}
          />
          <DivisionCard
            division={`NFC ${subDiv}`}
            onTeamClick={onTeamClick}
            getTeamRecord={getTeamRecord}
            predictions={predictions}
            allTeams={teams}
            collapsed={!!collapsedDivs[`NFC ${subDiv}`]}
            onToggle={() => toggleDiv(`NFC ${subDiv}`)}
          />
        </div>
      ))}
    </div>
  );
};

export default TeamList;
