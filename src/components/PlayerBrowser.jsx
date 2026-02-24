import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchRoster, fetchDepthChart, headshot } from '../utils/playerApi';
import PlayerProfile from './PlayerProfile';

const POSITION_FILTERS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K', 'P'];

const CONFERENCES = [
  {
    name: 'AFC',
    color: 'text-blue-600 dark:text-blue-400',
    divisions: ['AFC East', 'AFC North', 'AFC South', 'AFC West'],
  },
  {
    name: 'NFC',
    color: 'text-red-600 dark:text-red-400',
    divisions: ['NFC East', 'NFC North', 'NFC South', 'NFC West'],
  },
];

// Does a player's position match the active filter?
function matchesFilter(position, filter) {
  if (filter === 'ALL') return true;
  if (filter === 'OL') return ['OT', 'OG', 'C', 'OL', 'G', 'T'].includes(position);
  if (filter === 'DL') return ['DE', 'DT', 'NT', 'DL', 'ED'].includes(position);
  if (filter === 'LB') return ['LB', 'ILB', 'OLB', 'MLB'].includes(position);
  if (filter === 'DB') return ['CB', 'S', 'SS', 'FS', 'DB'].includes(position);
  return position === filter;
}

const PlayerBrowser = ({ teams }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [rosters, setRosters] = useState({});
  const [depthCharts, setDepthCharts] = useState({});
  const [loadingTeam, setLoadingTeam] = useState(null);
  const [rosterError, setRosterError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [positionFilter, setPositionFilter] = useState('ALL');

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced client-side search across all team rosters (rosters are cached in localStorage)
  const handleSearchInput = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setShowSearchDropdown(true);

    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const allRosters = await Promise.all(
          teams.map(team =>
            fetchRoster(team.id)
              .then(players => players.map(p => ({ ...p, teamName: team.name })))
              .catch(() => [])
          )
        );
        const lower = q.trim().toLowerCase();
        const results = allRosters
          .flat()
          .filter(p =>
            p.displayName.toLowerCase().includes(lower) &&
            matchesFilter(p.position, positionFilter)
          )
          .slice(0, 20);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [teams, positionFilter]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTeamClick = async (teamId) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
      return;
    }
    setExpandedTeam(teamId);
    setRosterError(null);
    if (!rosters[teamId]) {
      setLoadingTeam(teamId);
      try {
        const [players, depthChart] = await Promise.all([
          fetchRoster(teamId),
          fetchDepthChart(teamId).catch(() => ({})),
        ]);
        setRosters(prev => ({ ...prev, [teamId]: players }));
        setDepthCharts(prev => ({ ...prev, [teamId]: depthChart }));
      } catch {
        setRosterError(teamId);
      } finally {
        setLoadingTeam(null);
      }
    }
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBack = () => setSelectedPlayer(null);

  // Full-page profile
  if (selectedPlayer) {
    return (
      <PlayerProfile
        playerId={selectedPlayer.id}
        playerMeta={selectedPlayer}
        teamId={selectedPlayer.teamId}
        teams={teams}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search + position filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-3">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
              placeholder="Search for a player…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchLoading && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          {/* Search dropdown */}
          {showSearchDropdown && searchQuery.length >= 2 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.length === 0 && !searchLoading && (
                <p className="px-4 py-3 text-sm text-gray-400 italic">No players found.</p>
              )}
              {searchResults.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <PlayerThumbnail id={player.id} name={player.displayName} size={8} />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{player.displayName}</div>
                    <div className="text-xs text-gray-400">
                      {player.position}{player.teamName ? ` · ${player.teamName}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Position filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {POSITION_FILTERS.map(pos => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                positionFilter === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Team browser — AFC then NFC */}
      {CONFERENCES.map(conf => (
        <div key={conf.name}>
          <h2 className={`text-2xl font-display tracking-wider mb-3 ${conf.color}`}>{conf.name}</h2>
          <div className="space-y-4">
            {conf.divisions.map(division => {
              const divTeams = teams.filter(t => t.division === division);
              return (
                <div key={division}>
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold mb-2 px-1">
                    {division}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {divTeams.map(team => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        expanded={expandedTeam === team.id}
                        loading={loadingTeam === team.id}
                        error={rosterError === team.id}
                        roster={rosters[team.id] ?? null}
                        depthChart={depthCharts[team.id] ?? {}}
                        positionFilter={positionFilter}
                        onTeamClick={() => handleTeamClick(team.id)}
                        onPlayerClick={handleSelectPlayer}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- Team Card ----

const TeamCard = ({ team, expanded, loading, error, roster, depthChart, positionFilter, onTeamClick, onPlayerClick }) => {
  const filteredRoster = roster
    ? roster
        .filter(p => matchesFilter(p.position, positionFilter))
        .sort((a, b) => {
          const ra = depthChart[a.id] ?? Infinity;
          const rb = depthChart[b.id] ?? Infinity;
          return ra - rb;
        })
    : [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all ${expanded ? 'col-span-2 sm:col-span-4' : ''}`}>
      {/* Team header */}
      <button
        onClick={onTeamClick}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <img
          src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.id}.png`}
          alt={team.name}
          className="w-10 h-10 object-contain shrink-0"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="flex-1 text-left min-w-0">
          <div className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{team.name}</div>
          <div className="text-xs text-gray-400 font-mono">{team.id}</div>
        </div>
        {loading ? (
          <svg className="animate-spin w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Expanded roster */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {error && (
            <p className="px-4 py-3 text-sm text-red-500 dark:text-red-400 italic">Failed to load roster.</p>
          )}
          {!error && filteredRoster.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-gray-400 italic">
              {roster ? 'No players match this position filter.' : 'Loading…'}
            </p>
          )}
          {filteredRoster.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
              {filteredRoster.map(player => {
                const rank = depthChart[player.id];
                const showRank = positionFilter !== 'ALL' && rank != null;
                return (
                  <button
                    key={player.id}
                    onClick={() => onPlayerClick(player)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
                  >
                    <PlayerThumbnail id={player.id} name={player.displayName} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                          {player.displayName}
                        </span>
                        {showRank && (
                          <span className="shrink-0 text-[10px] font-bold tabular-nums text-blue-500 dark:text-blue-400">
                            {positionFilter}{rank}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        #{player.jersey} · {player.positionName || player.position}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Small headshot with initials fallback
const PlayerThumbnail = ({ id, name, size = 8 }) => {
  const [err, setErr] = useState(false);
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const cls = `w-${size} h-${size} rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0`;

  return err ? (
    <div className={`w-${size} h-${size} rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0`}>
      <span className="text-[10px] font-bold text-gray-400">{initials}</span>
    </div>
  ) : (
    <img src={headshot(id)} alt="" className={cls} onError={() => setErr(true)} />
  );
};

export default PlayerBrowser;
