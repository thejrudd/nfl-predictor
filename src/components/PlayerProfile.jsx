import { useState, useEffect } from 'react';
import { fetchPlayerStats, fetchPlayerCareerStats, fetchGameLog, fetchPlayerBio, headshot, CURRENT_SEASON } from '../utils/playerApi';
import { buildStatMap, getCareerHighlights } from '../utils/playerMetrics';
import { usePredictions } from '../context/PredictionContext';
import PlayerStatTable from './PlayerStatTable';
import honorsData from '../data/honors.json';

const YEARS_TO_SHOW = 10;

const PlayerProfile = ({ playerId, playerMeta, teamId, teams, onBack }) => {
  const { getTeamRecord } = usePredictions();

  // statsJson for each year, fetched lazily
  const [statsByYear, setStatsByYear] = useState({});
  const [loadingYears, setLoadingYears] = useState({});
  const [errorYears, setErrorYears] = useState({});

  // Career stats (separate endpoint)
  const [careerStats, setCareerStats] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerError, setCareerError] = useState(null);

  // Game-by-game logs per year
  const [gameLogByYear, setGameLogByYear] = useState({});
  const [loadingGameLog, setLoadingGameLog] = useState({});

  // Current season auto-expanded, others collapsed
  const [expandedYears, setExpandedYears] = useState({ [CURRENT_SEASON]: true });

  // Headshot visibility
  const [headshotError, setHeadshotError] = useState(false);

  // Per-season honor badges: { '2024': ['NFL MVP', 'Pro Bowl', '1st Team All-Pro'], ... }
  const [honorsByYear, setHonorsByYear] = useState({});

  const team = teams?.find(t => t.id === teamId);
  const teamRecord = getTeamRecord(teamId);

  // Build year list: current down to the player's rookie season (capped at YEARS_TO_SHOW), plus 'career'.
  // ESPN increments experience.years at end-of-season to count total seasons played (including the
  // one just completed), so firstSeason = CURRENT_SEASON - (experience - 1), not - experience.
  // Math.max(0, ...) guards against experience=0 mid-season rookies yielding a future year.
  const firstSeason = CURRENT_SEASON - Math.max(0, (playerMeta.experience ?? 0) - 1);
  const years = Array.from({ length: YEARS_TO_SHOW }, (_, i) => CURRENT_SEASON - i)
    .filter(year => year >= firstSeason);

  // Fetch stats for a year when its accordion is expanded
  const loadYear = async (year) => {
    if (statsByYear[year] !== undefined || loadingYears[year]) return;

    setLoadingYears(prev => ({ ...prev, [year]: true }));
    try {
      const data = await fetchPlayerStats(playerId, year);
      setStatsByYear(prev => ({ ...prev, [year]: data }));
    } catch (e) {
      setErrorYears(prev => ({ ...prev, [year]: 'Failed to load stats.' }));
    } finally {
      setLoadingYears(prev => ({ ...prev, [year]: false }));
    }
  };

  // Load current season stats + game log + career stats + honors on mount
  useEffect(() => {
    loadYear(CURRENT_SEASON);
    loadGameLogForYear(CURRENT_SEASON);

    // Eagerly load career stats for hero card display
    (async () => {
      setCareerLoading(true);
      try {
        const data = await fetchPlayerCareerStats(playerId);
        setCareerStats(data);
      } catch {
        setCareerError('Failed to load career stats.');
      } finally {
        setCareerLoading(false);
      }
    })();

    // Build honorsByYear from static file + ESPN bio API awards
    (async () => {
      try {
        const merged = {};

        // 1. Static Pro Bowl / All-Pro data from honors.json
        const staticHonors = honorsData[String(playerId)] ?? {};
        for (const [year, honors] of Object.entries(staticHonors)) {
          merged[year] = [...(merged[year] ?? []), ...honors];
        }

        // 2. Dynamic major awards from ESPN bio (MVP, OPOY, Walter Payton, etc.)
        const bioData = await fetchPlayerBio(playerId);
        for (const award of (bioData.awards ?? [])) {
          for (const season of (award.seasons ?? [])) {
            merged[season] = [...(merged[season] ?? []), award.name];
          }
        }

        setHonorsByYear(merged);
      } catch { /* honors are non-critical — fail silently */ }
    })();
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGameLogForYear = async (year) => {
    if (gameLogByYear[year] !== undefined || loadingGameLog[year] || !teamId) return;
    setLoadingGameLog(prev => ({ ...prev, [year]: true }));
    try {
      const log = await fetchGameLog(playerId, teamId, year);
      setGameLogByYear(prev => ({ ...prev, [year]: log }));
    } catch {
      setGameLogByYear(prev => ({ ...prev, [year]: [] }));
    } finally {
      setLoadingGameLog(prev => ({ ...prev, [year]: false }));
    }
  };

  const toggleYear = (year) => {
    const willExpand = !expandedYears[year];
    setExpandedYears(prev => ({ ...prev, [year]: willExpand }));
    if (willExpand) {
      loadYear(year);
      loadGameLogForYear(year);
    }
  };

  const toggleCareer = async () => {
    const willExpand = !expandedYears['career'];
    setExpandedYears(prev => ({ ...prev, career: willExpand }));
    if (willExpand && careerStats === null && !careerLoading) {
      setCareerLoading(true);
      try {
        const data = await fetchPlayerCareerStats(playerId);
        setCareerStats(data);
      } catch {
        setCareerError('Failed to load career stats.');
      } finally {
        setCareerLoading(false);
      }
    }
  };

  // Career highlight totals for hero card
  const careerHighlights = careerStats
    ? getCareerHighlights(buildStatMap(careerStats), playerMeta.position)
    : [];

  const rookieLabel = `Active Since ${firstSeason}`;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Player Stats
      </button>

      {/* Profile hero card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Headshot */}
          <div className="shrink-0">
            {!headshotError ? (
              <img
                src={headshot(playerId)}
                alt={playerMeta.displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-xl bg-gray-100 dark:bg-gray-700"
                onError={() => setHeadshotError(true)}
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                  {(playerMeta.displayName ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <h1 className="text-3xl font-display tracking-wide text-gray-900 dark:text-white">
                {playerMeta.displayName}
              </h1>
              {playerMeta.jersey && (
                <span className="text-xl text-gray-400 dark:text-gray-500 font-semibold">
                  #{playerMeta.jersey}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap justify-center sm:justify-start items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {playerMeta.positionName || playerMeta.position}
              </span>
              {team && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <img
                      src={`https://a.espncdn.com/i/teamlogos/nfl/500/${teamId}.png`}
                      alt={team.name}
                      className="w-4 h-4 object-contain"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    {team.name}
                  </span>
                </>
              )}
              <span>·</span>
              <span>{rookieLabel}</span>
              {teamRecord && (
                <>
                  <span>·</span>
                  <span className="text-blue-500 dark:text-blue-400 font-medium">
                    Team: {teamRecord.wins}–{teamRecord.losses}
                    {teamRecord.ties > 0 ? `–${teamRecord.ties}` : ''}
                  </span>
                </>
              )}
            </div>

            {/* Career highlight pods */}
            {careerHighlights.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                {careerHighlights.map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 min-w-[60px]"
                  >
                    <span className={`text-lg font-bold leading-tight ${color}`}>{value}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats accordion */}
      <div className="space-y-2">
        {years.map(year => (
          <PlayerStatTable
            key={year}
            year={year}
            statsJson={statsByYear[year] ?? null}
            position={playerMeta.position}
            expanded={!!expandedYears[year]}
            onToggle={() => toggleYear(year)}
            loading={!!loadingYears[year]}
            error={errorYears[year] ?? null}
            gameLog={gameLogByYear[year] ?? null}
            gameLogLoading={!!loadingGameLog[year]}
            honors={honorsByYear[String(year)] ?? []}
          />
        ))}
        {/* Career row */}
        <PlayerStatTable
          key="career"
          year="career"
          statsJson={careerStats}
          position={playerMeta.position}
          expanded={!!expandedYears['career']}
          onToggle={toggleCareer}
          loading={careerLoading}
          error={careerError}
        />
      </div>
    </div>
  );
};

export default PlayerProfile;
